import ParametricRoutePage from "cms-renderer/lib/renderer";
import { cmsConfig } from "@/lib/cms-config";

// Production route. CMS edit mode is served by /cms-preview_/[...slug] (force-dynamic),
// which the proxy rewrites to whenever ?edit_mode / ?ai_preview is present.

// Registry maps CMS component types to your React components.
// Add entries here as you build out your component library.
const registry = {};

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  return (
    <ParametricRoutePage
      registry={registry}
      apiKey={cmsConfig.apiKey ?? ""}
      websiteId={cmsConfig.websiteId}
      cmsUrl={cmsConfig.cmsUrl}
      params={Promise.resolve({ slug })}
    />
  );
}
