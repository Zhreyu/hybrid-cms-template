import type { BlockComponentProps, Reference, ResolvedRouteParams } from 'cms-renderer/lib/types';
import type { Header } from '@/generated/cms-schemas';
import {
  getCategories,
  getCategoryPostRefsMap,
  getCategoryTitleField,
  getOrderingValue,
  getPostsAndStaticRoutesByIds,
  getSectionsByIds,
  resolveRef,
} from '@/lib/cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from '@/lib/display-title';
import { getPostHref } from '@/lib/docs-href';
import { getRouteCategoryId, getSectionCategoryIds } from '@/lib/docs-sections';
import { getRouteSegment } from '@/lib/route-segment';
import { getSearchEntries } from '@/lib/search-index';
import NavbarClient, { type NavLink } from './NavbarClient';

type RawNavLinkValue = Record<string, unknown>;

export type NavbarBlockProps = Omit<Header, 'nav_links'> & {
  nav_links?: RawNavLinkValue[];
};

type ResolvedReferenceLike = {
  title?: unknown;
  schema_name?: unknown;
};

type NavEntryLike = {
  _ref?: unknown;
  _schema?: unknown;
  _resolved?: ResolvedReferenceLike | null;
  label?: unknown;
  href?: unknown;
  active?: unknown;
};

type SelectedNavReference = {
  id: string;
  schemaName?: string;
  resolvedTitle?: string;
};

type CategoryMap = Map<string, Awaited<ReturnType<typeof getCategories>>[number]>;

function isNavLink(link: NavLink | null): link is NavLink {
  return link !== null;
}

