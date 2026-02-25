import { ParametricRoutePage } from "cms-renderer";

// Registry maps CMS component types to your React components.
// Add entries here as you build out your component library.
const registry = {};

interface PageProps {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;

  return (
    <ParametricRoutePage
      registry={registry}
      apiKey={process.env.PROFOUND_API_KEY ?? ""}
      websiteId={process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID ?? ""}
      cmsUrl={
        process.env.NEXT_PUBLIC_PROFOUND_CMS_URL ??
        "https://cms.dev.tryprofound.com"
      }
      params={Promise.resolve({ slug })}
      searchParams={searchParams}
    />
  );
}
