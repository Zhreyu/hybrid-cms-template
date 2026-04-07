import { createCmsProxy } from 'cms-renderer/lib/proxy';
import type { NextRequest, NextResponse } from 'next/server';
import { cmsConfig } from './src/lib/cms-config';

const cmsProxy = createCmsProxy({ upstream: cmsConfig.cmsUrl });

export const proxy = async (request: NextRequest): Promise<NextResponse> => {
  // biome-ignore lint/suspicious/noExplicitAny: Next and cms-renderer disagree on the proxy request type
  const response = await cmsProxy(request as unknown as any);
  return response as unknown as NextResponse;
};

export const config = {
  matcher: [
    '/admin',
    '/admin/:path*',
    '/api/:path*',
    '/auth/:path*',
    '/_next/:path*',
    '/((?:.*\\.(?:css|js|map|png|jpg|jpeg|gif|svg|ico|webp|avif|woff|woff2|ttf|eot|txt|xml))$)',
  ],
};
