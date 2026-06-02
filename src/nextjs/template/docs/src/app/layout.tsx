import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Refresher } from 'cms-renderer/lib/refresher';
import type { Metadata } from 'next';
import { revalidatePath, revalidateTag } from 'next/cache';
import Script from 'next/script';
import type { ReactNode } from 'react';

import { cmsConfig } from '@/lib/cms-config';
import { SEARCH_ENTRIES_CACHE_TAG } from '@/lib/search-index';
import { THEME_BOOTSTRAP_SCRIPT, ThemeProvider } from '@/lib/theme-provider';

import 'cms-renderer/styles/docs-markdown.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'documentation',
  description: 'Built with create-profound-next',
};

async function revalidate() {
  'use server';
  revalidatePath('/', 'layout');
  revalidateTag(SEARCH_ENTRIES_CACHE_TAG, 'max');
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {THEME_BOOTSTRAP_SCRIPT}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          {children}
           {cmsConfig.websiteId ? (
              <Refresher
                websiteId={cmsConfig.websiteId}
                cmsUrl={cmsConfig.cmsUrl}
                apiKey={cmsConfig.apiKey}
                onInvalidate={revalidate}
              />
            ) : null}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
