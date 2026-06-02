/**
 * Preview Route for CMS Edit Mode
 *
 * This route allows searchParams to be read at request time,
 * enabling edit_mode detection for CMS template builder overlays.
 *
 * Production pages use /[...slug]/page.tsx with force-static.
 * CMS edit mode uses /cms-preview_/[...slug]/page.tsx with force-dynamic.
 */

import ParametricRoutePage from 'cms-renderer/lib/renderer';
import type { BlockComponentRegistry } from 'cms-renderer/lib/types';
import NavbarBlock from '@/components/NavbarBlock';
import UIContent from '@/components/UIContent';
import UIFooter from '@/components/UIFooter';
import UISidebar from '@/components/UISidebar';
import { cmsConfig } from '@/lib/cms-config';

// Dynamic rendering - allows searchParams for edit_mode
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
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { slug } = await params;

  return (
    <ParametricRoutePage
      registry={registry}
      apiKey={cmsConfig.apiKey}
      {...(cmsConfig.websiteId ? { websiteId: cmsConfig.websiteId } : {})}
      cmsUrl={cmsConfig.cmsUrl}
      params={Promise.resolve({ slug })}
      searchParams={searchParams}
    />
  );
}
