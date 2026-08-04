const websiteId =
  process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID?.trim() ||
  process.env.DOCS_PROFOUND_WEBSITE_ID?.trim() ||
  process.env.NEXT_PUBLIC_WEBSITE_ID?.trim() ||
  undefined;

// Standalone dataset service (Rust port of /api/schemas, on the translation_manager
// EC2 host). When set, published document reads go here instead of the CMS app.
const datasetEndpoint = process.env.DATASET_ENDPOINT?.trim() || undefined;

export const cmsConfig = {
  cmsUrl: process.env.NEXT_PUBLIC_CMS_API_URL ?? 'https://cms.dev.tryprofound.com',
  apiKey: process.env.PROFOUND_API_KEY,
  websiteId,
  datasetEndpoint,
};
