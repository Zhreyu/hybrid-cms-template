import { createFileRoute, notFound } from '@tanstack/react-router'
import { cache, Suspense } from 'react'
import { renderParametricRoute } from 'cms-renderer/lib/parametric-route'

export const Route = createFileRoute('/$')({
  component: CmsCatchAll,
})

function cmsEnv() {
  return {
    apiKey: process.env.PROFOUND_API_KEY,
    cmsUrl:
      process.env.NEXT_PUBLIC_CMS_API_URL ??
      process.env.VITE_PUBLIC_CMS_API_URL ??
      'https://cms.dev.tryprofound.com',
    websiteId:
      process.env.NEXT_PUBLIC_PROFOUND_WEBSITE_ID ??
      process.env.VITE_PUBLIC_PROFOUND_WEBSITE_ID ??
      '',
  }
}

function stableRouteCacheKey(
  segments: string[],
  searchParams: Record<string, string | string[] | undefined>
): string {
  const env = cmsEnv()
  const searchEntries = Object.entries(searchParams).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify({
    slug: segments,
    search: Object.fromEntries(searchEntries),
    w: env.websiteId,
    c: env.cmsUrl,
  })
}

/** Dedupes parallel `renderParametricRoute` (e.g. React dev Strict Mode / streaming) → one tRPC batch. */
const renderParametricRouteCached = cache(async (key: string) => {
  const { slug, search } = JSON.parse(key) as {
    slug: string[]
    search: Record<string, string | string[] | undefined>
  }
  const env = cmsEnv()
  return renderParametricRoute({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(search),
    apiKey: env.apiKey,
    cmsUrl: env.cmsUrl,
    websiteId: env.websiteId || undefined,
    registry: {},
  })
})

function CmsCatchAll() {
  const { _splat } = Route.useParams()
  const rawSearch = Route.useSearch({ strict: false }) as
    | Record<string, string | string[] | undefined>
    | undefined

  return (
    <Suspense
      fallback={
        <main className="page-wrap px-4 pb-8 pt-14">
          <p className="text-[var(--sea-ink-soft)]">Loading…</p>
        </main>
      }
    >
      <CmsCatchAllBody splat={_splat} searchParams={rawSearch ?? {}} />
    </Suspense>
  )
}

async function CmsCatchAllBody({
  splat,
  searchParams,
}: {
  splat?: string
  searchParams: Record<string, string | string[] | undefined>
}) {
  const segments = splat ? splat.split('/').filter(Boolean) : []
  const result = await renderParametricRouteCached(stableRouteCacheKey(segments, searchParams))

  if (result.status === 'not_found') {
    throw notFound()
  }
  if (result.status === 'error') {
    throw result.error
  }

  return result.node
}
