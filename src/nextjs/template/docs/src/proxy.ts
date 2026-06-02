import { createCmsProxy } from 'cms-renderer/lib/proxy';
import { NextRequest, NextResponse } from 'next/server';
import { cmsConfig } from '@/lib/cms-config';

const upstream = process.env.ADMIN_UPSTREAM_ORIGIN ?? cmsConfig.cmsUrl;
const cmsProxy = createCmsProxy({ upstream });
const ADMIN_BOOT_PARAM = '__cms_admin_boot';
const CMS_PROXIED_ADMIN_COOKIE = 'cms_proxied_admin';

function markProxiedAdmin(response: NextResponse): void {
  response.cookies.set(CMS_PROXIED_ADMIN_COOKIE, '1', {
    path: '/',
    sameSite: 'lax',
  });
}

function clearProxiedAdmin(response: NextResponse): void {
  response.cookies.delete(CMS_PROXIED_ADMIN_COOKIE);
}

function isFromAdminReferer(request: NextRequest): boolean {
  const referer = request.headers.get('referer');
  if (!referer) return false;

  try {
    return new URL(referer).pathname.startsWith('/admin');
  } catch {
    return false;
  }
}

function isAdminDocumentRequest(request: NextRequest, pathname: string): boolean {
  if (!pathname.startsWith('/admin') || request.method !== 'GET') {
    return false;
  }

  if (isAdminFlightRequest(request, pathname)) {
    return false;
  }

  return (request.headers.get('accept') ?? '').includes('text/html');
}

