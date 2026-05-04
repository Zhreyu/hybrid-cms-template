import './globals.css';
import 'cms-renderer/styles/docs-markdown.css';
import { Refresher } from 'cms-renderer/lib/refresher';
import type { Metadata } from 'next';
import { revalidatePath, revalidateTag } from 'next/cache';
import { cmsConfig } from '@/lib/cms-config';
import { SEARCH_ENTRIES_CACHE_TAG } from '@/lib/search-index';

export const metadata: Metadata = {
  title: 'documentation',
  description: 'Built with create-profound-app',
};

async function revalidate() {
  'use server';
  revalidatePath('/', 'layout');
  revalidateTag(SEARCH_ENTRIES_CACHE_TAG, 'max');
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Refresher
          websiteId={cmsConfig.websiteId}
          cmsUrl={cmsConfig.cmsUrl}
          apiKey={cmsConfig.apiKey}
          onInvalidate={revalidate}
        />
      </body>
    </html>
  );
}
