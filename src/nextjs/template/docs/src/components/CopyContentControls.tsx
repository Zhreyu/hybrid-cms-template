'use client';

import {
  ChevronDownIcon,
  ClipboardDocumentIcon,
  CodeBracketIcon,
  DocumentTextIcon,
} from '@heroicons/react/16/solid';
import { useEffect, useRef, useState } from 'react';

type CopyState = 'idle' | 'copying' | 'copied' | 'error';

interface CopyContentControlsProps {
  markdown: string;
  contentElementId: string;
  contentSelector?: string;
}

export function CopyContentControls({
  markdown,
  contentElementId,
  contentSelector,
}: Readonly<CopyContentControlsProps>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [state, setState] = useState<CopyState>('idle');
  const containerRef = useRef<HTMLDivElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current != null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const scheduleReset = () => {
    if (resetTimerRef.current != null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setState('idle');
      resetTimerRef.current = null;
    }, 1600);
  };

  const copyMarkdown = async () => {
    try {
      setState('copying');
      await navigator.clipboard.writeText(markdown);
      setState('copied');
      scheduleReset();
    } catch {
      setState('error');
      scheduleReset();
    }
  };

  const copyRawText = async () => {
    try {
      const contentNodes = contentSelector
        ? Array.from(document.querySelectorAll<HTMLElement>(contentSelector))
        : [];
      const rawText = (
        contentNodes.length > 0
          ? contentNodes
              .map((node) => node.innerText || node.textContent || '')
              .join('\n\n')
              .trim()
          : (
              document.getElementById(contentElementId)?.innerText ??
              document.getElementById(contentElementId)?.textContent ??
              ''
            ).trim()
      ).trim();
      if (!rawText) {
        setState('error');
        scheduleReset();
        return;
      }
      setState('copying');
      await navigator.clipboard.writeText(rawText);
      setState('copied');
      scheduleReset();
    } catch {
      setState('error');
      scheduleReset();
    }
  };

  const copyByMode = async (copyMode: 'markdown' | 'raw') => {
    setMenuOpen(false);
    if (copyMode === 'markdown') {
      await copyMarkdown();
      return;
    }
    await copyRawText();
  };

  const feedbackText = state === 'copied' ? 'Copied' : state === 'error' ? 'Copy failed' : null;
  const feedbackClass = state === 'copied' ? 'text-[var(--accent)]' : 'text-[var(--danger)]';
  const showFeedback = feedbackText != null;
  const copyOptions = [
    {
      key: 'markdown',
      label: 'Markdown',
      description: 'Includes headings, links, and code blocks',
      Icon: CodeBracketIcon,
      onSelect: () => copyByMode('markdown'),
    },
    {
      key: 'raw',
      label: 'Plain Text',
      description: 'Copies readable text without Markdown syntax',
      Icon: DocumentTextIcon,
      onSelect: () => copyByMode('raw'),
    },
  ] as const;

  return (
    <div className="flex items-center">
      <div ref={containerRef} className="relative inline-flex flex-col items-start gap-1.5">
        <span
          className={[
            'pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--surface)]/95 px-2 py-1 text-xs transition-all duration-200 ease-in-out sm:left-full sm:right-auto sm:top-1/2 sm:ml-2 sm:mt-0',
            showFeedback
              ? `translate-y-0 opacity-100 sm:-translate-y-1/2 ${feedbackClass}`
              : '-translate-y-1 opacity-0 sm:-translate-y-1/2 sm:translate-x-1',
          ].join(' ')}
        >
          {feedbackText ?? ''}
        </span>

        <div className="inline-flex overflow-hidden rounded-md border-[0.5] border-[var(--accent)] bg-[var(--accent-soft)] text-xs text-[var(--accent-foreground)] transition-colors hover:opacity-90">
          <button
            type="button"
            title="Copy page content to clipboard"
            onClick={() => {
              setMenuOpen(false);
              void copyMarkdown();
            }}
            className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 transition-colors hover:text-[var(--accent)]"
          >
            <ClipboardDocumentIcon className="size-3.5" aria-hidden="true" />
            <span>{state === 'copying' ? 'Copying...' : 'Copy page'}</span>
          </button>
          <button
            type="button"
            title="More copy options"
            onClick={() => setMenuOpen((open) => !open)}
            className="inline-flex cursor-pointer items-center border-l-[0.5] border-[var(--accent)] px-2 transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--accent)]"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="Open copy options"
          >
            <ChevronDownIcon
              className={`size-3.5 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>

        {menuOpen ? (
          <div
            className="
              absolute top-full right-0 z-20 mt-1 w-[min(18rem,calc(100vw-2rem))]
              overflow-hidden rounded-lg border border-[var(--border)]
              bg-[var(--surface)] p-1.5 shadow-lg sm:left-0 sm:right-auto sm:w-[18rem]"
            style={{ boxShadow: '0 18px 40px var(--shadow-color)' }}
            role="menu"
            aria-label="Copy options"
          >
            {copyOptions.map(({ key, label, description, Icon, onSelect }) => (
              <button
                key={key}
                title={description}
                type="button"
                onClick={() => {
                  void onSelect();
                }}
                className="flex w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-[var(--surface-muted)]"
                role="menuitem"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--accent)]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-medium text-[var(--text)]">{label}</span>
                  <span className="mt-0.5 block text-xs leading-4 text-[var(--text-muted)]">
                    {description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
