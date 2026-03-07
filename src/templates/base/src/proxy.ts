import { createCmsProxy } from "cms-renderer/lib/proxy";
import type { NextRequest, NextResponse } from "next/server";

const upstream = "https://cms.dev.tryprofound.com";
const cmsProxy = createCmsProxy({ upstream });

export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const response = await cmsProxy(request);
  return response;
};

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