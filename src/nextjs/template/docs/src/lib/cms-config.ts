const websiteId =
  process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID?.trim() ||
  process.env.DOCS_PROFOUND_WEBSITE_ID?.trim() ||
  process.env.NEXT_PUBLIC_WEBSITE_ID?.trim() ||
  undefined;

export const cmsConfig = {
  cmsUrl: process.env.NEXT_PUBLIC_CMS_API_URL ?? 'https://cms.dev.tryprofound.com',
  apiKey: process.env.PROFOUND_API_KEY,
  websiteId,
};