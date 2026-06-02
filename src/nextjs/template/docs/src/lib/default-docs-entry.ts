import {
  getCategories,
  getCategoryRefs,
  getCategoryTitleField,
  getPostsByIds,
} from '@/lib/cms-data';
import { getRouteSegment } from '@/lib/route-segment';

export const FALLBACK_DOCS_ENTRY = {
  category: 'headless',
  post: 'quickstart',
};

function logFallbackDocsEntry(reason: string, details?: Record<string, unknown>) {
  console.error('[getDefaultDocsEntry] Falling back to static docs entry:', {
    reason,
    fallback: FALLBACK_DOCS_ENTRY,
    ...details,
  });
}

/** First available documentation entry (category and post) for default landing redirects. */
export async function getDefaultDocsEntry(): Promise<{ category: string; post: string }> {
  const categories = await getCategories();
  const firstCategory = categories.find((category) => getCategoryRefs(category).length > 0);

  if (!firstCategory) {
    logFallbackDocsEntry('missing category with posts');
    return FALLBACK_DOCS_ENTRY;
  }

  const categoryTitleField = getCategoryTitleField(firstCategory);
  const firstPostId = getCategoryRefs(firstCategory)[0]?._ref;
  if (!firstPostId) {
    logFallbackDocsEntry('missing first post reference', {
      categoryId: String(firstCategory._id ?? ''),
    });
    return FALLBACK_DOCS_ENTRY;
  }

  const postsMap = await getPostsByIds([firstPostId]);
  const firstPost = postsMap.get(firstPostId);

  if (!firstPost) {
    logFallbackDocsEntry('missing first post document', { firstPostId });
    return FALLBACK_DOCS_ENTRY;
  }

  const category = getRouteSegment(firstCategory, categoryTitleField);
  const post = getRouteSegment(firstPost, 'title');
  if (!category || !post) {
    logFallbackDocsEntry('missing route segment', {
      categoryId: String(firstCategory._id ?? ''),
      firstPostId,
      category,
      post,
    });
    return FALLBACK_DOCS_ENTRY;
  }

  return {
    category,
    post,
  };
}