'use client';

import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from '@heroicons/react/16/solid';
import * as HeroiconsOutline from '@heroicons/react/24/outline';
import { DocumentTextIcon, ServerStackIcon } from '@heroicons/react/24/outline';
import * as HeroiconsSolid from '@heroicons/react/24/solid';
import type { ElementType, SVGProps } from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/lib/theme-provider';
import { parseHeroiconValue, toHeroiconExportName } from '@/lib/util';
import { BrandLogo, type BrandLogoData, resolveBrandLogo } from './BrandLogo';

interface SidebarLink {
  label: string;
  href: string;
  active?: boolean;
  apiIcon?: string;
  icon?: string;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
  groups?: SidebarGroup[];
  items?: SidebarSectionItem[];
}

interface SidebarGroup {
  title: string;
  defaultOpen?: boolean;
  links: SidebarLink[];
}

type SidebarSectionItem =
  | {
      type: 'link';
      item: SidebarLink;
    }
  | {
      type: 'group';
      group: SidebarGroup;
    };

interface TopSectionOption {
  label: string;
  href: string;
  active?: boolean;
}

type SidebarIcon = ElementType<SVGProps<SVGSVGElement>>;

function resolveSidebarIcon(value: string | undefined): SidebarIcon | null {
  if (!value) return null;

  const { style, name } = parseHeroiconValue(value);
  const iconSet = style === 'solid' ? HeroiconsSolid : HeroiconsOutline;
  const icon = (iconSet as Record<string, unknown>)[toHeroiconExportName(name)];
  return typeof icon === 'function' || (typeof icon === 'object' && icon !== null)
    ? (icon as SidebarIcon)
    : null;
}

function getApiBadgeClassName(apiIcon: string): string {
  switch (apiIcon) {
    case 'get':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300';
    case 'post':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300';
    case 'options':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
    case 'patch':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300';
    default:
      return 'bg-[var(--surface-strong)] text-[var(--text-muted)]';
  }
}

function ApiMethodBadge({ apiIcon }: { apiIcon: string }) {
  return (
    <span
      className={[
        'inline-flex h-4 min-w-7 shrink-0 items-center justify-center rounded px-1.5 text-[9px] font-bold uppercase leading-none',
        getApiBadgeClassName(apiIcon),
      ].join(' ')}
    >
      {apiIcon}
    </span>
  );
}

function MobileDrawerThemeSwitch() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTheme = mounted ? resolvedTheme : 'light';

  return (
    <div className="inline-flex h-9 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={[
          'inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors',
          activeTheme === 'light'
            ? 'bg-[var(--surface-muted)] text-[var(--text)]'
            : 'hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
        ].join(' ')}
        aria-label="Switch to light mode"
        title="Switch to light mode"
      >
        <SunIcon aria-hidden={true} className="size-4" />
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={[
          'inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] transition-colors',
          activeTheme === 'dark'
            ? 'bg-[var(--surface-muted)] text-[var(--text)]'
            : 'hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
        ].join(' ')}
        aria-label="Switch to dark mode"
        title="Switch to dark mode"
      >
        <MoonIcon aria-hidden={true} className="size-4" />
      </button>
    </div>
  );
}

function MobileSidebarButton({
  activeSection,
  activeLink,
  onClick,
}: {
  activeSection?: string;
  activeLink?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-14 w-full items-center gap-3 px-5 text-sm text-[var(--text)]"
      aria-label="Open docs navigation"
      title="Open docs navigation"
    >
      <Bars3Icon aria-hidden={true} className="size-5 shrink-0 text-[var(--text-muted)]" />
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[var(--text-soft)]">{activeSection ?? 'Docs'}</span>
        {activeLink ? (
          <>
            <ChevronRightIcon
              aria-hidden={true}
              className="size-3.5 shrink-0 text-[var(--text-soft)]"
            />
            <span className="truncate font-semibold text-[var(--text)]">{activeLink}</span>
          </>
        ) : null}
      </span>
    </button>
  );
}

