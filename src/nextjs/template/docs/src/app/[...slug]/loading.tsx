import { ContentSkeleton } from '@/lib/content-skeleton';

/**
 * Shown while switching pages. Scoped to this segment, so the CMS-authored
 * chrome rendered by layout.tsx (navbar, sidebar, footer) stays on screen and
 * only the content column falls back to a skeleton.
 *
 * Renders no wrapper of its own — it stands in for `children` inside `<main>`,
 * so it must be a direct grid child like the content blocks it replaces.
 */
export default function Loading() {
  return <ContentSkeleton />;
}
