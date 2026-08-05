'use client';

import { ChevronDownIcon } from '@heroicons/react/16/solid';
import { usePathname, useRouter } from 'next/navigation';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_LANGUAGE_CODE,
  DOCS_LANGUAGE_COOKIE_KEY,
  DOCS_LANGUAGE_STORAGE_KEY,
  getLanguageByCode,
  isSupportedLanguageCode,
  SUPPORTED_LANGUAGES,
} from '@/lib/supported-languages';

function setLanguageCookie(languageCode: string) {
  if (typeof document === 'undefined') return;

  const maxAge = 60 * 60 * 24 * 180;

  // biome-ignore lint/suspicious/noDocumentCookie: server-readable selection for root redirect
  document.cookie = `${DOCS_LANGUAGE_COOKIE_KEY}=${encodeURIComponent(
    languageCode
  )}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

function getLanguageFromPathname(pathname: string): string {
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (firstSegment && isSupportedLanguageCode(firstSegment)) {
    return firstSegment;
  }

  return DEFAULT_LANGUAGE_CODE;
}

function buildPathWithLanguage(pathname: string, languageCode: string): string {
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length > 0 && isSupportedLanguageCode(segments[0])) {
    segments[0] = languageCode;
  } else {
    segments.unshift(languageCode);
  }

  return `/${segments.join('/')}`;
}

export function LanguageDropdown({
  showLanguageDropdown = false,
}: {
  showLanguageDropdown?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuId = useId();

  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  const selectedCode = useMemo(() => getLanguageFromPathname(pathname), [pathname]);

  const current = getLanguageByCode(selectedCode) ??
    getLanguageByCode(DEFAULT_LANGUAGE_CODE) ??
    SUPPORTED_LANGUAGES[0] ?? {
      code: DEFAULT_LANGUAGE_CODE,
      name: 'English',
      nativeName: 'English',
      flag: '🇺🇸',
    };

  const displayLabel = current.nativeName || current.name;

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

  const selectLanguage = useCallback(
    (code: string) => {
      try {
        window.localStorage.setItem(DOCS_LANGUAGE_STORAGE_KEY, code);
      } catch {
        // ignore quota / private mode
      }

      setLanguageCookie(code);
      setOpen(false);

      if (pathname === '/') {
        router.push('/');
        return;
      }

      const nextPath = buildPathWithLanguage(pathname, code);
      const search = typeof window !== 'undefined' ? window.location.search : '';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';

      router.push(`${nextPath}${search}${hash}`);
    },
    [pathname, router]
  );

  if (!showLanguageDropdown) return null;

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
        className={[
          'inline-flex cursor-pointer items-center gap-2 rounded-full',
          'px-3 py-1.5 text-sm font-medium',
          'text-[var(--text)] transition-colors',
          'hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        ].join(' ')}
      >
        <span aria-hidden="true" className="text-sm leading-none">
          {current.flag}
        </span>

        <span className="max-w-[7rem] truncate sm:max-w-none">{displayLabel}</span>

        <ChevronDownIcon
          aria-hidden={true}
          className={[
            'size-3.5 shrink-0 text-[var(--text-muted)] transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open ? (
        <div
          id={`${menuId}-menu`}
          role="menu"
          aria-labelledby={`${menuId}-trigger`}
          onKeyDown={onMenuKeyDown}
          className={[
            'absolute right-0 z-[100] min-w-[11.75rem]',
            'bottom-full mb-2',
            'sm:translate-x-6',
            'max-h-[22rem] overflow-y-auto',
            'rounded-2xl border border-[var(--border)] bg-[var(--surface)]',
            'p-1.5 shadow-2xl shadow-black/40',
          ].join(' ')}
        >
          {SUPPORTED_LANGUAGES.map((language, index) => {
            const selected = language.code === selectedCode;

            return (
              <button
                key={language.code}
                ref={index === 0 ? firstItemRef : undefined}
                type="button"
                role="menuitem"
                aria-current={selected ? 'true' : undefined}
                className={[
                  'flex w-full cursor-pointer items-center gap-3 rounded-xl',
                  'px-3 py-2 text-left text-sm outline-none transition-colors',
                  selected
                    ? 'bg-[var(--accent-soft)] text-[var(--accent-foreground)]'
                    : 'text-[var(--text)] hover:bg-[var(--surface-muted)]',
                ].join(' ')}
                onClick={() => selectLanguage(language.code)}
              >
                <span aria-hidden="true" className="w-5 shrink-0 text-base leading-none">
                  {language.flag}
                </span>

                <span className="truncate font-medium">{language.nativeName || language.name}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
