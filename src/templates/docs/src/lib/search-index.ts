import { unstable_cache } from 'next/cache';
import { getCategories, getPost, type Post } from './cms-data';
import { buildDocsHref } from './docs-href';
import { normalizeTitle } from './normalize-title';
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

function resolvePostContent(post: Post | null, fallback: unknown): string {
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

    const entries = await Promise.all(
      sourceCategories.flatMap((sourceCategory, categoryIndex) => {
        const translatedCategory = translatedCategories[categoryIndex] ?? sourceCategory;
        const categoryLabel =
          typeof translatedCategory.category_name === 'string'
            ? translatedCategory.category_name
            : typeof sourceCategory.category_name === 'string'
              ? sourceCategory.category_name
              : 'Docs';
        const categorySlug = getRouteSegment(sourceCategory, 'category_name');

        return (sourceCategory.post_list ?? []).map(async (ref) => {
          const id = (ref as { _ref: string })._ref;
          const [sourcePost, translatedPost] = await Promise.all([
            getPost(id),
            getPost(id, language),
          ]);
          if (!sourcePost) return null;

          const postSlug = getRouteSegment(sourcePost as Record<string, unknown>, 'title');
          const localizedPost = translatedPost ?? sourcePost;
          const title =
            typeof localizedPost.title === 'string' ? localizedPost.title : sourcePost.title;
          const normalizedTitle = normalizeTitle(title);
          const markdown = resolvePostContent(localizedPost, sourcePost.content);
          const headings = extractHeadings(markdown);
          const content = stripMarkdown(markdown);
          return {
            href: buildDocsHref({
              language,
              category: categorySlug,
              post: postSlug,
            }),
            title: normalizedTitle,
            category: categoryLabel,
            content,
            headings,
          } satisfies SearchEntry;
        });
      })
    );

    return entries.filter((entry): entry is SearchEntry => entry !== null);
  },
  ['search-entries'],
  {
    tags: [SEARCH_ENTRIES_CACHE_TAG],
  }
);

export function getSearchEntries(language?: string): Promise<SearchEntry[]> {
  return getCachedSearchEntries(language);
}
