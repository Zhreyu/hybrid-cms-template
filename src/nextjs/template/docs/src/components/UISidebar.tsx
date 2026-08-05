import type { BlockComponentProps, ResolvedRouteParams } from 'cms-renderer/lib/types';
import {
  type CategoryGroup,
  getCategories,
  getCategoryGroupIds,
  getCategoryGroupRefs,
  getCategoryGroupsByIds,
  getCategoryPostRefs,
  getCategoryRefs,
  getCategoryTitleField,
  getPostRefs,
  getPostsAndStaticRoutesByIds,
  getSections,
  resolveRef,
  sortCategoryGroups,
} from '@/lib/cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from '@/lib/display-title';
import { buildDocsHref, getPostHref } from '@/lib/docs-href';
import {
  findSectionForCategory,
  getRouteCategoryId,
  resolveSectionCategories,
} from '@/lib/docs-sections';
import { getRouteSegment } from '@/lib/route-segment';
import UISidebarClient from './UISidebarClient';

type ReferenceLike = {
  _ref?: unknown;
};

type SidebarLinkItem = {
  type: 'link';
  item: {
    label: string;
    href: string;
    active?: boolean;
    apiIcon?: string;
    icon?: string;
  };
};

type SidebarGroupItem = {
  type: 'group';
  group: {
    title: string;
    defaultOpen?: boolean;
    links: Array<{
      label: string;
      href: string;
      active?: boolean;
      apiIcon?: string;
      icon?: string;
    }>;
  };
};

function getSidebarItemOrder(category: Record<string, unknown>): Array<'links' | 'groups'> {
  const hasPostList = Array.isArray(category.post_list) && category.post_list.length > 0;
  const hasPost = Array.isArray(category.post) && category.post.length > 0;
  const hasGroup = Array.isArray(category.group) && category.group.length > 0;
  const hasGroups = Array.isArray(category.groups) && category.groups.length > 0;

  const fieldOrder = Array.isArray(category._editorFieldOrder) ? category._editorFieldOrder : [];

  const order: Array<'links' | 'groups'> = [];

  for (const field of fieldOrder) {
    if ((field === 'post_list' || field === 'post') && (hasPostList || hasPost)) {
      if (!order.includes('links')) order.push('links');
    }

    if ((field === 'group' || field === 'groups') && (hasGroup || hasGroups)) {
      if (!order.includes('groups')) order.push('groups');
    }
  }

  if (order.length === 0) {
    if (hasPostList || hasPost) order.push('links');
    if (hasGroup || hasGroups) order.push('groups');
  }

  return order;
}

function extractSelectedCategoryIds(content: Record<string, unknown>): string[] {
  const rawCategories = content.categories;
  if (!Array.isArray(rawCategories)) {
    return [];
  }

  return rawCategories
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const ref = (entry as ReferenceLike)._ref;
      return typeof ref === 'string' && ref.length > 0 ? ref : null;
    })
    .filter((id): id is string => id !== null);
}

function extractLanguage(routeParams?: ResolvedRouteParams): string | undefined {
  if (!routeParams) return undefined;
  return Object.values(routeParams).find((p) => p.schemaName === 'language')?.value;
}

function extractCountry(routeParams?: ResolvedRouteParams): string | undefined {
  if (!routeParams) return undefined;
  return Object.values(routeParams).find((p) => p.schemaName === 'country')?.value;
}

