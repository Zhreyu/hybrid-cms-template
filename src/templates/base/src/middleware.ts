import { createCmsProxy } from "cms-renderer/lib/proxy";

export const proxy = createCmsProxy({
  upstream:
    process.env.NEXT_PUBLIC_PROFOUND_CMS_URL ??
    "https://cms.dev.tryprofound.com",
});

export default proxy;

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/_next/:path*",
    "/((?:.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|txt|xml))$)",
  ],
};
