'use client';

import { useEffect, useState } from 'react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

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

export function DocsTableOfContents({ contentId }: { contentId: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = document.getElementById(contentId);
    if (!container) {
      setHeadings([]);
      return;
    }

    const elements = Array.from(container.querySelectorAll('h2, h3'));
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
  }, [contentId]);

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
    <nav aria-label="Table of contents" className="text-sm">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
        On This Page
      </p>
      <ul className="space-y-1">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={[
                'block break-words py-1 no-underline transition-colors',
                h.level === 3 ? 'pl-4 text-[13px]' : 'text-[13px]',
                activeId === h.id
                  ? 'font-medium text-[var(--accent)]'
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
