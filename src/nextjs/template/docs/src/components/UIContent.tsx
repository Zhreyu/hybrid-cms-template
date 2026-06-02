import type { BlockComponentProps } from 'cms-renderer/lib/types';
import { cookies } from 'next/headers';
import {
  getCategories,
  getCategoryRefs,
  getCategoryTitleField,
  getPost,
  getPostsByIds,
} from '../lib/cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from '../lib/display-title';
import { buildDocsHref } from '../lib/docs-href';
import { filterMarkdownByFramework } from '../lib/framework-markdown';
import { getRouteSegment } from '../lib/route-segment';
import {
  DEFAULT_FRAMEWORK_ID,
  DOCS_FRAMEWORK_COOKIE_KEY,
  isFrameworkId,
} from '../lib/supported-frameworks';
import { CopyContentControls } from './CopyContentControls';
import { DocsMarkdown } from './DocsMarkdown';
import { DocsTableOfContents } from './DocsTableOfContents';

export default async function UIContent({
  routeParams,
  language,
}: Readonly<BlockComponentProps<Record<string, unknown>>>) {
  const postParam = routeParams?.post;
  if (!postParam) return null;

  const postId = postParam.document.id;
  const routeDocument = postParam.document.content;
  const sourceDocument = {
    ...(routeDocument as Record<string, unknown>),
    _title: postParam.document.title,
  };

  const translatedPost = language ? await getPost(postId, language) : null;
  const resolvedTitle = getLocalizedDisplayTitle(
    sourceDocument,
    (translatedPost ?? {}) as Record<string, unknown>
  );

  const translatedDescription =
    translatedPost && typeof translatedPost.description === 'string'
      ? translatedPost.description
      : '';
  const sourceDescription =
    typeof routeDocument.description === 'string' ? routeDocument.description : '';
  const resolvedDescription = translatedDescription || sourceDescription;

  const translatedMarkdown =
    translatedPost && typeof translatedPost.content === 'string' ? translatedPost.content : '';
  const routeMarkdown = typeof routeDocument.content === 'string' ? routeDocument.content : '';
  const rawMarkdown = translatedMarkdown || routeMarkdown;
  const cookieValue = (await cookies()).get(DOCS_FRAMEWORK_COOKIE_KEY)?.value;
  const decodedCookieValue = cookieValue ? decodeURIComponent(cookieValue) : undefined;
  const framework =
    decodedCookieValue && isFrameworkId(decodedCookieValue)
      ? decodedCookieValue
      : DEFAULT_FRAMEWORK_ID;
  const markdown = rawMarkdown ? filterMarkdownByFramework(rawMarkdown, framework) : rawMarkdown;
  const markdownContentId = `docs-content-${postId}`;
  const hasUnsupportedRichText =
    !translatedMarkdown &&
    routeDocument.content != null &&
    typeof routeDocument.content !== 'string';

  const defaultCategories = await getCategories();

  let prevLink: { title: string; href: string } | null = null;
  let nextLink: { title: string; href: string } | null = null;

  for (let ci = 0; ci < defaultCategories.length; ci++) {
    const cat = defaultCategories[ci];
    const postIds = getCategoryRefs(cat).map((r) => r._ref);
    const idx = postIds.indexOf(postId);
    if (idx === -1) continue;

    const catSlug = getRouteSegment(cat, getCategoryTitleField(cat));

    const neighborIds: string[] = [];
    if (idx > 0) neighborIds.push(postIds[idx - 1] as string);
    if (idx < postIds.length - 1) neighborIds.push(postIds[idx + 1] as string);

    if (neighborIds.length > 0) {
      const [defaultPostsMap, translatedPostsMap] = await Promise.all([
        getPostsByIds(neighborIds),
        getPostsByIds(neighborIds, language),
      ]);

      const buildLink = (id: string) => {
        const defaultP = defaultPostsMap.get(id);
        if (!defaultP) return null;
        const translatedP = translatedPostsMap.get(id);
        const slug = getRouteSegment(defaultP, 'title');
        const title = translatedP
          ? getLocalizedDisplayTitle(defaultP, translatedP)
          : getDisplayTitle(defaultP);
        return {
          title,
          href: buildDocsHref({ language, category: catSlug, post: slug }),
        };
      };

      if (idx > 0) prevLink = buildLink(postIds[idx - 1] as string);
      if (idx < postIds.length - 1) nextLink = buildLink(postIds[idx + 1] as string);
    }
    break;
  }

  return (
    <div className="min-h-screen min-w-0 bg-[var(--background)] px-4 pb-20 pt-8 font-sans sm:px-6 lg:px-8 lg:pb-48 lg:pt-10">
      <div className="mx-auto flex w-full min-w-0 max-w-[80rem] gap-12 lg:mx-0 lg:pl-4">
        <div className="min-w-0 max-w-[48rem] flex-1">
          <div className="mb-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 max-w-2xl">
                <h1 className="break-words text-3xl font-bold text-[var(--text)]">
                  {resolvedTitle}
                </h1>
                {resolvedDescription ? (
                  <p className="mt-1 text-[13px] font-semibold text-[var(--text-muted)]">
                    {resolvedDescription}
                  </p>
                ) : null}
              </div>

              {markdown ? (
                <CopyContentControls markdown={markdown} contentElementId={markdownContentId} />
              ) : null}
            </div>
          </div>

          {markdown ? (
            <div id={markdownContentId}>
              <DocsMarkdown content={markdown} />
            </div>
          ) : hasUnsupportedRichText ? (
            <p className="text-[var(--text-muted)]">
              This document content is not stored as Markdown yet. Re-save it in the rich text
              editor to render it here.
            </p>
          ) : (
            <p className="text-[var(--text-muted)]">No content available.</p>
          )}

          {(prevLink || nextLink) && (
            <div className="mt-16 border-t border-[var(--border)] pt-6">
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
          )}
        </div>
        {markdown ? (
          <aside
            aria-label="On this page"
            className="sticky hidden w-56 shrink-0 self-start xl:block"
            style={{ top: 'calc(var(--docs-nav-height) + 2.5rem)' }}
          >
            <DocsTableOfContents contentId={markdownContentId} />
          </aside>
        ) : null}
      </div>
    </div>
  );
}
