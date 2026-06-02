import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import {
  getCategories,
  getCategoryRefs,
  getCategoryTitleField,
  getPostsByIds,
  resolveRef,
} from './cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from './display-title';
import { buildDocsHref } from './docs-href';
import { getRouteSegment } from './route-segment';

export interface SearchEntry {
  href: string;
  title: string;
  category: string;
  content: string;
  headings: string[];
}

export const SEARCH_ENTRIES_CACHE_TAG = 'docs-search-entries';

function extractHeadings(markdown: string): string[] {
  return Array.from(
    markdown.matchAll(/^#{1,6}\s+(.+)$/gm),
    (match) => match[1]?.trim() ?? ''
  ).filter(Boolean);
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolvePostContent(
  post: { content: unknown; [key: string]: unknown } | null,
  fallback: unknown
): string {
  if (post && typeof post.content === 'string') return post.content;
  if (typeof fallback === 'string') return fallback;
  return '';
}

const getCachedSearchEntries = unstable_cache(
  async (language?: string): Promise<SearchEntry[]> => {
    const [sourceCategories, translatedCategories] = await Promise.all([
      getCategories(),
      getCategories(language),
    ]);
    const translatedById = new Map(
      translatedCategories.map((category) => [String(category._id), category])
    );

    const allPostIds: string[] = [];
    for (const category of sourceCategories) {
      for (const ref of getCategoryRefs(category)) {
        allPostIds.push(ref._ref);
      }
    }

    const [sourcePostsMap, translatedPostsMap] = await Promise.all([
      getPostsByIds(allPostIds),
      getPostsByIds(allPostIds, language),
    ]);

    const entries: SearchEntry[] = [];

    for (let categoryIndex = 0; categoryIndex < sourceCategories.length; categoryIndex++) {
      const sourceCategory = sourceCategories[categoryIndex];
      if (!sourceCategory) continue;

      const translatedCategory = translatedById.get(String(sourceCategory._id)) ?? sourceCategory;
      const categoryTitleField = getCategoryTitleField(sourceCategory);
      const categoryLabel = language
        ? getLocalizedDisplayTitle(sourceCategory, translatedCategory, categoryTitleField)
        : getDisplayTitle(sourceCategory, categoryTitleField);
      const categorySlug = getRouteSegment(sourceCategory, categoryTitleField);

      for (const ref of getCategoryRefs(sourceCategory)) {
        const sourcePost = resolveRef(ref, sourcePostsMap);
        if (!sourcePost) continue;

        const translatedPost = resolveRef(ref, translatedPostsMap);
        const postSlug = getRouteSegment(sourcePost, 'title');
        const localizedPost = translatedPost ?? sourcePost;
        const title = translatedPost
          ? getLocalizedDisplayTitle(
              sourcePost as Record<string, unknown>,
              translatedPost as Record<string, unknown>
            )
          : getDisplayTitle(sourcePost as Record<string, unknown>);
        const markdown = resolvePostContent(localizedPost, sourcePost.content);
        const headings = extractHeadings(markdown);
        const content = stripMarkdown(markdown);

        entries.push({
          href: buildDocsHref({ language, category: categorySlug, post: postSlug }),
          title,
          category: categoryLabel,
          content,
          headings,
        });
      }
    }

    return entries;
  },
  ['search-entries'],
  {
    tags: [SEARCH_ENTRIES_CACHE_TAG],
  }
);

export const getSearchEntries = cache((language?: string): Promise<SearchEntry[]> => {
  return getCachedSearchEntries(language);
});
