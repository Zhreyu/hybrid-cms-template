import type { ResolvedRouteParams } from 'cms-renderer/lib/types';
import {
  getCategoryPostRefsMap,
  getCategoryTitleField,
  getPostsAndStaticRoutesByIds,
} from '@/lib/cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from '@/lib/display-title';
import { getPostHref } from '@/lib/docs-href';
import { getRouteCategoryId, getSectionScopedCategories } from '@/lib/docs-sections';
import { getRouteSegment } from '@/lib/route-segment';

type ContinueReadingLink = {
  title: string;
  href: string;
};

async function getContinueReadingLinks({
  routeParams,
  language,
}: {
  routeParams?: ResolvedRouteParams;
  language?: string;
}): Promise<{ prevLink: ContinueReadingLink | null; nextLink: ContinueReadingLink | null }> {
  const postParam = routeParams?.post;
  if (!postParam) {
    return { prevLink: null, nextLink: null };
  }

  const postId = postParam.document.id;
  const currentCategoryId = getRouteCategoryId(routeParams);
  const { categories: defaultCategories } = await getSectionScopedCategories(routeParams);
  const categoryPostRefsById = await getCategoryPostRefsMap(defaultCategories);

  const entries = defaultCategories.flatMap((category) => {
    const categoryId = String(category._id);
    const categorySlug = getRouteSegment(category, getCategoryTitleField(category));

    return (categoryPostRefsById.get(categoryId) ?? []).map((ref) => ({
      id: ref._ref,
      categoryId,
      categorySlug,
    }));
  });

  const currentIndex = entries.findIndex(
    (entry) => entry.id === postId && (!currentCategoryId || entry.categoryId === currentCategoryId)
  );
  const idx =
    currentIndex === -1 ? entries.findIndex((entry) => entry.id === postId) : currentIndex;

  if (idx === -1) {
    return { prevLink: null, nextLink: null };
  }

  const prevEntry = idx > 0 ? entries[idx - 1] : null;
  const nextEntry = idx < entries.length - 1 ? entries[idx + 1] : null;
  const neighborIds = [prevEntry?.id, nextEntry?.id].filter((id): id is string => Boolean(id));

  if (neighborIds.length === 0) {
    return { prevLink: null, nextLink: null };
  }

  const [defaultPostsMap, translatedPostsMap] = await Promise.all([
    getPostsAndStaticRoutesByIds(neighborIds),
    getPostsAndStaticRoutesByIds(neighborIds, language),
  ]);

  const buildLink = (entry: (typeof entries)[number] | null) => {
    if (!entry) return null;

    const defaultPost = defaultPostsMap.get(entry.id);
    if (!defaultPost) return null;

    const translatedPost = translatedPostsMap.get(entry.id);
    const title = translatedPost
      ? getLocalizedDisplayTitle(defaultPost, translatedPost)
      : getDisplayTitle(defaultPost);

    return {
      title,
      href: getPostHref({ post: defaultPost, language, category: entry.categorySlug }),
    };
  };

  return {
    prevLink: buildLink(prevEntry),
    nextLink: buildLink(nextEntry),
  };
}

export async function ContinueReading({
  routeParams,
  language,
}: {
  routeParams?: ResolvedRouteParams;
  language?: string;
}) {
  const { prevLink, nextLink } = await getContinueReadingLinks({ routeParams, language });

  if (!prevLink && !nextLink) {
    return null;
  }

  return (
    <section
      aria-label="Continue reading"
      className="bg-[var(--background)] px-5 pt-16 pb-8 font-sans sm:px-8 lg:px-20"
    >
      <div className="mx-auto w-full max-w-[720px] border-t border-[var(--border)] pt-6 lg:mx-0">
        <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
          Continue Reading
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {prevLink ? (
            <a
              href={prevLink.href}
              className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 no-underline transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)]"
              title="Go to previous page"
            >
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
                Previous
              </span>
              <span className="flex items-center gap-2 text-base text-[var(--text)] transition-colors">
                <span className="text-[var(--text-soft)] transition-colors group-hover:text-[var(--accent)]">
                  ‹
                </span>
                <span>{prevLink.title}</span>
              </span>
            </a>
          ) : (
            <div className="hidden sm:block" />
          )}

          {nextLink ? (
            <a
              href={nextLink.href}
              className="group rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 no-underline transition-colors hover:border-[var(--accent)] hover:bg-[var(--surface-muted)] sm:text-right"
              title="Go to next page"
            >
              <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)] transition-colors group-hover:text-[var(--accent)]">
                Next
              </span>
              <span className="flex items-center gap-2 text-base text-[var(--text)] transition-colors sm:justify-end">
                <span>{nextLink.title}</span>
                <span className="text-[var(--text-soft)] transition-colors group-hover:text-[var(--accent)]">
                  ›
                </span>
              </span>
            </a>
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>
      </div>
    </section>
  );
}