function SidebarSectionList({
  sections,
  linkPaddingClassName,
  onLinkClick,
}: {
  sections: SidebarSection[];
  linkPaddingClassName: string;
  onLinkClick?: () => void;
}) {
  return (
    <>
      {sections.map((section) => {
        const items = section.items ?? [
          ...(section.groups ?? []).map((group) => ({ type: 'group', group }) as const),
          ...section.links.map((item) => ({ type: 'link', item }) as const),
        ];

        return (
          <div key={section.title} className="mb-7">
            <p className="mb-2 px-3 text-sm font-semibold text-[var(--text)]">{section.title}</p>
            {items.map((entry) =>
              entry.type === 'group' ? (
                <SidebarSectionGroup
                  key={`group-${entry.group.title}`}
                  group={entry.group}
                  linkPaddingClassName={linkPaddingClassName}
                  onLinkClick={onLinkClick}
                />
              ) : (
                <SidebarSectionLink
                  key={`link-${entry.item.href}`}
                  item={entry.item}
                  linkPaddingClassName={linkPaddingClassName}
                  onClick={onLinkClick}
                />
              )
            )}
          </div>
        );
      })}
    </>
  );
}

function SidebarSectionGroup({
  group,
  linkPaddingClassName,
  onLinkClick,
}: {
  group: SidebarGroup;
  linkPaddingClassName: string;
  onLinkClick?: () => void;
}) {
  const hasActiveLink = group.links.some((link) => link.active);
  const [isOpen, setIsOpen] = useState(group.defaultOpen === true || hasActiveLink);

  useEffect(() => {
    if (hasActiveLink) {
      setIsOpen(true);
    }
  }, [hasActiveLink]);

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-8 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-sm text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
        aria-expanded={isOpen}
      >
        <span className="min-w-0 truncate">{group.title}</span>
        <ChevronRightIcon
          aria-hidden={true}
          className={[
            'size-3.5 shrink-0 text-[var(--text-soft)] transition-transform',
            isOpen ? 'rotate-90' : '',
          ].join(' ')}
        />
      </button>

      {isOpen ? (
        <div className="mt-1 pl-3">
          {group.links.map((item) => (
            <SidebarSectionLink
              key={item.href}
              item={item}
              linkPaddingClassName={linkPaddingClassName}
              onClick={onLinkClick}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SidebarSectionLink({
  item,
  linkPaddingClassName,
  onClick,
}: {
  item: SidebarLink;
  linkPaddingClassName: string;
  onClick?: () => void;
}) {
  const shouldRenderCustomIcon = item.apiIcon === 'custom' || !item.apiIcon;
  const Icon = shouldRenderCustomIcon ? resolveSidebarIcon(item.icon) : null;
  const apiBadge = item.apiIcon && item.apiIcon !== 'custom' ? item.apiIcon : null;
  const showCustomBadge = item.apiIcon === 'custom' && !Icon;

  return (
    <a
      href={item.href}
      onClick={onClick}
      className={[
        'flex items-center gap-3 rounded-lg px-3 text-sm no-underline transition-colors',
        linkPaddingClassName,
        item.active
          ? 'bg-[var(--accent-soft)] font-medium text-[var(--text)]'
          : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
      ].join(' ')}
    >
      {apiBadge ? <ApiMethodBadge apiIcon={apiBadge} /> : null}
      {Icon ? (
        <Icon aria-hidden={true} className="size-5 shrink-0 text-[var(--text-soft)]" />
      ) : null}
      {showCustomBadge ? <ApiMethodBadge apiIcon="custom" /> : null}
      <span className="min-w-0 truncate">{item.label}</span>
    </a>
  );
}

function MobileSidebarDrawer({
  sections,
  topSectionOptions,
  open,
  onClose,
}: {
  sections: SidebarSection[];
  topSectionOptions: TopSectionOption[];
  open: boolean;
  onClose: () => void;
}) {
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const [brandLogo, setBrandLogo] = useState<BrandLogoData>(() => resolveBrandLogo({}));
  const activeTopSection = topSectionOptions.find((option) => option.active);
  const sectionMenuLabel =
    activeTopSection?.label ?? topSectionOptions[0]?.label ?? 'Documentation';

  useEffect(() => {
    setBrandLogo(window.__docsBrandLogo ?? resolveBrandLogo({}));

    const onBrandLogoChange = (event: Event) => {
      const customEvent = event as CustomEvent<BrandLogoData>;
      setBrandLogo(customEvent.detail);
    };

    window.addEventListener('docs-brand-logo-change', onBrandLogoChange);
    return () => window.removeEventListener('docs-brand-logo-change', onBrandLogoChange);
  }, []);

  useEffect(() => {
    if (!open) return;

    setIsSectionMenuOpen(false);

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

  const drawer = (
    <div className="fixed inset-0 z-[90] backdrop-blur-sm lg:hidden">
      <button
        type="button"
        aria-label="Close docs navigation"
        className="absolute inset-0 bg-[var(--overlay)]"
        onClick={onClose}
      />
      <div className="relative mr-auto flex h-dvh w-[86vw] max-w-[342px] flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute left-full top-4 ml-3 inline-flex size-8 cursor-pointer items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-muted)] shadow-sm transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
          aria-label="Close docs navigation"
          title="Close docs navigation"
        >
          <XMarkIcon aria-hidden={true} className="size-5" />
        </button>
        <div className="flex min-h-16 items-center justify-between border-b border-[var(--border)] px-5">
          <BrandLogo brand={brandLogo} />

          <MobileDrawerThemeSwitch />
        </div>

        <div className="border-b border-[var(--border)] px-4 py-4">
          <button
            type="button"
            onClick={() => setIsSectionMenuOpen((isOpen) => !isOpen)}
            className="flex h-10 w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 text-left text-sm text-[var(--text)] transition-colors hover:bg-[var(--surface-muted)]"
            aria-label="Choose documentation section"
            aria-expanded={isSectionMenuOpen}
          >
            <span>{sectionMenuLabel}</span>
            <ChevronDownIcon
              aria-hidden={true}
              className={[
                'size-4 text-[var(--text-soft)] transition-transform',
                isSectionMenuOpen ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {isSectionMenuOpen && topSectionOptions.length > 0 ? (
            <div className="mt-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl shadow-black/5">
              {topSectionOptions.map((option) => (
                <a
                  key={option.href}
                  href={option.href}
                  onClick={onClose}
                  className={[
                    'flex min-h-9 items-center justify-between rounded-lg px-3 text-sm no-underline transition-colors',
                    option.active
                      ? 'font-medium text-[var(--text)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
                  ].join(' ')}
                >
                  <span>{option.label}</span>
                  {option.active ? (
                    <CheckIcon aria-hidden={true} className="size-4 text-[var(--text-muted)]" />
                  ) : null}
                </a>
              ))}
            </div>
          ) : null}

          <div className="mt-5 space-y-2">
            <a
              href="https://status.tryprofound.com"
              className="flex min-h-8 items-center gap-3 rounded-lg px-3 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            >
              <ServerStackIcon className="size-4 text-[var(--text-soft)]" aria-hidden={true} />
              Status
            </a>
            <a
              href="https://www.tryprofound.com/blog"
              className="flex min-h-8 items-center gap-3 rounded-lg px-3 text-sm text-[var(--text-muted)] no-underline transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            >
              <DocumentTextIcon className="size-4 text-[var(--text-soft)]" aria-hidden={true} />
              Blog
            </a>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <SidebarSectionList
            sections={sections}
            linkPaddingClassName="py-2"
            onLinkClick={onClose}
          />
        </div>
        <div className="mt-auto h-3 border-t border-[var(--border)]" />
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
}

export default function UISidebarClient({
  sections,
  topSectionOptions,
}: {
  sections: SidebarSection[];
  topSectionOptions: TopSectionOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCategorySection = sections.find(
    (section) =>
      section.links.some((link) => link.active) ||
      section.groups?.some((group) => group.links.some((link) => link.active)) ||
      section.items?.some((entry) =>
        entry.type === 'link' ? entry.item.active : entry.group.links.some((link) => link.active)
      )
  );
  const activeLink =
    activeCategorySection?.links.find((link) => link.active) ??
    activeCategorySection?.groups?.flatMap((group) => group.links).find((link) => link.active) ??
    activeCategorySection?.items
      ?.flatMap((entry) => (entry.type === 'link' ? [entry.item] : entry.group.links))
      .find((link) => link.active);

  return (
    <>
      <div className="lg:hidden">
        <MobileSidebarButton
          activeSection={activeCategorySection?.title}
          activeLink={activeLink?.label}
          onClick={() => setIsOpen(true)}
        />
      </div>

      <div className="hidden px-2 py-6 lg:block">
        <SidebarSectionList sections={sections} linkPaddingClassName="py-2" />
      </div>

      <MobileSidebarDrawer
        sections={sections}
        topSectionOptions={topSectionOptions}
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
