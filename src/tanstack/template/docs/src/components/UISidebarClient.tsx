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
      className="flex w-full items-center justify-between rounded-md border border-[#1f1f1f] bg-[#121212] px-4 py-3 text-sm font-medium text-[#f3f4f6]"
      aria-label="Open docs navigation"
    >
      <span className="flex items-center gap-3">
        <Bars3Icon aria-hidden={true} className="size-4 text-[#9ca3af]" />
        <span>Docs</span>
      </span>
      <ChevronRightIcon aria-hidden={true} className="size-4 text-[#6b7280]" />
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
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-[#9ca3af]">
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
                  ? 'bg-[#1a2e1a] text-[#4ade80] font-medium'
                  : 'text-[#d1d5db] hover:text-white hover:bg-[#1a1a1a]',
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
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
      />
      <div className="relative ml-auto flex h-full w-full max-w-sm flex-col border-l border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="flex items-center justify-between border-b border-[#1f1f1f] px-4 py-4">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-[#9ca3af]">
            Docs
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-2 text-[#9ca3af] transition-colors hover:bg-[#161616] hover:text-white"
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
