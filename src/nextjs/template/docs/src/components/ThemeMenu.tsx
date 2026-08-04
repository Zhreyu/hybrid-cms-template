'use client';

import { MoonIcon, SunIcon } from '@heroicons/react/16/solid';
import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme-provider';

export function ThemeMenu() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const nextTheme = mounted && resolvedTheme === 'dark' ? 'light' : 'dark';
  const Icon = mounted && resolvedTheme === 'dark' ? MoonIcon : SunIcon;

  return (
    <button
      type="button"
      title={`Switch to ${nextTheme} mode`}
      aria-label={`Switch to ${nextTheme} mode`}
      onClick={() => setTheme(nextTheme)}
      className={[
        'inline-flex size-7 cursor-pointer items-center justify-center rounded-full',
        'text-[var(--text-muted)] transition-colors duration-150',
        'hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
      ].join(' ')}
    >
      {mounted ? (
        <Icon className="size-4 text-current fill-current" />
      ) : (
        <span className="size-4" />
      )}
    </button>
  );
}
