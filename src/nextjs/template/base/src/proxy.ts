import { createCmsProxy } from "cms-renderer/lib/proxy";
import { NextRequest, NextResponse } from "next/server";
import { cmsConfig } from "@/lib/cms-config";

const upstream = process.env.ADMIN_UPSTREAM_ORIGIN ?? cmsConfig.cmsUrl;

// The prebuilt cms-renderer proxy only forwards a fixed set of static extensions
// (its STATIC_FILE_REGEX has no `wasm`), so the admin panel's .wasm assets never
// reach upstream. Route `/wasm` through additionalPaths, which is forwarded
// unconditionally before the regex/Referer gate.
const cmsProxy = createCmsProxy({ upstream, additionalPaths: ["/wasm"] });

export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const { pathname, searchParams } = request.nextUrl;

  // Admin / api / auth routes, the admin panel's /wasm assets, and static files
  // are handled by the shared CMS proxy (it decides per-request what to forward).
  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/wasm") ||
    pathname.startsWith("/_next") ||
    /\.[a-zA-Z0-9]+$/.test(pathname)
  ) {
    return cmsProxy(request);
  }

  // Edit mode renders through the force-dynamic /cms-preview_ route so the CMS
  // template builder can read edit_mode / ai_preview searchParams at request time.
  const editMode = searchParams.get("edit_mode");
  const aiPreview = searchParams.get("ai_preview");

  if (
    (editMode === "true" || editMode === "1" || aiPreview) &&
    !pathname.startsWith("/cms-preview_")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = `/cms-preview_${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
};

export const config = {
  matcher: [
    // CMS proxy routes
    "/admin",
    "/admin/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/wasm/:path*",
    "/_next/:path*",
    "/((?:.*\\.(?:css|js|map|wasm|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|txt|xml))$)",
    // Edit mode - match all page routes for ?edit_mode=true detection (excluding the preview route itself)
    "/((?!_next/static|_next/image|favicon.ico|cms-preview_).*)",
  ],
};
