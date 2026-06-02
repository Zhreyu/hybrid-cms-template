import type { BlockComponentProps, ResolvedRouteParams } from 'cms-renderer/lib/types';
import {
  getCategories,
  getCategoryRefs,
  getCategoryTitleField,
  getPostsByIds,
  resolveRef,
} from '../lib/cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from '../lib/display-title';
import { buildDocsHref } from '../lib/docs-href';
import { getRouteSegment } from '../lib/route-segment';
import UISidebarClient from './UISidebarClient';

type ReferenceLike = {
  _ref?: unknown;
};

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

export default async function UISidebar({
  content,
  routeParams,
  language: languageProp,
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
        : undefined;

  const [sourceCategories, translatedCategories] = await Promise.all([
    getCategories(),
    getCategories(language),
  ]);

  const translatedById = new Map(
    translatedCategories.map((category) => [String(category._id), category])
  );
  const sourceById = new Map(sourceCategories.map((category) => [String(category._id), category]));

  const visibleSourceCategories =
    selectedCategoryIds.length > 0
      ? selectedCategoryIds
          .map((id) => sourceById.get(id))
          .filter((category): category is NonNullable<typeof category> => category !== undefined)
      : sourceCategories;

  const allPostIds: string[] = [];
  for (const category of visibleSourceCategories) {
    for (const ref of getCategoryRefs(category)) {
      allPostIds.push(ref._ref);
    }
  }

  const [sourcePostsMap, translatedPostsMap] = await Promise.all([
    getPostsByIds(allPostIds),
    getPostsByIds(allPostIds, language),
  ]);

  const sections = visibleSourceCategories.map((sourceCategory) => {
    const translatedCategory = translatedById.get(String(sourceCategory._id)) ?? sourceCategory;
    const categoryTitleField = getCategoryTitleField(sourceCategory);

    const links = getCategoryRefs(sourceCategory)
      .map((ref) => {
        const sourcePost = resolveRef(ref, sourcePostsMap);
        if (!sourcePost) return null;

        const translatedPost = resolveRef(ref, translatedPostsMap) ?? sourcePost;
        const href = buildDocsHref({
          language,
          category: getRouteSegment(sourceCategory, categoryTitleField),
          post: getRouteSegment(sourcePost, 'title'),
        });

        return {
          label:
            language && language !== 'en'
              ? getLocalizedDisplayTitle(sourcePost, translatedPost)
              : getDisplayTitle(sourcePost),
          href,
          active: currentPath === href,
        };
      })
      .filter((link): link is NonNullable<typeof link> => link !== null);

    return {
      title:
        language && language !== 'en'
          ? getLocalizedDisplayTitle(sourceCategory, translatedCategory, categoryTitleField)
          : getDisplayTitle(sourceCategory, categoryTitleField),
      links,
    };
  });

  return (
    <aside className="w-full bg-[var(--background)] font-sans lg:w-[260px]">
      <UISidebarClient sections={sections} />
    </aside>
  );
}
