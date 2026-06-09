'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { buildAssetUrl } from '@/lib/asset-url';
import type { SearchEntry } from '@/lib/search-index';
import { buildSnippet, getSearchResults } from '@/lib/search-query';
import type { HeaderBlockContent } from './cms-block-types';
import { FrameworkDropdown } from './FrameworkDropdown';
import { LanguageDropdown } from './LanguageDropdown';
import { SearchBar } from './SearchBar';
import { ThemeMenu } from './ThemeMenu';

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export type NavbarBlockProps = Omit<HeaderBlockContent, 'nav_links'> & {
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

function SearchModal({
  open,
  onClose,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  entries: SearchEntry[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [activeResultIndex, setActiveResultIndex] = useState(0);
  const deferredQuery = useDeferredValue(query);
  const results = useMemo(() => getSearchResults(entries, deferredQuery), [deferredQuery, entries]);

  const openResult = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;

      router.push(result.href);
      onClose();
      setQuery('');
      setActiveResultIndex(0);
    },
    [onClose, results, router]
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
        title="Close search"
        aria-label="Close search"
        className="absolute inset-0 bg-[var(--overlay)]"
        onClick={onClose}
      />
      <div className="relative mx-auto flex max-h-[min(720px,100%)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="border-b border-[var(--border)] p-4">
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
            <div className="px-3 py-10 text-center text-body-small-regular text-[var(--text-muted)]">
              No results for "{query}".
            </div>
          ) : (
            results.map((result, index) => (
              <button
                key={result.href}
                type="button"
                title={`View result: ${result.title}`}
                onClick={() => openResult(index)}
                onMouseEnter={() => setActiveResultIndex(index)}
                className={[
                  'flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-colors',
                  activeResultIndex === index
                    ? 'bg-[var(--accent-soft)]'
                    : 'hover:bg-[var(--surface-muted)]',
                ].join(' ')}
              >
                <div
                  className={[
                    'text-xs uppercase tracking-[0.18em]',
                    activeResultIndex === index
                      ? 'text-[var(--accent)]'
                      : 'text-[var(--text-muted)]',
                  ].join(' ')}
                >
                  {result.category}
                </div>
                <div
                  className={[
                    'text-base font-semibold',
                    activeResultIndex === index
                      ? 'text-[var(--accent-foreground)]'
                      : 'text-[var(--text)]',
                  ].join(' ')}
                >
                  {result.title}
                </div>
                <div
                  className={[
                    'text-sm leading-6',
                    activeResultIndex === index
                      ? 'text-[var(--accent-foreground)]'
                      : 'text-[var(--text-muted)]',
                  ].join(' ')}
                >
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

function appendAdminPath(pathname: string): string {
  if (!pathname || pathname === '/') return '/admin';
  return pathname;
}

function getDefaultAdminProtocol(value: string): 'http:' | 'https:' {
  return /^(localhost|127(?:\.\d+){3})(:\d+)?(?:\/|$)/i.test(value) ? 'http:' : 'https:';
}

// Accept either a proxied `/admin` path or a CMS host/origin and ensure it lands on `/admin`.
function normalizeAdminPanelHref(href?: string): string {
  const value = href?.trim();
  if (!value) return '/admin';

  if (value.startsWith('#')) {
    return value;
  }

  if (value.startsWith('/')) {
    return appendAdminPath(value);
  }

  const isProtocolRelative = value.startsWith('//');
  const hasScheme = /^[a-z][a-z0-9+.-]*:/i.test(value);
  const resolvedValue = hasScheme
    ? value
    : isProtocolRelative
      ? `https:${value}`
      : `${getDefaultAdminProtocol(value)}//${value}`;

  try {
    const url = new URL(resolvedValue);
    url.pathname = appendAdminPath(url.pathname);

    if (isProtocolRelative) {
      return `//${url.host}${url.pathname}${url.search}${url.hash}`;
    }

    return url.toString();
  } catch {
    return value;
  }
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

  const resolvedAdminPanelHref = normalizeAdminPanelHref(admin_panel_href);
  const iconAsset = icon as
    | { _asset?: { url?: string; mime_type?: string }; alt?: string }
    | undefined;
  const iconUrl = buildAssetUrl(iconAsset?._asset?.url, {
    mimeType: iconAsset?._asset?.mime_type,
  });
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
      <nav
        ref={navRef}
        className="border-b border-[var(--border)] bg-[var(--surface)] text-[var(--text)] font-sans select-none"
      >
        <div className="mx-auto flex min-h-14 w-full max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 shrink items-center gap-2">
            <a href="/" className="flex min-w-0 shrink items-center gap-2 no-underline">
              {iconUrl && (
                <Image
                  src={iconUrl}
                  alt={iconAlt}
                  width={18}
                  height={18}
                  className="object-contain"
                />
              )}
              <span className="truncate text-[15px] font-semibold tracking-tight text-[var(--text)]">
                {logo_text}
              </span>
            </a>
            <div className="flex shrink-0 items-center gap-2">
              <LanguageDropdown />
              <FrameworkDropdown />
            </div>
          </div>

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
              href={resolvedAdminPanelHref}
              className="hidden items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 py-1.5 text-body-small-regular font-medium text-[var(--text)] no-underline transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)] sm:inline-flex"
              title={`Open ${admin_panel_label}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]/70" />
              {admin_panel_label}
            </a>
            <ThemeMenu />
          </div>
        </div>

        {nav_links.length > 0 && (
          <div className="border-t border-[var(--border)]">
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
                        'inline-block whitespace-nowrap px-3.5 py-2.5 text-body-small-regular no-underline transition-colors -mb-px',
                        isActive
                          ? 'border-b-2 border-[var(--accent)] font-semibold text-[var(--text)]'
                          : 'border-b-2 border-transparent font-normal text-[var(--text-muted)] hover:text-[var(--text)]',
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
