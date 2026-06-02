import ParametricRoutePage from 'cms-renderer/lib/renderer';
import type { BlockComponentRegistry } from 'cms-renderer/lib/types';
import NavbarBlock from '@/components/NavbarBlock';
import UIContent from '@/components/UIContent';
import UIFooter from '@/components/UIFooter';
import UISidebar from '@/components/UISidebar';
import { cmsConfig } from '@/lib/cms-config';
import {
  getCategories,
  getCategoryRefs,
  getCategoryTitleField,
  getPostsByIds,
} from '@/lib/cms-data';
import { getRouteSegment } from '@/lib/route-segment';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

// ISR: Revalidate pages every 60 seconds
export const revalidate = 60;
export const dynamicParams = true;

// Framework filtering is per-user (cookie-backed), so this route must be dynamic.
// Edit mode uses /cms-preview_ route instead.
export const dynamic = 'force-dynamic';

const registry: Partial<BlockComponentRegistry> = {
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  header: NavbarBlock as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uisidebar: UISidebar as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uicontent: UIContent as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uifooter: UIFooter as any,
};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <ParametricRoutePage
      registry={registry}
      apiKey={cmsConfig.apiKey}
      {...(cmsConfig.websiteId ? { websiteId: cmsConfig.websiteId } : {})}
      cmsUrl={cmsConfig.cmsUrl}
      params={Promise.resolve({ slug })}
    />
  );
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const params: { slug: string[] }[] = [];

  try {
    // Fetch all categories from CMS
    const categories = await getCategories();

    // Collect all post IDs from categories
    const allPostIds: string[] = [];
    for (const category of categories) {
      for (const ref of getCategoryRefs(category)) {
        allPostIds.push(ref._ref);
      }
    }

    // Fetch all posts in one batch
    const postsMap = await getPostsByIds(allPostIds);

    // Generate paths for all languages × categories × posts
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const category of categories) {
        const categorySlug = getRouteSegment(category, getCategoryTitleField(category));

        for (const ref of getCategoryRefs(category)) {
          const post = postsMap.get(ref._ref);
          if (!post) continue;

          const postSlug = getRouteSegment(post, 'title');
          params.push({ slug: [lang.code, categorySlug, postSlug] });
        }
      }
    }

    console.log(`[generateStaticParams] Pre-rendering ${params.length} paths from CMS`);
  } catch (error) {
    console.error('[generateStaticParams] CMS fetch failed, using minimal fallback:', error);

    // Fallback: pre-render only entry points if CMS unavailable
    const fallbackCategories = ['headless', 'cms', 'api'];
    const defaultPost = 'quickstart';

    for (const lang of SUPPORTED_LANGUAGES) {
      for (const category of fallbackCategories) {
        params.push({ slug: [lang.code, category, defaultPost] });
      }
    }

    console.log(`[generateStaticParams] Using fallback: ${params.length} paths`);
  }

  return params;
}
