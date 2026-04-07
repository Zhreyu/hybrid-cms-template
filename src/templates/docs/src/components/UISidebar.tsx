import type { BlockComponentProps, ResolvedRouteParams } from 'cms-renderer/lib/types';
import type { Post } from '../lib/cms-data';
import { getCategories, getPost } from '../lib/cms-data';
import { buildDocsHref } from '../lib/docs-href';
import { getRouteSegment } from '../lib/route-segment';
import UISidebarClient from './UISidebarClient';

function formatDisplayLabel(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  if (!trimmed.includes('-')) {
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  }

  return trimmed
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getDisplayLabel(document: Record<string, unknown>, fallbackField: string): string {
  const documentTitle = document._title;
  if (typeof documentTitle === 'string' && documentTitle.length > 0) {
    return documentTitle;
  }

  const fallbackValue = document[fallbackField];
  if (typeof fallbackValue === 'string' && fallbackValue.length > 0) {
    return fallbackValue;
  }

  return '';
}

function getLocalizedDisplayLabel(
  sourceDocument: Record<string, unknown>,
  translatedDocument: Record<string, unknown>,
  fieldName: string,
  language?: string
): string {
  if (language && language !== 'en') {
    const translatedValue = translatedDocument[fieldName];
    if (typeof translatedValue === 'string' && translatedValue.length > 0) {
      return formatDisplayLabel(translatedValue);
    }
  }

  return getDisplayLabel(sourceDocument, fieldName);
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
  routeParams,
  language: languageProp,
}: BlockComponentProps<Record<string, unknown>>) {
  const language = languageProp ?? extractLanguage(routeParams);
  const country = extractCountry(routeParams);
  const currentPath = routeParams?.post
    ? buildDocsHref({
      language,
      category: routeParams.category.value,
      post: routeParams.post.value,
    })
    : country
      ? `/${country}`
      : undefined;

  const [sourceCategories, translatedCategories] = await Promise.all([
    getCategories(),
    getCategories(language),
  ]);

  const categoriesWithPosts = await Promise.all(
    sourceCategories.map(async (sourceCategory, index) => {
      const translatedCategory = translatedCategories[index] ?? sourceCategory;

      const posts = await Promise.all(
        (sourceCategory.post_list ?? []).map(async (ref) => {
          const id = (ref as { _ref: string })._ref;
          const [sourcePost, translatedPost] = await Promise.all([
            getPost(id),
            getPost(id, language),
          ]);
          return {
            sourcePost,
            translatedPost: translatedPost ?? sourcePost,
          };
        })
      );

      return {
        sourceCategory,
        translatedCategory,
        posts: posts.filter(
          (entry): entry is { sourcePost: Post; translatedPost: Post } => entry.sourcePost !== null
        ),
      };
    })
  );

  const sections = categoriesWithPosts.map(({ sourceCategory, translatedCategory, posts }) => ({
    title: getLocalizedDisplayLabel(sourceCategory, translatedCategory, 'category_name', language),
    links: posts.map(({ sourcePost, translatedPost }) => {
      const href = buildDocsHref({
        language,
        category: getRouteSegment(sourceCategory, 'category_name'),
        post: getRouteSegment(sourcePost, 'title'),
      });
      return {
        label: getLocalizedDisplayLabel(sourcePost, translatedPost, 'title', language),
        href,
        active: currentPath === href,
      };
    }),
  }));

  return (
    <aside className="w-full bg-[#0d0d0d] font-sans lg:w-[260px]">
      <UISidebarClient sections={sections} />
    </aside>
  );
}
