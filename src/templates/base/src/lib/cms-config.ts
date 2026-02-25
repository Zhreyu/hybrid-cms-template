export const cmsConfig = {
  cmsUrl: process.env.NEXT_PUBLIC_PROFOUND_CMS_URL ?? 'https://cms.dev.tryprofound.com',
  apiKey: process.env.PROFOUND_API_KEY,
  websiteId: process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID ?? '',
};
