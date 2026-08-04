'use client';

import { Bars3CenterLeftIcon } from '@heroicons/react/16/solid';
import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

const headingLevelClasses: Record<number, string> = {
  2: 'pl-0 text-sm font-medium',
  3: 'pl-4 text-sm text-gray-400',
  4: 'pl-8 text-[13px] text-gray-500',
  5: 'pl-12 text-[13px] text-gray-600',
  6: 'pl-16 text-xs',
};

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .slice(0, 100) || 'section'
  );
}

export function DocsTableOfContents({
  contentId,
  contentSelector,
}: {
  contentId?: string;
  contentSelector?: string;
}) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const selectorHeadings = contentSelector
      ? Array.from(
          document.querySelectorAll(
            `${contentSelector} h2, ${contentSelector} h3, ${contentSelector} h4, ${contentSelector} h5, ${contentSelector} h6`
          )
        )
      : [];
    const container = contentId ? document.getElementById(contentId) : null;
    const containerHeadings = container
      ? Array.from(container.querySelectorAll('h2, h3, h4, h5, h6'))
      : [];
    const blockHeadings = Array.from(document.querySelectorAll('[data-docs-toc-heading]'));
    const elements = Array.from(
      new Set([...selectorHeadings, ...containerHeadings, ...blockHeadings])
    ).sort((left, right) => {
      const position = left.compareDocumentPosition(right);
      if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      return 0;
    });
    const slugCounts = new Map<string, number>();
    const items: Heading[] = elements.map((el) => {
      const text = el.textContent?.trim() ?? '';
      const base = slugify(text);
      const seen = slugCounts.get(base) ?? 0;
      slugCounts.set(base, seen + 1);
      const id = el.id || (seen === 0 ? base : `${base}-${seen}`);
      if (!el.id) {
        el.id = id;
      }
      return { id, text, level: Number(el.tagName.charAt(1)) };
    });

    setHeadings(items);
  }, [contentId, contentSelector]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((e) => e.isIntersecting)
          .sort(
            (a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top
          );
        if (inView.length > 0 && inView[0]) {
          setActiveId(inView[0].target.id);
        }
      },
      { rootMargin: '0px 0px -70% 0px', threshold: 0 }
    );

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="w-52 text-sm">
      <p className="mb-3 pl-4 flex items-center gap-2 text-sm text-[var(--text)]">
        <Bars3CenterLeftIcon className="size-3.5 text-[var(--text-muted)]" aria-hidden={true} />
        On this page
      </p>
      <ul className="space-y-2 pl-4">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={[
                'block break-words no-underline transition-colors',
                headingLevelClasses[h.level] ?? headingLevelClasses[2],
                activeId === h.id
                  ? 'font-medium text-[var(--text)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
