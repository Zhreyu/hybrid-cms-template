'use client';

import { CheckIcon, ComputerDesktopIcon, MoonIcon, SunIcon } from '@heroicons/react/16/solid';
import {
  type KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { useTheme } from '@/lib/theme-provider';

type Theme = 'light' | 'dark' | 'system';

const themeOptions = [
  { value: 'light', label: 'Light', icon: SunIcon },
  { value: 'dark', label: 'Dark', icon: MoonIcon },
  { value: 'system', label: 'System', icon: ComputerDesktopIcon },
] as const;

function ThemeIcon({ value }: { value: Theme }) {
  const option = themeOptions.find((item) => item.value === value);
  const Icon = option?.icon ?? ComputerDesktopIcon;

  return <Icon className="size-4" />;
}

export function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstItemRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!mounted || !open) return;

    const frame = requestAnimationFrame(() => {
      firstItemRef.current?.focus();
    });

    return () => cancelAnimationFrame(frame);
  }, [mounted, open]);

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

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        title="Toggle theme menu"
        aria-label="Theme"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center cursor-pointer justify-center rounded-md border-none bg-transparent p-1 text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text)]"
      >
        {mounted ? <ThemeIcon value={theme} /> : <span className="size-4" />}
      </button>

      {mounted && open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Theme options"
          onKeyDown={onMenuKeyDown}
          className="absolute right-0 z-50 mt-2 w-36 overflow-hidden rounded-md border border-[var(--border)] bg-[var(--surface)] shadow-lg"
        >
          {themeOptions.map((option, index) => {
            const isSelected = theme === option.value;

            return (
              <button
                key={option.value}
                ref={index === 0 ? firstItemRef : undefined}
                title={`Switch to ${option.label} mode`}
                type="button"
                role="menuitem"
                onClick={() => {
                  setTheme(option.value);
                  setOpen(false);
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2 text-left text-sm text-[var(--text)] outline-none transition-colors hover:bg-[var(--surface-muted)] focus-visible:bg-[var(--accent-soft)] focus-visible:text-[var(--accent-foreground)]"
              >
                <span className="flex items-center gap-2">
                  <ThemeIcon value={option.value} />
                  {option.label}
                </span>

                {isSelected && <CheckIcon className="size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
