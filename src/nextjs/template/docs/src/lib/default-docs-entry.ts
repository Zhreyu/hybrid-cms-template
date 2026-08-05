import {
  type Categories,
  getCategories,
  getCategoryPostRefsMap,
  getCategoryTitleField,
  getPostsByIds,
  getSections,
  isRouteRefId,
  type Section,
} from '@/lib/cms-data';
import { buildDocsHref } from '@/lib/docs-href';
import { resolveSectionCategories } from '@/lib/docs-sections';
import { getRouteSegment } from '@/lib/route-segment';

const FALLBACK_DOCS_ENTRY = {
  category: 'general',
  post: 'intro',
};

function logFallbackDocsEntry(reason: string, details?: Record<string, unknown>) {
  console.error('[getDefaultDocsEntry] Falling back to static docs entry:', {
    reason,
    fallback: FALLBACK_DOCS_ENTRY,
    ...details,
  });
}

function getFallbackDocsHref(language?: string): string {
  return buildDocsHref({ language, ...FALLBACK_DOCS_ENTRY });
}

async function getFirstNavigableCategories(
  sourceCategories: Categories[],
  sourceSections: Section[]
) {
  const categoriesById = new Map(
    sourceCategories.map((category) => [String(category._id), category])
  );
  const categoryPostRefsById = await getCategoryPostRefsMap(sourceCategories);
  const firstSectionCategories =
    sourceSections
      .map((section) => resolveSectionCategories(section, categoriesById))
      .find((categories) =>
        categories.some(
          (category) => (categoryPostRefsById.get(String(category._id)) ?? []).length > 0
        )
      ) ?? [];

  return firstSectionCategories.length > 0 ? firstSectionCategories : sourceCategories;
}

async function getFirstHrefFromCategories(
  categories: Categories[],
  language?: string
): Promise<string | null> {
  const categoryPostRefsById = await getCategoryPostRefsMap(categories);

  for (const category of categories) {
    const categoryTitleField = getCategoryTitleField(category);
    const categorySlug = getRouteSegment(category, categoryTitleField);
    if (!categorySlug) continue;

    for (const ref of categoryPostRefsById.get(String(category._id)) ?? []) {
      const refId = ref._ref;
      if (!refId) continue;

      if (isRouteRefId(refId)) continue;

      const postsMap = await getPostsByIds([refId]);
      const post = postsMap.get(refId);
      if (!post) continue;

      const postSlug = getRouteSegment(post, 'title');
      if (!postSlug) continue;

      return buildDocsHref({
        language,
        category: categorySlug,
        post: postSlug,
      });
    }
  }

  return null;
}

/** First available documentation href for default landing redirects. */
export async function getDefaultDocsEntry(language?: string): Promise<{ href: string }> {
  const [sourceCategories, sourceSections] = await Promise.all([getCategories(), getSections()]);
  const orderedCategories = await getFirstNavigableCategories(sourceCategories, sourceSections);
  const href = await getFirstHrefFromCategories(orderedCategories, language);

  if (href) {
    return { href };
  }

  logFallbackDocsEntry('missing navigable static route or post document');
  return { href: getFallbackDocsHref(language) };
}
