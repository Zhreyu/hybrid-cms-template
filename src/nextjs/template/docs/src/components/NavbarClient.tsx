'use client';

import {
  ChevronDownIcon,
  EllipsisVerticalIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import { useRouter } from 'next/navigation';
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import type { Header } from '@/generated/cms-schemas';
import type { SearchEntry } from '@/lib/search-index';
import { buildSnippet, getSearchResults } from '@/lib/search-query';
import { BrandLogo, type BrandLogoData, resolveBrandLogo } from './BrandLogo';
import { SearchBar } from './SearchBar';
import { ThemeMenu } from './ThemeMenu';

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

declare global {
  interface Window {
    __docsBrandLogo?: BrandLogoData;
  }
}

export type NavbarClientBlockProps = Omit<Header, 'nav_links'> & {
  nav_links?: NavLink[];
  [key: string]: unknown;
};

function readTrimmedString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function readHrefValue(value: unknown): string | null {
  const directValue = readTrimmedString(value);
  if (directValue) return directValue;

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  return readTrimmedString(record.href) ?? readTrimmedString(record.url);
}

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
                      ? 'bg-[var(--accent-soft)] font-medium text-[var(--text)]'
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

function MobileActionModal({
  open,
  label,
  href,
  onClose,
}: {
  open: boolean;
  label: string;
  href: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] bg-[var(--overlay)] backdrop-blur-sm md:hidden">
      <button
        type="button"
        aria-label="Close menu"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="absolute right-2 top-2 flex h-19 w-[min(64vw,16rem)] items-center justify-between rounded-md bg-[var(--surface)] px-8 shadow-2xl">
        <a
          href={href}
          className="text-sm text-[var(--text-muted)] no-underline transition-colors hover:text-[var(--text)] tracking-[0.02em]"
        >
          {label}
        </a>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-full text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)]"
          aria-label="Close menu"
          title="Close menu"
        >
          <XMarkIcon aria-hidden={true} className="size-6" />
        </button>
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
  const value = readHrefValue(href);
  if (!value) return '/admin';

  if (value.startsWith('#') || value.startsWith('mailto')) {
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

function capitalizeLabel(value: unknown): string {
  const label = readTrimmedString(value) ?? 'Admin Panel';

  return label
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

const SECTION_LINK_CLASS =
  'inline-flex max-w-40 shrink-0 items-center truncate px-0 py-4 text-sm no-underline transition-colors -mb-px sm:max-w-56';

function getSectionLinkClass(isActive: boolean): string {
  return [
    SECTION_LINK_CLASS,
    isActive
      ? 'border-b border-[var(--text)] font-semibold text-[var(--text)]'
      : 'border-b border-transparent font-normal text-[var(--text-muted)] hover:text-[var(--text)]',
  ].join(' ');
}

function SectionNavigation({
  links,
  activeLink,
  onActiveLinkChange,
}: {
  links: NavLink[];
  activeLink?: string;
  onActiveLinkChange: (label: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(links.length);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);
  const itemRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth;
    if (containerWidth <= 0) return;

    const itemWidths = links.map((_, index) => itemRefs.current[index]?.offsetWidth ?? 0);
    const moreWidth = moreRef.current?.offsetWidth ?? 88;
    const gap = 8;

    let nextVisibleCount = 0;
    let usedWidth = 0;

    for (let index = 0; index < itemWidths.length; index++) {
      const width = itemWidths[index] ?? 0;
      const nextWidth = usedWidth + width + (nextVisibleCount > 0 ? gap : 0);
      const reserveMoreWidth = index < itemWidths.length - 1 ? moreWidth + gap : 0;

      if (nextWidth + reserveMoreWidth > containerWidth) {
        break;
      }

      usedWidth = nextWidth;
      nextVisibleCount += 1;
    }

    setVisibleCount(Math.max(1, nextVisibleCount));
  }, [links]);

  useEffect(() => {
    measure();

    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener('resize', measure);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  useEffect(() => {
    if (!isMoreOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (!menu || !(event.target instanceof Node)) return;
      if (!menu.contains(event.target)) setIsMoreOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isMoreOpen]);

  const activeIndex = links.findIndex((link) => link.label === activeLink);
  const visibleIndexes = new Set(links.slice(0, visibleCount).map((_, index) => index));

  if (activeIndex >= visibleCount && activeIndex >= 0) {
    visibleIndexes.delete(Math.max(0, visibleCount - 1));
    visibleIndexes.add(activeIndex);
  }

  const visibleLinks = links.filter((_, index) => visibleIndexes.has(index));
  const overflowLinks = links.filter((_, index) => !visibleIndexes.has(index));

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="pointer-events-none absolute left-0 top-0 -z-10 flex h-0 gap-2 overflow-hidden opacity-0">
        {links.map((link, index) => (
          <span
            key={link.label}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
            className={getSectionLinkClass(link.label === activeLink)}
          >
            {link.label}
          </span>
        ))}
        <button
          ref={moreRef}
          type="button"
          className="inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-body-small-regular font-medium text-[var(--text-muted)]"
          tabIndex={-1}
          aria-hidden={true}
        >
          More
          <ChevronDownIcon aria-hidden={true} className="size-3.5" />
        </button>
      </div>

      <div className="flex min-w-0 items-end gap-6 overflow-visible">
        {visibleLinks.map((link) => {
          const isActive = activeLink === link.label;
          return (
            <a
              key={link.label}
              href={link.href}
              onClick={() => {
                onActiveLinkChange(link.label);
                setIsMoreOpen(false);
              }}
              className={getSectionLinkClass(isActive)}
              title={link.label}
            >
              {link.label}
            </a>
          );
        })}

        {overflowLinks.length > 0 ? (
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMoreOpen((open) => !open)}
              className={[
                'inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2.5 text-body-small-regular font-medium',
                'border-b-2 border-transparent text-[var(--text-muted)] transition-colors hover:text-[var(--text)]',
              ].join(' ')}
              aria-haspopup="menu"
              aria-expanded={isMoreOpen}
              title="More sections"
            >
              More
              <ChevronDownIcon
                aria-hidden={true}
                className={['size-3.5 transition-transform', isMoreOpen ? 'rotate-180' : ''].join(
                  ' '
                )}
              />
            </button>

            {isMoreOpen ? (
              <div
                role="menu"
                className="absolute right-0 z-[70] mt-2 w-56 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--surface)] p-1 shadow-2xl shadow-black/30"
              >
                {overflowLinks.map((link) => {
                  const isActive = activeLink === link.label;
                  return (
                    <a
                      key={link.label}
                      href={link.href}
                      role="menuitem"
                      onClick={() => {
                        onActiveLinkChange(link.label);
                        setIsMoreOpen(false);
                      }}
                      className={[
                        'block truncate rounded-md px-3 py-2 text-sm no-underline transition-colors',
                        isActive
                          ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent-foreground)]'
                          : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
                      ].join(' ')}
                      title={link.label}
                    >
                      {link.label}
                    </a>
                  );
                })}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function NavbarClient({
  content,
  searchEntries,
}: {
  content: NavbarClientBlockProps;
  searchEntries: SearchEntry[];
}) {
  const {
    admin_panel_label = 'Admin Panel',
    admin_panel_href,
    search_placeholder = 'Search...',
    nav_links = [],
  } = content;

  const resolvedAdminPanelHref = normalizeAdminPanelHref(admin_panel_href);
  const adminPanelLabel = capitalizeLabel(admin_panel_label);
  const brandLogo = useMemo(() => resolveBrandLogo(content), [content]);

  const resolvedActiveLink = useMemo(
    () => nav_links.find((link) => link.active)?.label ?? nav_links[0]?.label,
    [nav_links]
  );
  const [activeLink, setActiveLink] = useState(resolvedActiveLink);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileActionOpen, setIsMobileActionOpen] = useState(false);
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setActiveLink(resolvedActiveLink);
  }, [resolvedActiveLink]);

  useEffect(() => {
    window.__docsBrandLogo = brandLogo;
    window.dispatchEvent(new CustomEvent('docs-brand-logo-change', { detail: brandLogo }));
  }, [brandLogo]);

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
      <nav ref={navRef} className="bg-[var(--surface)] font-sans text-[var(--text)] select-none">
        <div className="mx-auto flex min-h-16 w-full max-w-[1392px] items-center gap-3 px-5 py-3 sm:px-6">
          <div className="flex min-w-0 shrink items-center gap-2">
            <BrandLogo brand={brandLogo} />
          </div>

          <div className="hidden md:flex md:flex-1 md:justify-center">
            <SearchBar
              placeholder={search_placeholder}
              readOnly
              onFocus={() => setIsSearchOpen(true)}
              onClick={() => setIsSearchOpen(true)}
              className="mx-auto max-w-[22rem] sm:max-w-[26rem] md:max-w-[300px] lg:max-w-[300px]"
            />
          </div>

          <div className="ml-auto hidden shrink-0 items-center gap-4 md:flex">
            <a
              href={resolvedAdminPanelHref}
              className={[
                'inline-flex cursor-pointer items-center',
                'text-sm font-medium',
                'text-[var(--text)] transition-colors hover:text-black',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-strong)]',
              ].join(' ')}
              title={`Open ${adminPanelLabel}`}
            >
              {adminPanelLabel}
            </a>
            <div className="hidden sm:block">
              <ThemeMenu />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
              aria-label="Search docs"
              title="Search docs"
            >
              <MagnifyingGlassIcon aria-hidden={true} className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileActionOpen(true)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
              aria-label="Open menu"
              title="Open menu"
            >
              <EllipsisVerticalIcon aria-hidden={true} className="size-5" />
            </button>
          </div>
        </div>

        {nav_links.length > 0 && (
          <div className="hidden border-y-[0.5] border-[var(--border)] md:block">
            <div className="mx-auto w-full max-w-[1392px] px-4 sm:px-6">
              <SectionNavigation
                links={nav_links}
                activeLink={activeLink}
                onActiveLinkChange={setActiveLink}
              />
            </div>
          </div>
        )}
      </nav>

      <SearchModal
        open={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        entries={searchEntries}
      />
      <MobileActionModal
        open={isMobileActionOpen}
        label={adminPanelLabel}
        href={resolvedAdminPanelHref}
        onClose={() => setIsMobileActionOpen(false)}
      />
    </>
  );
}
