'use client';

import { useEffect } from 'react';

function applyDocsPageChromeDedupe() {
  const headers = Array.from(document.querySelectorAll<HTMLElement>('.docs-page-header'));
  const tocs = Array.from(document.querySelectorAll<HTMLElement>('.docs-page-toc'));

  headers.forEach((header, index) => {
    header.hidden = index > 0;
  });

  tocs.forEach((toc, index) => {
    toc.hidden = index > 0;
  });
}

export function DocsPageChromeDeduper() {
  useEffect(() => {
    applyDocsPageChromeDedupe();

    const observer = new MutationObserver(() => {
      applyDocsPageChromeDedupe();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return null;
}
