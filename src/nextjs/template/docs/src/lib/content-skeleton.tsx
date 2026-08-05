/**
 * Skeleton for the docs content column.
 *
 * Shared by the root `loading.tsx` (full-page first load) and the `[...slug]`
 * `loading.tsx` (content-only, while chrome stays mounted across navigations),
 * so the placeholder content area looks identical in both.
 *
 * Must render as a single `<div>` so it lands in the right grid cell: globals.css
 * lays the docs out with `main > nav/aside/div/footer` rules.
 */
export function ContentSkeleton() {
  return (
    <div className="min-w-0 bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto min-w-0 max-w-[48rem] lg:mx-0 lg:pl-4">
        <div className="mb-10 space-y-3">
          <div className="h-3 w-28 rounded-full bg-[var(--surface-strong)]" />
          <div className="h-10 w-72 max-w-full rounded-full bg-[var(--surface-strong)]" />
          <div className="h-4 w-full max-w-2xl rounded-full bg-[var(--surface-muted)]" />
        </div>

        <div className="space-y-8">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4 h-3 w-24 rounded-full bg-[var(--surface-strong)]" />
            <div className="space-y-2">
              <div className="h-5 w-full rounded-full bg-[var(--surface-strong)]" />
              <div className="h-5 w-11/12 rounded-full bg-[var(--surface-muted)]" />
              <div className="h-5 w-10/12 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4 h-3 w-32 rounded-full bg-[var(--surface-strong)]" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-[var(--surface-strong)]" />
              <div className="h-4 w-10/12 rounded-full bg-[var(--surface-muted)]" />
              <div className="h-4 w-11/12 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <div className="mb-4 h-3 w-28 rounded-full bg-[var(--surface-strong)]" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-[var(--surface-strong)]" />
              <div className="h-4 w-9/12 rounded-full bg-[var(--surface-muted)]" />
              <div className="h-4 w-8/12 rounded-full bg-[var(--surface-muted)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
