import { getRouteSegment } from '@/lib/route-segment';

interface BuildDocsHrefOptions {
  language?: string;
  category: string;
  post: string;
}

export function buildDocsHref({ language, category, post }: BuildDocsHrefOptions): string {
  const prefix = language ? `/${language}` : '';
  return `${prefix}/${category}/${post}`;
}

export function getPostHref({
  post,
  language,
  category,
}: {
  post: Record<string, unknown>;
  language?: string;
  category: string;
}): string {
  const routePath = typeof post._routePath === 'string' ? post._routePath : '';
  if (routePath) {
    return routePath;
  }

  return buildDocsHref({
    language,
    category,
    post: getRouteSegment(post, 'title'),
  });
}