function isSelectedNavReference(item: SelectedNavReference | null): item is SelectedNavReference {
  return item !== null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function getFirstCategoryPostId(
  category: Awaited<ReturnType<typeof getCategories>>[number],
  categoryPostRefsById: Map<string, Reference[]>
): string | null {
  const firstPostId = categoryPostRefsById.get(String(category._id))?.[0]?._ref;
  return typeof firstPostId === 'string' && firstPostId.length > 0 ? firstPostId : null;
}

function getFirstSectionPostId(
  section: { categories_list?: Reference[] },
  categoriesById: CategoryMap,
  categoryPostRefsById: Map<string, Reference[]>
): string | null {
  for (const categoryRef of section.categories_list ?? []) {
    const category = resolveRef(categoryRef, categoriesById);
    const postId = category ? getFirstCategoryPostId(category, categoryPostRefsById) : null;
    if (postId) {
      return postId;
    }
  }

  return null;
}

function isCategoryReference(
  item: SelectedNavReference,
  sourceCategoriesById: CategoryMap
): boolean {
  return item.schemaName === 'categories' || sourceCategoriesById.has(item.id);
}

function extractInlineNavLinks(content: NavbarBlockProps): NavLink[] {
  const rawNavLinks = content.nav_links;
  if (!Array.isArray(rawNavLinks)) {
    return [];
  }

  const maybeInlineNavLinks: Array<NavLink | null> = rawNavLinks.map((entry) => {
    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const candidate = entry as NavEntryLike;
    const label = readString(candidate.label);
    const href = readString(candidate.href);
    if (!label || !href) {
      return null;
    }

    return {
      label,
      href,
      active: candidate.active === true,
    };
  });

  return maybeInlineNavLinks.filter(isNavLink);
}

function extractSelectedNavReferences(content: NavbarBlockProps): SelectedNavReference[] {
  const rawNavLinks = content.nav_links;
  if (!Array.isArray(rawNavLinks)) {
    return [];
  }

  const maybeReferences: Array<SelectedNavReference | null> = rawNavLinks.map((entry) => {
    if (typeof entry === 'string') {
      const id = readString(entry);
      return id ? { id } : null;
    }

    if (!entry || typeof entry !== 'object') {
      return null;
    }

    const candidate = entry as NavEntryLike;
    const ref = readString(candidate._ref);
    if (!ref) {
      return null;
    }

    const resolved = candidate._resolved;
    const resolvedSchema =
      resolved && typeof resolved === 'object' ? readString(resolved.schema_name) : null;
    const resolvedTitle =
      resolved && typeof resolved === 'object' ? readString(resolved.title) : null;

    return {
      id: ref,
      schemaName: readString(candidate._schema) ?? resolvedSchema ?? undefined,
      resolvedTitle: resolvedTitle ?? undefined,
    };
  });

  return maybeReferences.filter(isSelectedNavReference);
}

function extractLanguage(routeParams?: ResolvedRouteParams): string | undefined {
  if (!routeParams) return undefined;
  return Object.values(routeParams).find((param) => param.schemaName === 'language')?.value;
}

export default async function NavbarBlock({
  content,
  routeParams,
  language: languageProp,
  path,
}: BlockComponentProps<NavbarBlockProps>) {
  const language = languageProp ?? extractLanguage(routeParams);
  const inlineNavLinks = extractInlineNavLinks(content);
  const selectedNavReferences = extractSelectedNavReferences(content);
  const searchEntries = await getSearchEntries(language);
  const routeParamCategoryId = getRouteCategoryId(routeParams);

  let resolvedNavLinks: NavLink[] = inlineNavLinks;

  if (selectedNavReferences.length > 0) {
    const [sourceCategories, translatedCategories] = await Promise.all([
      getCategories(),
      getCategories(language),
    ]);

    const sourceCategoriesById = new Map(
      sourceCategories.map((category) => [String(category._id), category])
    );
    const translatedCategoriesById = new Map(
      translatedCategories.map((category) => [String(category._id), category])
    );
    const categoryPostRefsById = await getCategoryPostRefsMap(sourceCategories);
    const currentCategoryId =
      routeParamCategoryId ??
      (path
        ? ((sourceCategories.find((category) =>
            categoryPostRefsById.get(String(category._id))?.some((ref) => ref._ref === path)
          )?._id as string | undefined) ?? null)
        : null);

    const categoryReferences = selectedNavReferences.filter((item) =>
      isCategoryReference(item, sourceCategoriesById)
    );
    const categoryReferenceIds = new Set(categoryReferences.map((item) => item.id));
    const sectionReferences = selectedNavReferences.filter(
      (item) => !categoryReferenceIds.has(item.id)
    );

    const [sourceSectionsMap, translatedSectionsMap] = await Promise.all([
      sectionReferences.length > 0
        ? getSectionsByIds(sectionReferences.map((item) => item.id))
        : Promise.resolve(new Map()),
      sectionReferences.length > 0
        ? getSectionsByIds(
            sectionReferences.map((item) => item.id),
            language
          )
        : Promise.resolve(new Map()),
    ]);

    const orderedNavReferences = [...selectedNavReferences].sort((left, right) => {
      const leftCategory = sourceCategoriesById.get(left.id);
      const rightCategory = sourceCategoriesById.get(right.id);
      const leftSection = sourceSectionsMap.get(left.id);
      const rightSection = sourceSectionsMap.get(right.id);
      const leftOrder = getOrderingValue(leftCategory?.ordering ?? leftSection?.ordering);
      const rightOrder = getOrderingValue(rightCategory?.ordering ?? rightSection?.ordering);
      const orderDiff = leftOrder - rightOrder;

      if (orderDiff !== 0) {
        return orderDiff;
      }

      return selectedNavReferences.indexOf(left) - selectedNavReferences.indexOf(right);
    });

    const firstPostIds = orderedNavReferences
      .map((item) => {
        if (categoryReferenceIds.has(item.id)) {
          const category = sourceCategoriesById.get(item.id);
          return category ? getFirstCategoryPostId(category, categoryPostRefsById) : null;
        }

        const section = sourceSectionsMap.get(item.id);
        return section
          ? getFirstSectionPostId(section, sourceCategoriesById, categoryPostRefsById)
          : null;
      })
      .filter((postId): postId is string => postId !== null);

    const sourcePostsMap = await getPostsAndStaticRoutesByIds(firstPostIds);

    const maybeNavLinks: Array<NavLink | null> = orderedNavReferences.map((item) => {
      if (categoryReferenceIds.has(item.id)) {
        const sourceCategory = sourceCategoriesById.get(item.id);
        if (!sourceCategory) return null;

        const translatedCategory = translatedCategoriesById.get(item.id) ?? sourceCategory;
        const categoryTitleField = getCategoryTitleField(sourceCategory);
        const firstPostId = getFirstCategoryPostId(sourceCategory, categoryPostRefsById);
        if (!firstPostId) return null;

        const sourcePost = sourcePostsMap.get(firstPostId);
        if (!sourcePost) return null;

        return {
          label:
            item.resolvedTitle ??
            (language && language !== 'en'
              ? getLocalizedDisplayTitle(sourceCategory, translatedCategory, categoryTitleField)
              : getDisplayTitle(sourceCategory, categoryTitleField)),
          href: getPostHref({
            post: sourcePost,
            language,
            category: getRouteSegment(sourceCategory, categoryTitleField),
          }),
          active: currentCategoryId === item.id,
        };
      }

      const sourceSection = sourceSectionsMap.get(item.id);
      if (!sourceSection) return null;

      const translatedSection = translatedSectionsMap.get(item.id) ?? sourceSection;
      const categoryIds = getSectionCategoryIds(sourceSection);

      const firstCategory = categoryIds
        .map((id) => sourceCategoriesById.get(id))
        .find((category): category is NonNullable<typeof category> => category !== undefined);
      if (!firstCategory) return null;

      const categoryTitleField = getCategoryTitleField(firstCategory);
      const firstPostId = getFirstCategoryPostId(firstCategory, categoryPostRefsById);
      if (!firstPostId) return null;

      const sourcePost = sourcePostsMap.get(firstPostId);
      if (!sourcePost) return null;

      return {
        label:
          item.resolvedTitle ??
          (language && language !== 'en'
            ? getLocalizedDisplayTitle(sourceSection, translatedSection)
            : getDisplayTitle(sourceSection)),
        href: getPostHref({
          post: sourcePost,
          language,
          category: getRouteSegment(firstCategory, categoryTitleField),
        }),
        active: currentCategoryId !== null && categoryIds.includes(currentCategoryId),
      };
    });

    const referencedNavLinks = maybeNavLinks.filter(isNavLink);
    if (referencedNavLinks.length > 0) {
      resolvedNavLinks = referencedNavLinks;
    }
  }

  return (
    <NavbarClient
      content={{
        ...content,
        nav_links: resolvedNavLinks,
      }}
      searchEntries={searchEntries}
    />
  );
}
