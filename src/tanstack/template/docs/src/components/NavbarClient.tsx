'use client';

import { MoonIcon } from '@heroicons/react/16/solid';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Header } from '@/generated/cms-schemas';
import type { SearchEntry } from '@/lib/search-index';
import { buildSnippet, getSearchResults } from '@/lib/search-query';
import { SearchBar } from './SearchBar';

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export type NavbarBlockProps = Omit<Header, 'nav_links'> & {
  nav_links?: NavLink[];
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName;
  return (
    target.isContentEditable ||
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT'
  );
}

function buildAssetUrl(url?: string, mimeType?: string): string | undefined {
  if (!url) return undefined;

  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  const ext = mimeType ? `.${mimeType.split('/')[1]}` : '';
  const urlWithExt = `${url}${/\.[a-z0-9]+$/i.test(url) ? '' : ext}`;
  const normalizedPath = urlWithExt.replace(/^\/+/, '');
  const path = urlWithExt.startsWith('/')
    ? `/${normalizedPath}`
    : urlWithExt.includes('/')
      ? `/${normalizedPath}`
      : `/uploads/${normalizedPath}`;

  const cdnBase = process.env.NEXT_PUBLIC_BUNNY_CDN_URL?.trim().replace(/\/+$/, '');
  return cdnBase ? `${cdnBase}${path}` : path;
}

function SearchModal({
  open,
  onClose,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  entries: SearchEntry[];
}) {
  const [query, setQuery] = useState('');
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => getSearchResults(entries, deferredQuery), [deferredQuery, entries]);

  const openResult = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;

      window.location.assign(result.href);
      onClose();
      setQuery('');
      setActiveResultIndex(0);
    },
    [onClose, results]
  );

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveResultIndex(0);
    }
  }, [open]);

  useEffect(() => {
    if (results.length === 0) {
      setActiveResultIndex(0);
      return;
    }

    if (activeResultIndex >= results.length) {
      setActiveResultIndex(results.length - 1);
    }
  }, [activeResultIndex, results]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }

      if (event.key === 'ArrowDown' && results.length > 0) {
        event.preventDefault();
        setActiveResultIndex((currentIndex) => (currentIndex + 1) % results.length);
      }

      if (event.key === 'ArrowUp' && results.length > 0) {
        event.preventDefault();
        setActiveResultIndex((currentIndex) =>
          currentIndex === 0 ? results.length - 1 : currentIndex - 1
        );
      }

      if (event.key === 'Enter' && results[activeResultIndex]) {
        event.preventDefault();
        openResult(activeResultIndex);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeResultIndex, onClose, open, results, openResult]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] px-4 py-4 sm:py-12">
      <button
        type="button"
        aria-label="Close search"
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative mx-auto flex max-h-[min(720px,100%)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#1f1f1f] bg-[#0d0d0d] shadow-2xl">
        <div className="border-b border-[#1f1f1f] p-4">
          <SearchBar
            placeholder="Search docs..."
            value={query}
            onChange={(value) => {
              setQuery(value);
              setActiveResultIndex(0);
            }}
            autoFocus
            showShortcut={false}
          />
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-3 py-10 text-center text-sm text-[#6b7280]">
              No results for "{query}".
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.href}
                type="button"
                onClick={() => openResult(index)}
                onMouseEnter={() => setActiveResultIndex(index)}
                className={[
                  'flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-colors',
                  activeResultIndex === index ? 'bg-[#151515]' : 'hover:bg-[#151515]',
                ].join(' ')}
              >
                <div className="text-xs uppercase tracking-[0.18em] text-[#6b7280]">
                  {result.category}
                </div>
                <div className="text-base font-semibold text-[#f3f4f6]">{result.title}</div>
                <div className="text-sm leading-6 text-[#9ca3af]">
                  {buildSnippet(result, deferredQuery)}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function NavbarClient({
  content,
  searchEntries,
}: {
  content: NavbarBlockProps;
  searchEntries: SearchEntry[];
}) {
  const {
    icon,
    logo_text = 'Profound',
    admin_panel_label = 'Admin Panel',
    admin_panel_href = '/admin',
    search_placeholder = 'Search...',
    nav_links = [],
  } = content;

  const iconAsset = icon as
    | { _asset?: { url?: string; mime_type?: string }; alt?: string }
    | undefined;
  const iconUrl = buildAssetUrl(iconAsset?._asset?.url, iconAsset?._asset?.mime_type);
  const iconAlt = iconAsset?.alt ?? 'logo';

  const [activeLink, setActiveLink] = useState(
    nav_links.find((l) => l.active)?.label ?? nav_links[0]?.label
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = navRef.current;
    if (!element) return;

    // Keep the shared sticky offset in sync with the rendered nav height.
    const updateHeight = () => {
      document.documentElement.style.setProperty('--docs-nav-height', `${element.offsetHeight}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      if (event.key === '/' && !isTypingTarget(event.target)) {
        event.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <nav ref={navRef} className="border-b border-[#1f1f1f] bg-[#0d0d0d] font-sans select-none">
        <div className="mx-auto flex min-h-14 w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <a href="/" className="flex min-w-0 shrink items-center gap-2 no-underline">
            {iconUrl && (
              <img src={iconUrl} alt={iconAlt} width={18} height={18} className="object-contain" />
            )}
            <span className="truncate text-[15px] font-semibold tracking-tight text-[#f3f4f6]">
              {logo_text}
            </span>
          </a>

          <div className="order-3 w-full md:order-none md:flex md:flex-1 md:justify-center">
            <SearchBar
              placeholder={search_placeholder}
              readOnly
              onFocus={() => setIsSearchOpen(true)}
              onClick={() => setIsSearchOpen(true)}
              className="mx-auto max-w-[22rem] sm:max-w-[26rem] md:max-w-[480px]"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            <a
              href={admin_panel_href}
              className="hidden items-center gap-1.5 rounded-full border border-[#2a2a2a] bg-[#141414] px-3 py-1.5 text-sm font-medium text-[#d1d5db] no-underline transition-colors hover:border-[#294132] hover:bg-[#131814] hover:text-[#86efac] sm:inline-flex"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]/70" />
              {admin_panel_label}
            </a>
            <button
              type="button"
              aria-label="Toggle theme"
              className="flex items-center justify-center border-none bg-transparent p-1 text-[#9ca3af] transition-opacity hover:opacity-70"
            >
              <MoonIcon className="size-4 cursor-pointer" />
            </button>
          </div>
        </div>

        {nav_links.length > 0 && (
          <div className="border-t border-[#1a1a1a]">
            <div className="mx-auto w-full max-w-[1600px] overflow-x-auto px-4 sm:px-6">
              <div className="flex min-w-max">
                {nav_links.map((link) => {
                  const isActive = activeLink === link.label;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      onClick={() => {
                        setActiveLink(link.label);
                      }}
                      className={[
                        'inline-block whitespace-nowrap px-3.5 py-2.5 text-sm no-underline transition-colors -mb-px',
                        isActive
                          ? 'border-b-2 border-[#22c55e] font-semibold text-[#f3f4f6]'
                          : 'border-b-2 border-transparent font-normal text-[#6b7280] hover:text-[#d1d5db]',
                      ].join(' ')}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </nav>

      <SearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        entries={searchEntries}
      />
    </>
  );
}
