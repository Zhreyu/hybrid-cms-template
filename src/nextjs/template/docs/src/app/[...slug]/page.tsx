import ParametricRoutePage from 'cms-renderer/lib/renderer';
import type { BlockComponentRegistry } from 'cms-renderer/lib/types';
import type { Metadata } from 'next';
import FAQAccordion from '@/components/FAQAccordion';
import NavbarBlock from '@/components/NavbarBlock';
import UIContent from '@/components/UIContent';
import AeoFeatureSection from '@/components/UIFeature';
import UIFooter from '@/components/UIFooter';
import UISidebar from '@/components/UISidebar';
import { cmsConfig } from '@/lib/cms-config';
import {
  getCategories,
  getCategoryPostRefsMap,
  getCategoryTitleField,
  getPostsByIds,
} from '@/lib/cms-data';
import {
  getDocsOpenGraphImageUrl,
  getDocsPathFromSlug,
  getDocsRouteMetadata,
  SITE_NAME,
} from '@/lib/docs-metadata';
import { getRouteSegment } from '@/lib/route-segment';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

// Framework filtering is per-user (cookie-backed), so this route must be dynamic.
// Edit mode uses /cms-preview_ route instead.
export const dynamic = 'force-static';

const registry: Partial<BlockComponentRegistry> = {
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  header: NavbarBlock as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uisidebar: UISidebar as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uicontent: UIContent as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uifooter: UIFooter as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  faq_accordion: FAQAccordion as any,
  'features-block': AeoFeatureSection,
  featureSection: AeoFeatureSection,
  feature_section: AeoFeatureSection,
  clickable_feature_grid: AeoFeatureSection,
  aeo_feature_block: AeoFeatureSection,
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
      routeErrorsAsNotFound
    />
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const path = getDocsPathFromSlug(slug);
  const docsMetadata = await getDocsRouteMetadata(path);
  const title = `${docsMetadata.title} - ${SITE_NAME}`;
  const imageUrl = getDocsOpenGraphImageUrl(path);

  return {
    title,
    description: docsMetadata.description,
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      title,
      description: docsMetadata.description,
      url: path,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: docsMetadata.description,
      images: [imageUrl],
    },
  };
}

export async function generateStaticParams(): Promise<{ slug: string[] }[]> {
  const params: { slug: string[] }[] = [];

  try {
    // Fetch all categories from CMS
    const categories = await getCategories();
    const categoryPostRefsById = await getCategoryPostRefsMap(categories);

    // Collect all post IDs from categories
    const allPostIds: string[] = [];
    for (const category of categories) {
      for (const ref of categoryPostRefsById.get(String(category._id)) ?? []) {
        allPostIds.push(ref._ref);
      }
    }

    // Fetch all posts in one batch
    const postsMap = await getPostsByIds(allPostIds);

    // Generate paths for all languages × categories × posts
    for (const lang of SUPPORTED_LANGUAGES) {
      for (const category of categories) {
        const categorySlug = getRouteSegment(category, getCategoryTitleField(category));

        for (const ref of categoryPostRefsById.get(String(category._id)) ?? []) {
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
