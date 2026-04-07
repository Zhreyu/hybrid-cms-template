import { LanguageCard } from '@/components/LanguageCard';
import { buildDocsHref } from '@/lib/docs-href';
import { SUPPORTED_LANGUAGES } from '@/lib/supported-languages';

export default function Home() {
  return (
    <section className="min-h-screen bg-[#0d0d0d] text-[#f3f4f6]">
      <div className="border-b border-[#1f1f1f] bg-[#0d0d0d]">
        <div className="mx-auto flex min-h-14 w-full max-w-[1600px] items-center px-4 py-3 sm:px-6">
          <span className="text-[15px] font-semibold tracking-tight text-[#f3f4f6]">Docs</span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[48rem] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b7280]">
            Documentation
          </p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[#f3f4f6] sm:text-4xl">
            Choose a language
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-[#9ca3af]">
            Start from the language you prefer. Each version opens directly into the same docs entry
            path with language-scoped routing.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SUPPORTED_LANGUAGES.map((language) => (
            <LanguageCard
              key={language.code}
              code={language.code}
              label="Open docs"
              displayName={language.nativeName || language.name}
              subtitle={
                language.nativeName && language.nativeName !== language.name
                  ? language.name
                  : undefined
              }
              href={buildDocsHref({
                language: language.code,
                category: 'headless',
                post: 'quickstart',
              })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
