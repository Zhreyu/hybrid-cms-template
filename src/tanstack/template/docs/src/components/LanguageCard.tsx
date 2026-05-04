'use client'

import { useState } from 'react'

function LoadingDot() {
  return (
    <span
      aria-hidden="true"
      className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-[#86efac]"
    />
  )
}

export function LanguageCard({
  code,
  label,
  displayName,
  subtitle,
  href,
}: {
  code: string
  label: string
  displayName: string
  subtitle?: string
  href: string
}) {
  const [isPending, setIsPending] = useState(false)

  return (
    <a
      href={href}
      onClick={() => setIsPending(true)}
      aria-busy={isPending}
      className={[
        'group rounded-lg border border-[#1a1a1a] bg-[#101010] px-4 py-4 no-underline transition-colors',
        'hover:border-[#294132] hover:bg-[#131814]',
        isPending ? 'border-[#294132] bg-[#131814]' : '',
      ].join(' ')}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className="inline-flex rounded-md border border-[#1f2937] bg-[#101317] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#9ca3af]">
          {code}
        </span>
        <span className="text-xs text-[#4b5563] transition-colors group-hover:text-[#86efac]">
          {isPending ? (
            <span className="inline-flex items-center gap-2 text-[#86efac]">
              <LoadingDot />
              Opening...
            </span>
          ) : (
            label
          )}
        </span>
      </div>

      <div className="space-y-1">
        <div className="text-lg font-semibold text-[#f3f4f6]">{displayName}</div>
        {subtitle ? <div className="text-sm text-[#9ca3af]">{subtitle}</div> : null}
      </div>
    </a>
  )
}
