'use client';

import { Bars3Icon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/16/solid';
import { useEffect, useState } from 'react';

interface SidebarLink {
  label: string;
  href: string;
  active?: boolean;
}

interface SidebarSection {
  title: string;
  links: SidebarLink[];
}

function MobileSidebarButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm font-medium text-[var(--text)]"
      aria-label="Open docs navigation"
      title="Open docs navigation"
    >
      <span className="flex items-center gap-3">
        <Bars3Icon aria-hidden={true} className="size-4 text-[var(--text-muted)]" />
        <span>Docs</span>
      </span>
      <ChevronRightIcon aria-hidden={true} className="size-4 text-[var(--text-muted)]" />
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
      {sections.map((section) => (
        <div key={section.title} className="mb-6">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {section.title}
          </p>
          {section.links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={[
                'flex items-center justify-between rounded-md px-2 text-sm no-underline transition-colors',
                linkPaddingClassName,
                item.active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-medium'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--text)]',
              ].join(' ')}
            >
              <span>{item.label}</span>
            </a>
          ))}
        </div>
      ))}
    </>
  );
}

function MobileSidebarDrawer({
  sections,
  open,
  onClose,
}: {
  sections: SidebarSection[];
  open: boolean;
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
    <div className="fixed inset-0 z-[75] lg:hidden">
      <button
        type="button"
        aria-label="Close docs navigation"
        className="absolute inset-0 bg-[var(--overlay)]"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-[var(--border)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Docs
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
            aria-label="Close docs navigation"
          >
            <XMarkIcon aria-hidden={true} className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <SidebarSectionList
            sections={sections}
            linkPaddingClassName="py-2"
            onLinkClick={onClose}
          />
        </div>
      </div>
    </div>
  );
}

export default function UISidebarClient({ sections }: { sections: SidebarSection[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="px-4 py-4 lg:hidden">
        <MobileSidebarButton onClick={() => setIsOpen(true)} />
      </div>

      <div className="hidden px-4 py-6 lg:block">
        <SidebarSectionList sections={sections} linkPaddingClassName="py-1.5" />
      </div>

      <MobileSidebarDrawer sections={sections} open={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
