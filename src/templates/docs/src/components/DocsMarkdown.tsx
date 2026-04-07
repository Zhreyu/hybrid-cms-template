import { DocsMarkdown as RendererDocsMarkdown } from 'cms-renderer/lib/docs-markdown';
import { ClickableImage } from './ClickableImage';

export async function DocsMarkdown({ content }: { content: string }) {
  return RendererDocsMarkdown({
    content,
    renderImage: (props: {
      src: string;
      alt: string;
      title?: string;
      loading?: 'eager' | 'lazy';
    }) => (
      <ClickableImage {...props} />
    ),
  });
}
