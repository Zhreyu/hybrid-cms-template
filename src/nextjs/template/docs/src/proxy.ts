import { createCmsProxy } from 'cms-renderer/lib/proxy';
import { type NextRequest, NextResponse } from 'next/server';
import { cmsConfig } from '@/lib/cms-config';


function resolvePublicOrigin(): string | undefined {
  if (process.env.NEXT_PUBLIC_WEBSITE_URL) {
    return process.env.NEXT_PUBLIC_WEBSITE_URL;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'NEXT_PUBLIC_WEBSITE_URL or VERCEL_PROJECT_PRODUCTION_URL is required for the CMS proxy in production'
    );
  }

  return undefined;
}

const publicOrigin = resolvePublicOrigin();
const upstream = process.env.ADMIN_UPSTREAM_ORIGIN ?? cmsConfig.cmsUrl;
const cmsProxy = createCmsProxy({ upstream, publicOrigin });
const publicUrl = publicOrigin ? new URL(publicOrigin) : undefined;
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

function getFrontendUrl(request: NextRequest): URL {
  return publicUrl ?? request.nextUrl;
}

function rewriteAdminFlightRequest(
  request: NextRequest,
  pathname: string,
  frontendUrl: URL
): NextResponse {
  const upstreamUrl = new URL(pathname, upstream);
  upstreamUrl.search = request.nextUrl.search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  const forwardedHeaders = {
    'x-forwarded-host': frontendUrl.host,
    'x-forwarded-proto': frontendUrl.protocol.slice(0, -1),
    'x-forwarded-for': request.headers.get('x-forwarded-for') ?? '',
  };
  for (const [name, value] of Object.entries(forwardedHeaders)) {
    headers.set(name, value);
  }

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

function isCmsBackendRoute(pathname: string): boolean {
  // Match CMS route families without capturing public paths such as /administrator.
  const rootPath = pathname.split('/', 2)[1];

  switch (rootPath) {
    case 'admin':
    case 'api':
    case 'auth':
      return true;
  }

  // Login and logout are standalone endpoints rather than route families.
  switch (pathname) {
    case '/login':
    case '/logout':
      return true;
  }

  return false;
}

export default async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, searchParams } = request.nextUrl;

  // Admin/api/auth/login/logout routes - always proxy directly to CMS backend
  // Must check BEFORE edit_mode to prevent /admin being rewritten to /preview
  if (isCmsBackendRoute(pathname)) {
    if (isAdminFlightRequest(request, pathname)) {
      return rewriteAdminFlightRequest(request, pathname, getFrontendUrl(request));
    }

    // biome-ignore lint/suspicious/noExplicitAny: Next and cms-renderer disagree on the proxy request type
    const response = await cmsProxy(request as unknown as any);
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
    '/login',
    '/logout',
    '/((?:.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|txt|xml|wasm))$)',
    // Edit mode - match all page routes for ?edit_mode=true detection
    '/((?!_next/static|_next/image|favicon.ico|cms-preview_).*)',
  ],
};
