export const cmsConfig = {
  cmsUrl:
    process.env.NEXT_PUBLIC_CMS_API_URL ??
    process.env.VITE_PUBLIC_CMS_API_URL ??
    'https://cms.dev.tryprofound.com',
  apiKey: process.env.PROFOUND_API_KEY,
  websiteId:
    process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID ??
    process.env.VITE_PUBLIC_PROFOUND_WEBSITE_ID ??
    '',
}
