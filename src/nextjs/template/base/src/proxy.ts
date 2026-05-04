import { createCmsProxy } from "cms-renderer/lib/proxy";
import type { NextRequest, NextResponse } from "next/server";
import { cmsConfig } from "@/lib/cms-config";

const cmsProxy = createCmsProxy({ upstream: cmsConfig.cmsUrl });

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