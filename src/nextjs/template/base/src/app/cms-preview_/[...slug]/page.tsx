/**
 * Preview Route for CMS Edit Mode
 *
 * Renders with force-dynamic so searchParams (edit_mode, ai_preview) are read at
 * request time, enabling the CMS template builder overlays.
 *
 * Production pages use /[...slug]/page.tsx. The proxy rewrites any request
 * carrying ?edit_mode / ?ai_preview to /cms-preview_/<path>.
 */

import ParametricRoutePage from "cms-renderer/lib/renderer";
import { cmsConfig } from "@/lib/cms-config";

// Dynamic rendering - allows searchParams for edit_mode
export const dynamic = "force-dynamic";

// Registry maps CMS component types to your React components.
// Keep this in sync with the production /[...slug] route.
const registry = {};

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { slug } = await params;

  return (
    <ParametricRoutePage
      registry={registry}
      apiKey={cmsConfig.apiKey ?? ""}
      websiteId={cmsConfig.websiteId}
      cmsUrl={cmsConfig.cmsUrl}
      params={Promise.resolve({ slug })}
      searchParams={searchParams}
    />
  );
}
