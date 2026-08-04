'use client';

import { CheckIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export function CopyCodeButton({ code }: Readonly<{ code: string }>) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  };

  const Icon = copied ? CheckIcon : ClipboardDocumentIcon;

  return (
    <button
      type="button"
      onClick={copyCode}
      className="
        absolute right-3 top-3 cursor-pointer inline-flex size-7
        items-center justify-center rounded-md bg-transparent
        text-[var(--text-soft)] transition hover:text-[var(--text-muted)]
      "
      aria-label={copied ? 'Copied' : 'Copy code'}
      title={copied ? 'Copied' : 'Copy code'}
    >
      <Icon className="size-5" aria-hidden="true" />
    </button>
  );
}
