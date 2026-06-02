import Link from 'next/link';
import { getFrameworkById, isFrameworkId } from '@/lib/supported-frameworks';

type FrameworkComingSoonPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FrameworkComingSoonPage({
  searchParams,
}: FrameworkComingSoonPageProps) {
  const sp = await searchParams;
  const rawParam = sp.framework;
  const frameworkParam =
    typeof rawParam === 'string' ? rawParam : Array.isArray(rawParam) ? rawParam[0] : undefined;

  const raw = frameworkParam?.trim().toLowerCase() ?? '';
  const display =
    raw && isFrameworkId(raw) ? (getFrameworkById(raw)?.label ?? raw) : 'this framework';

  return (
    <section className="min-h-screen bg-[#0d0d0d] px-4 py-16 font-sans text-[#f3f4f6] sm:px-6">
      <div className="mx-auto max-w-lg">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
          Documentation
        </p>
        <h1 className="mb-4 text-2xl font-bold tracking-tight sm:text-3xl">Coming soon</h1>
        <p className="mb-8 text-sm leading-6 text-[#9ca3af]">
          Docs for <span className="font-medium text-[#d1d5db]">{display}</span> are not available
          yet. Next.js is our current framework focus; check back as we add more guides.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-[#2a2a2a] bg-[#141414] px-4 py-2 text-sm font-medium text-[#d1d5db] no-underline transition-colors hover:border-[#294132] hover:bg-[#131814] hover:text-[#86efac]"
        >
          Back to Docs
        </Link>
      </div>
    </section>
  );
}
