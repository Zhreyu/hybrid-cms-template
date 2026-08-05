import type { BlockComponentProps } from 'cms-renderer/lib/types';
import { getPost } from '@/lib/cms-data';
import { getDisplayTitle, getLocalizedDisplayTitle } from '@/lib/display-title';
import { CopyContentControls } from './CopyContentControls';
import { DocsPageChromeDeduper } from './DocsPageChromeDeduper';
import { DocsTableOfContents } from './DocsTableOfContents';

type DocsPageChromeProps = Pick<
  BlockComponentProps<Record<string, unknown>>,
  'content' | 'routeParams' | 'language'
>;

export const DOCS_CONTENT_BLOCK_SELECTOR = '[data-docs-content-block]';

function readString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

async function getDocsPageChromeData({ content, routeParams, language }: DocsPageChromeProps) {
  const postParam = routeParams?.post;
  const categoryParam = routeParams?.category;
  const postId = postParam?.document.id ?? 'static-uicontent';
  const routeDocument = (postParam?.document.content ?? content) as Record<string, unknown>;
  const sourceDocument = postParam
    ? {
        _title: postParam.document.title,
        ...routeDocument,
      }
    : routeDocument;

  const translatedPost = postParam && language ? await getPost(postId, language) : null;
  const title = postParam
    ? getLocalizedDisplayTitle(sourceDocument, (translatedPost ?? {}) as Record<string, unknown>)
    : getDisplayTitle(sourceDocument);
  const description =
    readString(translatedPost?.description) || readString(routeDocument.description);
  const sectionLabel =
    readString(categoryParam?.document.title) || readString(categoryParam?.value);
  const markdown = readString(translatedPost?.content) || readString(routeDocument.content);

  return {
    description,
    markdown,
    postId,
    sectionLabel,
    title,
  };
}

export async function DocsPageHeader(props: DocsPageChromeProps) {
  const { description, markdown, postId, sectionLabel, title } = await getDocsPageChromeData(props);

  if (!title && !description && !sectionLabel && !markdown) {
    return null;
  }

  return (
    <section className="docs-page-header bg-[var(--background)] px-5 pt-10 font-sans sm:px-8 lg:px-20">
      <DocsPageChromeDeduper />
      <div className="mx-auto w-full max-w-[720px] xl:mx-0">
        <div className="mb-1 flex min-w-0 items-center justify-between gap-4">
          {sectionLabel ? (
            <p className="text-sm font-semibold capitalize text-[var(--text-muted)]">
              {sectionLabel}
            </p>
          ) : (
            <span />
          )}

          {markdown ? (
            <CopyContentControls
              markdown={markdown}
              contentElementId={`docs-content-${postId}`}
              contentSelector={DOCS_CONTENT_BLOCK_SELECTOR}
            />
          ) : null}
        </div>

        {title ? (
          <h1 className="break-words text-3xl font-bold leading-tight tracking-normal text-[var(--text)]">
            {title}
          </h1>
        ) : null}

        {description ? (
          <p className="mt-2 mb-4 text-lg leading-8 text-[var(--text-muted)]">{description}</p>
        ) : null}
      </div>
    </section>
  );
}

export function DocsPageToc() {
  return (
    <div className="docs-page-toc hidden shrink-0 font-sans xl:block">
      <DocsTableOfContents contentSelector={DOCS_CONTENT_BLOCK_SELECTOR} />
    </div>
  );
}