function createAdminBootResponse(request: NextRequest): NextResponse {
  const targetUrl = request.nextUrl.clone();
  targetUrl.searchParams.set(ADMIN_BOOT_PARAM, '1');
  const target = `${targetUrl.pathname}${targetUrl.search}`;
  const escapedTarget = JSON.stringify(target);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Loading admin...</title>
    <style>
      body{margin:0;background:#0d0d0d;color:#f3f4f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      .top{border-bottom:1px solid #1f1f1f;background:#0d0d0d}
      .top-inner{max-width:1600px;margin:0 auto;min-height:56px;display:flex;align-items:center;gap:12px;padding:12px 24px}
      .grid{max-width:1600px;margin:0 auto;display:grid;grid-template-columns:260px minmax(0,1fr);gap:32px}
      .sidebar{min-height:calc(100vh - 56px);border-right:1px solid #1f1f1f;padding:24px 16px}
      .content{padding:40px 32px}
      .pill,.line{background:#141414;border-radius:999px;animation:pulse 1.4s ease-in-out infinite}
      .muted{background:#121212}.card{height:128px;background:#101010;border:1px solid #1a1a1a;border-radius:16px;animation:pulse 1.4s ease-in-out infinite}
      @keyframes pulse{0%,100%{opacity:.55}50%{opacity:1}}
      @media (max-width:767px){.grid{grid-template-columns:65px minmax(0,1fr);gap:0}.sidebar{padding:16px 8px}.content{padding:32px 16px}}
    </style>
  </head>
  <body>
    <div class="top"><div class="top-inner">
      <div class="pill" style="width:20px;height:20px;border-radius:4px"></div>
      <div class="pill" style="width:96px;height:16px"></div>
      <div style="flex:1;display:flex;justify-content:center"><div class="muted" style="width:min(480px,100%);height:36px;border:1px solid #1f1f1f;border-radius:8px"></div></div>
      <div class="muted" style="width:112px;height:36px;border:1px solid #1f1f1f;border-radius:999px"></div>
    </div></div>
    <div class="grid">
      <aside class="sidebar">
        <div class="line" style="width:96px;height:12px;margin-bottom:12px"></div>
        <div style="display:grid;gap:8px">
          <div class="muted" style="height:16px;border-radius:6px"></div>
          <div class="muted" style="height:16px;border-radius:6px"></div>
          <div class="muted" style="height:16px;border-radius:6px"></div>
        </div>
      </aside>
      <main class="content">
        <div style="max-width:768px">
          <div class="line" style="width:112px;height:12px;margin-bottom:12px"></div>
          <div class="pill" style="width:288px;max-width:100%;height:40px;margin-bottom:12px"></div>
          <div class="line" style="width:100%;max-width:672px;height:16px;margin-bottom:40px;background:#131313"></div>
          <div style="display:grid;gap:32px"><div class="card"></div><div class="card"></div><div class="card"></div></div>
        </div>
      </main>
    </div>
    <script>setTimeout(() => window.location.replace(${escapedTarget}), 700);</script>
  </body>
</html>`;

  const response = new NextResponse(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, max-age=0',
    },
  });

  return response;
}

function stripAdminBootParam(request: NextRequest): NextRequest {
  if (!request.nextUrl.searchParams.has(ADMIN_BOOT_PARAM)) {
    return request;
  }

  const url = request.nextUrl.clone();
  url.searchParams.delete(ADMIN_BOOT_PARAM);

  return new NextRequest(url, request);
}

function isAdminFlightRequest(request: NextRequest, pathname: string): boolean {
  if (!pathname.startsWith('/admin') || request.method !== 'GET') {
    return false;
  }

  return (
    request.headers.get('rsc') === '1' ||
    request.nextUrl.searchParams.has('_rsc') ||
    request.headers.has('next-router-state-tree')
  );
}

function rewriteAdminFlightRequest(request: NextRequest, pathname: string): NextResponse {
  const upstreamUrl = new URL(pathname, upstream);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.set('x-forwarded-host', request.headers.get('host') ?? request.nextUrl.host);
  headers.set('x-forwarded-proto', request.nextUrl.protocol.replace(':', ''));
  headers.set('x-forwarded-for', request.headers.get('x-forwarded-for') ?? '');

  const response = NextResponse.rewrite(upstreamUrl, {
    request: { headers },
  });

  // Mark only Next/static asset requests as admin-owned. The shared proxy
  // uses this as a fallback when the browser does not send Referer.
  response.cookies.set('cms_admin_assets', '1', {
    path: '/_next',
    sameSite: 'lax',
  });

  response.headers.set('x-proxied-by', 'cms-proxy-rewrite');
  markProxiedAdmin(response);
  return response;
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;

  // Admin/api/auth routes - always proxy directly to CMS backend
  // Must check BEFORE edit_mode to prevent /admin being rewritten to /preview
  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/auth')
  ) {
    const shouldBootAdmin =
      isAdminDocumentRequest(request, pathname) &&
      !isFromAdminReferer(request) &&
      !searchParams.has(ADMIN_BOOT_PARAM);

    if (shouldBootAdmin) {
      return createAdminBootResponse(request);
    }

    if (isAdminFlightRequest(request, pathname)) {
      return rewriteAdminFlightRequest(request, pathname);
    }

    const upstreamRequest = pathname.startsWith('/admin') ? stripAdminBootParam(request) : request;
    // biome-ignore lint/suspicious/noExplicitAny: Next and cms-renderer disagree on the proxy request type
    const response = await cmsProxy(upstreamRequest as unknown as any);
    if (pathname.startsWith('/admin')) {
      // Mark only Next/static asset requests as admin-owned. The shared proxy
      // uses this as a fallback when the browser does not send Referer.
      response.cookies.set('cms_admin_assets', '1', {
        path: '/_next',
        sameSite: 'lax',
      });
      markProxiedAdmin(response as unknown as NextResponse);
    }
    return response as unknown as NextResponse;
  }

  // Let the shared proxy decide whether each asset belongs to the CMS admin UI
  // or to the docs app. That decision depends on Referer and the admin-assets
  // fallback cookie above.
  if (pathname.startsWith('/_next') || /\.[a-zA-Z0-9]+$/.test(pathname)) {
    // biome-ignore lint/suspicious/noExplicitAny: Next and cms-renderer disagree on the proxy request type
    const response = await cmsProxy(request as unknown as any);
    return response as unknown as NextResponse;
  }

  // Edit mode - rewrite to /cms-preview_ route for dynamic rendering
  // Production pages use force-static, so searchParams require /cms-preview_ (force-dynamic)
  const editMode = searchParams.get('edit_mode');
  const aiPreview = searchParams.get('ai_preview');

  const segments = pathname.split('/').filter(Boolean);
  const isPreviewRoute = segments[0] === 'cms-preview_';

  if ((editMode === 'true' || editMode === '1' || aiPreview) && !isPreviewRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/cms-preview_${pathname}`;
    const response = NextResponse.rewrite(url);
    response.cookies.delete('cms_admin_assets');
    clearProxiedAdmin(response);
    return response;
  }

  const response = NextResponse.next();
  response.cookies.delete('cms_admin_assets');
  clearProxiedAdmin(response);
  return response;
}

export const config = {
  matcher: [
    // CMS proxy routes
    '/admin',
    '/admin/:path*',
    '/api/:path*',
    '/auth/:path*',
    '/_next/:path*',
    '/((?:.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|txt|xml))$)',
    // Edit mode - match all page routes for ?edit_mode=true detection
    '/((?!_next/static|_next/image|favicon.ico|cms-preview_).*)',
  ],
};
