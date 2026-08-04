import type { BlockComponentProps } from 'cms-renderer/lib/types';
import { getPost } from '../lib/cms-data';
import { DocsMarkdown } from './DocsMarkdown';
import { DocsPageHeader, DocsPageToc } from './DocsPageChrome';

export default async function UIContent({
  content,
  routeParams,
  language,
}: Readonly<BlockComponentProps<Record<string, unknown>>>) {
  const postParam = routeParams?.post;
  const hasPostBinding = !!postParam;

  const postId = postParam?.document.id ?? 'static-uicontent';
  const routeDocument = postParam?.document.content ?? content;

  const translatedPost = hasPostBinding && language ? await getPost(postId, language) : null;

  const translatedMarkdown =
    translatedPost && typeof translatedPost.content === 'string' ? translatedPost.content : '';
  const routeMarkdown = typeof routeDocument.content === 'string' ? routeDocument.content : '';
  const markdown = translatedMarkdown || routeMarkdown;
  const markdownContentId = `docs-content-${postId}`;
  const hasUnsupportedRichText =
    !translatedMarkdown &&
    routeDocument.content != null &&
    typeof routeDocument.content !== 'string';

  return (
    <>
      <DocsPageHeader content={content} routeParams={routeParams} language={language} />
      <DocsPageToc />
      <section className="relative min-w-0 bg-[var(--background)] px-5 pb-8 font-sans sm:px-8 lg:px-20">
        <div className="mx-auto w-full min-w-0 max-w-[720px] xl:mx-0">
          <div id={markdownContentId} data-docs-content-block={true}>
            {markdown ? (
              <DocsMarkdown content={markdown} orderedSteps={true} />
            ) : hasUnsupportedRichText ? (
              <p className="text-[var(--text-muted)]">
                This document content is not stored as Markdown yet. Re-save it in the rich text
                editor to render it here.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}
