'use client';

import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { useRouter } from 'next/navigation';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_FRAMEWORK_ID,
  DOCS_FRAMEWORK_COOKIE_KEY,
  DOCS_FRAMEWORK_STORAGE_KEY,
  type FrameworkId,
  getFrameworkById,
  isFrameworkId,
  SUPPORTED_FRAMEWORKS,
} from '@/lib/supported-frameworks';

function readInitialFrameworkId(): FrameworkId {
  if (typeof window === 'undefined') return DEFAULT_FRAMEWORK_ID;

  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('framework');
  if (fromUrl && isFrameworkId(fromUrl)) {
    const fw = getFrameworkById(fromUrl);
    if (fw?.enabled) return fromUrl;
  }

  const stored = window.localStorage.getItem(DOCS_FRAMEWORK_STORAGE_KEY);
  if (stored && isFrameworkId(stored)) {
    const fw = getFrameworkById(stored);
    if (fw?.enabled) return stored;
  }

  return DEFAULT_FRAMEWORK_ID;
}

function setFrameworkCookie(frameworkId: FrameworkId) {
  if (typeof document === 'undefined') return;
  // 180 days
  const maxAge = 60 * 60 * 24 * 180;
  // biome-ignore lint/suspicious/noDocumentCookie: we need server-readable selection in Next server components
  document.cookie = `${DOCS_FRAMEWORK_COOKIE_KEY}=${encodeURIComponent(
    frameworkId
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function syncFrameworkQueryParam(frameworkId: FrameworkId) {
  if (typeof window === 'undefined') return;

  const url = new URL(window.location.href);
  if (frameworkId === DEFAULT_FRAMEWORK_ID) {
    url.searchParams.delete('framework');
  } else {
    url.searchParams.set('framework', frameworkId);
  }

  const nextSearch = url.searchParams.toString();
  const nextUrl = `${url.pathname}${nextSearch ? `?${nextSearch}` : ''}${url.hash}`;
  window.history.replaceState(null, '', nextUrl);
}

function emitFrameworkChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event('docs-framework-change'));
}

export function FrameworkDropdown() {
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<FrameworkId>(DEFAULT_FRAMEWORK_ID);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setSelectedId(readInitialFrameworkId());
  }, []);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const el = containerRef.current;
      if (!el || !(event.target instanceof Node)) return;
      if (!el.contains(event.target)) setOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const frame = requestAnimationFrame(() => {
      firstItemRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [open]);

  const current = getFrameworkById(selectedId) ??
    SUPPORTED_FRAMEWORKS[0] ?? { id: DEFAULT_FRAMEWORK_ID, label: 'Framework', enabled: true };

  const focusMenuItem = (currentTarget: HTMLDivElement, nextIndex: number) => {
    const items = Array.from(
      currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    );
    items[nextIndex]?.focus();
  };

  const onMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]')
    );
    const currentIndex =
      document.activeElement instanceof HTMLButtonElement
        ? items.indexOf(document.activeElement)
        : -1;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMenuItem(event.currentTarget, currentIndex === items.length - 1 ? 0 : currentIndex + 1);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusMenuItem(event.currentTarget, currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(event.currentTarget, 0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(event.currentTarget, items.length - 1);
    }
  };

  const selectEnabled = useCallback(
    (id: FrameworkId) => {
      setSelectedId(id);
      try {
        window.localStorage.setItem(DOCS_FRAMEWORK_STORAGE_KEY, id);
      } catch {
        // ignore quota / private mode
      }
      setFrameworkCookie(id);
      syncFrameworkQueryParam(id);
      setOpen(false);
      emitFrameworkChange();
      router.refresh();
    },
    [router]
  );

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        id={`${menuId}-trigger`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={`${menuId}-menu`}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 py-1.5 text-body-small-regular font-medium text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]"
      >
        <span className="max-w-[7rem] truncate sm:max-w-none">{current.label}</span>
        <ChevronDownIcon aria-hidden={true} className="size-4 shrink-0 text-[var(--text-muted)]" />
      </button>

      {open ? (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          onKeyDown={onMenuKeyDown}
          className="absolute left-0 z-[70] mt-2 min-w-[11rem] cursor-pointer overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 shadow-xl sm:left-auto sm:right-0"
        >
          {SUPPORTED_FRAMEWORKS.map((fw, index) => (
            <button
              key={fw.id}
              ref={index === 0 ? firstItemRef : undefined}
              type="button"
              role="menuitem"
              className={[
                'flex w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:bg-[var(--accent-soft)] focus-visible:text-[var(--accent-foreground)]',
                fw.id === selectedId
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-foreground)]'
                  : 'text-[var(--text)]',
                fw.enabled
                  ? 'hover:bg-[var(--surface-muted)]'
                  : 'text-[var(--text-soft)] hover:bg-[var(--surface-muted)]',
              ].join(' ')}
              onClick={() => {
                if (fw.enabled) {
                  selectEnabled(fw.id);
                  return;
                }
                setOpen(false);
                router.push(`/framework-coming-soon?framework=${encodeURIComponent(fw.id)}`);
              }}
            >
              <span className="font-medium">{fw.label}</span>
              {!fw.enabled ? (
                <span className="text-[11px] font-normal uppercase tracking-[0.14em] text-[var(--text-soft)]">
                  Coming soon
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
