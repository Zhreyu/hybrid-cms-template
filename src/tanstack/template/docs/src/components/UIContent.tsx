import type { BlockComponentProps } from 'cms-renderer/lib/types';
import { getCategories, getPost } from '../lib/cms-data';
import { buildDocsHref } from '../lib/docs-href';
import { normalizeTitle } from '../lib/normalize-title';
import { getRouteSegment } from '../lib/route-segment';
import { DocsMarkdown } from './DocsMarkdown';

export default async function UIContent({
  routeParams,
  language,
}: BlockComponentProps<Record<string, unknown>>) {
  if (!routeParams) return null;

  const postId = routeParams.post.document.id;
  const routeDocument = routeParams.post.document.content;
  const translatedPost = language ? await getPost(postId, language) : null;
  const resolvedTitle = (translatedPost?.title ?? routeParams.post.document.title) as string;

  const translatedMarkdown =
    translatedPost && typeof translatedPost.content === 'string' ? translatedPost.content : '';
  const routeMarkdown = typeof routeDocument.content === 'string' ? routeDocument.content : '';
  const markdown = translatedMarkdown || routeMarkdown;
  const hasUnsupportedRichText =
    !translatedMarkdown &&
    routeDocument.content != null &&
    typeof routeDocument.content !== 'string';

  const defaultCategories = await getCategories();

  let prevLink: { title: string; href: string } | null = null;
  let nextLink: { title: string; href: string } | null = null;

  for (let ci = 0; ci < defaultCategories.length; ci++) {
    const cat = defaultCategories[ci];
    const postIds = (cat.post_list ?? []).map((r) => (r as { _ref: string })._ref);
    const idx = postIds.indexOf(postId);
    if (idx === -1) continue;

    const catSlug = getRouteSegment(cat as Record<string, unknown>, 'category_name');

    const buildLink = async (id: string) => {
      const [defaultP, translatedP] = await Promise.all([getPost(id), getPost(id, language)]);
      if (!defaultP) return null;
      const slug = getRouteSegment(defaultP as Record<string, unknown>, 'title');
      const title = (translatedP?.title ?? defaultP.title) as string;
      return {
        title,
        href: buildDocsHref({
          language,
          category: catSlug,
          post: slug,
        }),
      };
    };

    if (idx > 0) prevLink = await buildLink(postIds[idx - 1] as string);
    if (idx < postIds.length - 1) nextLink = await buildLink(postIds[idx + 1] as string);
    break;
  }

  return (
    <div className="min-h-screen min-w-0 bg-[#0d0d0d] px-4 pt-8 pb-20 font-sans sm:px-6 lg:px-8 lg:pt-10 lg:pb-48">
      <div className="mx-auto min-w-0 max-w-[48rem] lg:mx-0 lg:pl-4">
        <h1 className="mb-2 break-words text-3xl font-bold text-[#f3f4f6] sm:text-4xl">
          {resolvedTitle}
        </h1>

        {markdown ? (
          <DocsMarkdown content={markdown} />
        ) : hasUnsupportedRichText ? (
          <p className="text-[#6b7280]">
            This document content is not stored as Markdown yet. Re-save it in the rich text editor
            to render it here.
          </p>
        ) : (
          <p className="text-[#6b7280]">No content available.</p>
        )}

        {(prevLink || nextLink) && (
          <div className="mt-16 border-t border-[#1f1f1f] pt-6">
            <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
              Continue Reading
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {prevLink ? (
                <a
                  href={prevLink.href}
                  className="group rounded-lg border border-[#1a1a1a] bg-[#101010] px-4 py-3 no-underline transition-colors hover:border-[#294132] hover:bg-[#131814]"
                >
                  <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280] transition-colors group-hover:text-[#a7f3d0]">
                    Previous
                  </span>
                  <span className="flex items-center gap-2 text-base text-[#d1d5db] transition-colors group-hover:text-white">
                    <span className="text-[#4b5563] transition-colors group-hover:text-[#86efac]">
                      ‹
                    </span>
                    <span>{normalizeTitle(prevLink.title)}</span>
                  </span>
                </a>
              ) : (
                <div className="hidden sm:block" />
              )}

              {nextLink ? (
                <a
                  href={nextLink.href}
                  className="group rounded-lg border border-[#1a1a1a] bg-[#101010] px-4 py-3 no-underline transition-colors hover:border-[#294132] hover:bg-[#131814] sm:text-right"
                >
                  <span className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6b7280] transition-colors group-hover:text-[#a7f3d0]">
                    Next
                  </span>
                  <span className="flex items-center gap-2 text-base text-[#d1d5db] transition-colors group-hover:text-white sm:justify-end">
                    <span>{normalizeTitle(nextLink.title)}</span>
                    <span className="text-[#4b5563] transition-colors group-hover:text-[#86efac]">
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
    </div>
  );
}