function readPostIconName(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }

  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const icon = value as Record<string, unknown>;
  for (const key of ['value', 'name', 'label', 'icon', 'id', 'slug']) {
    const candidate = icon[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return undefined;
}

function readPostApiIcon(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return ['get', 'post', 'options', 'patch', 'custom'].includes(normalized)
    ? normalized
    : undefined;
}

function buildPostLink({
  ref,
  sourcePostsMap,
  translatedPostsMap,
  language,
  currentPath,
  categorySlug,
}: {
  ref: { _ref: string };
  sourcePostsMap: Map<string, Record<string, unknown>>;
  translatedPostsMap: Map<string, Record<string, unknown>>;
  language?: string;
  currentPath?: string;
  categorySlug: string;
}) {
  const sourcePost = resolveRef(ref, sourcePostsMap);
  if (!sourcePost) return null;

  const translatedPost = resolveRef(ref, translatedPostsMap) ?? sourcePost;
  const href = getPostHref({
    post: sourcePost,
    language,
    category: categorySlug,
  });

  return {
    label:
      language && language !== 'en'
        ? getLocalizedDisplayTitle(sourcePost, translatedPost)
        : getDisplayTitle(sourcePost),
    apiIcon: readPostApiIcon(translatedPost.icon_api) ?? readPostApiIcon(sourcePost.icon_api),
    icon: readPostIconName(translatedPost.icon) ?? readPostIconName(sourcePost.icon),
    href,
    active: currentPath === href,
  };
}

function getGroupTitle(
  sourceGroup: CategoryGroup,
  translatedGroup: CategoryGroup,
  language?: string
): string {
  return language && language !== 'en'
    ? getLocalizedDisplayTitle(sourceGroup, translatedGroup)
    : getDisplayTitle(sourceGroup);
}

export default async function UISidebar({
  content,
  routeParams,
  language: languageProp,
  path,
}: BlockComponentProps<Record<string, unknown>>) {
  const language = languageProp ?? extractLanguage(routeParams);
  const country = extractCountry(routeParams);
  const selectedCategoryIds = extractSelectedCategoryIds(content);
  const categoryParam = routeParams?.category;
  const postParam = routeParams?.post;
  const currentPath =
    categoryParam && postParam
      ? buildDocsHref({
          language,
          category: categoryParam.value,
          post: postParam.value,
        })
      : country
        ? `/${country}`
        : path;

  const [sourceCategories, translatedCategories, sourceSections] = await Promise.all([
    getCategories(),
    getCategories(language),
    getSections(),
  ]);

  const translatedById = new Map(
    translatedCategories.map((category) => [String(category._id), category])
  );
  const sourceById = new Map(sourceCategories.map((category) => [String(category._id), category]));
  const activeSection = findSectionForCategory(sourceSections, getRouteCategoryId(routeParams));
  const sectionCategories = resolveSectionCategories(activeSection, sourceById);

  const visibleSourceCategories =
    sectionCategories.length > 0
      ? sectionCategories
      : selectedCategoryIds.length > 0
        ? selectedCategoryIds
            .map((id) => sourceById.get(id))
            .filter((category): category is NonNullable<typeof category> => category !== undefined)
        : sourceCategories;

  const groupIds = getCategoryGroupIds(sourceCategories);
  const [sourceGroupsMap, translatedGroupsMap] = await Promise.all([
    getCategoryGroupsByIds(groupIds),
    getCategoryGroupsByIds(groupIds, language),
  ]);

  const topSectionFirstPostIds = new Map<string, string>();
  for (const section of sourceSections) {
    for (const category of resolveSectionCategories(section, sourceById)) {
      const firstPostId = getCategoryPostRefs(category, sourceGroupsMap)[0]?._ref;
      if (typeof firstPostId === 'string' && firstPostId.length > 0) {
        topSectionFirstPostIds.set(String(section._id), firstPostId);
        break;
      }
    }
  }

  const allPostIds = new Set<string>();
  for (const category of visibleSourceCategories) {
    for (const ref of getCategoryPostRefs(category, sourceGroupsMap)) {
      allPostIds.add(ref._ref);
    }
  }

  for (const postId of topSectionFirstPostIds.values()) {
    allPostIds.add(postId);
  }

  const [sourcePostsMap, translatedPostsMap] = await Promise.all([
    getPostsAndStaticRoutesByIds([...allPostIds]),
    getPostsAndStaticRoutesByIds([...allPostIds], language),
  ]);

  const topSectionOptions = sourceSections
    .map((section) => {
      const firstPostId = topSectionFirstPostIds.get(String(section._id));
      if (!firstPostId) return null;

      const firstPost = sourcePostsMap.get(firstPostId);
      if (!firstPost) return null;

      const firstCategory = resolveSectionCategories(section, sourceById)[0];
      if (!firstCategory) return null;

      return {
        label: getDisplayTitle(section),
        href: getPostHref({
          post: firstPost,
          language,
          category: getRouteSegment(firstCategory, getCategoryTitleField(firstCategory)),
        }),
        active: activeSection ? String(activeSection._id) === String(section._id) : false,
      };
    })
    .filter((option): option is NonNullable<typeof option> => option !== null);

  const sections = visibleSourceCategories.map((sourceCategory) => {
    const translatedCategory = translatedById.get(String(sourceCategory._id)) ?? sourceCategory;
    const categoryTitleField = getCategoryTitleField(sourceCategory);
    const categorySlug = getRouteSegment(sourceCategory, categoryTitleField);

    const links = getCategoryRefs(sourceCategory)
      .map((ref) => {
        return buildPostLink({
          ref,
          sourcePostsMap,
          translatedPostsMap,
          language,
          currentPath,
          categorySlug,
        });
      })
      .filter((link): link is NonNullable<typeof link> => link !== null);

    const groups = sortCategoryGroups(
      getCategoryGroupRefs(sourceCategory)
        .map((groupRef) => resolveRef(groupRef, sourceGroupsMap))
        .filter((group): group is CategoryGroup => group !== null)
    )
      .map((sourceGroup) => {
        const translatedGroup = translatedGroupsMap.get(String(sourceGroup._id)) ?? sourceGroup;
        const groupLinks = getPostRefs(sourceGroup)
          .map((ref) =>
            buildPostLink({
              ref,
              sourcePostsMap,
              translatedPostsMap,
              language,
              currentPath,
              categorySlug,
            })
          )
          .filter((link): link is NonNullable<typeof link> => link !== null);

        if (groupLinks.length === 0) return null;

        return {
          title: getGroupTitle(sourceGroup, translatedGroup, language),
          defaultOpen: sourceGroup.default_open === true,
          links: groupLinks,
        };
      })
      .filter((group): group is NonNullable<typeof group> => group !== null);

    const itemOrder = getSidebarItemOrder(sourceCategory);
    const items = itemOrder.flatMap((itemType): Array<SidebarLinkItem | SidebarGroupItem> => {
      if (itemType === 'links') {
        return links.map((item) => ({ type: 'link', item }));
      }

      return groups.map((group) => ({ type: 'group', group }));
    });

    return {
      title:
        language && language !== 'en'
          ? getLocalizedDisplayTitle(sourceCategory, translatedCategory, categoryTitleField)
          : getDisplayTitle(sourceCategory, categoryTitleField),
      links,
      groups,
      items,
    };
  });

  return (
    <aside className="w-full bg-[var(--background)] font-sans lg:w-[290px]">
      <UISidebarClient sections={sections} topSectionOptions={topSectionOptions} />
    </aside>
  );
}
