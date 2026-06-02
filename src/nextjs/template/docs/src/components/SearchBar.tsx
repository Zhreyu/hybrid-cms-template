'use client';

import { MagnifyingGlassIcon } from '@heroicons/react/16/solid';
import { useEffect, useId, useRef } from 'react';

type SearchBarProps = {
  placeholder: string;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onClick?: () => void;
  readOnly?: boolean;
  autoFocus?: boolean;
  showShortcut?: boolean;
};

export function SearchBar({
  placeholder,
  className = '',
  value,
  onChange,
  onFocus,
  onClick,
  readOnly = false,
  autoFocus = false,
  showShortcut = true,
}: SearchBarProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
  }, [autoFocus]);

  return (
    <div
      className={[
        'flex h-8 w-full items-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-muted)] px-3 text-sm',
        'transition-colors focus-within:border-[var(--accent)]',
        'md:h-9 md:max-w-[480px]',
        className,
      ].join(' ')}
    >
      <label htmlFor={inputId} className="flex shrink-0 text-[var(--text-muted)]">
        <MagnifyingGlassIcon className="size-3.5 shrink-0" />
      </label>
      <input
        id={inputId}
        ref={inputRef}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        onFocus={() => onFocus?.()}
        onClick={() => onClick?.()}
        className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--text)] outline-none placeholder:text-[var(--text-muted)] md:text-sm"
      />
      {showShortcut ? (
        <kbd className="hidden bg-transparent p-0 text-xs font-sans text-[var(--text-soft)] md:block">
          ⌘K
        </kbd>
      ) : null}
    </div>
  );
}
