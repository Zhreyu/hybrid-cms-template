import { createFileRoute, notFound } from '@tanstack/react-router'
import { cache, Suspense } from 'react'
import { renderParametricRoute } from 'cms-renderer/lib/parametric-route'
import type { BlockComponentRegistry } from 'cms-renderer/lib/types'
import NavbarBlock from '@/components/NavbarBlock'
import UIContent from '@/components/UIContent'
import UIFooter from '@/components/UIFooter'
import UISidebar from '@/components/UISidebar'
import { cmsConfig } from '@/lib/cms-config'

export const Route = createFileRoute('/$')({
  component: DocsCatchAll,
})

const registry: Partial<BlockComponentRegistry> = {
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  header: NavbarBlock as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uisidebar: UISidebar as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uicontent: UIContent as any,
  // biome-ignore lint/suspicious/noExplicitAny: block props are CMS-defined at runtime
  uifooter: UIFooter as any,
}

function stableRouteCacheKey(
  slug: string[],
  searchParams: Record<string, string | string[] | undefined>
): string {
  const searchEntries = Object.entries(searchParams).sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify({
    slug,
    search: Object.fromEntries(searchEntries),
    w: cmsConfig.websiteId,
    c: cmsConfig.cmsUrl,
  })
}

/** Dedupes parallel `renderParametricRoute` (e.g. React dev Strict Mode / streaming) → one tRPC batch. */
const renderParametricRouteCached = cache(async (key: string) => {
  const { slug, search } = JSON.parse(key) as {
    slug: string[]
    search: Record<string, string | string[] | undefined>
  }
  return renderParametricRoute({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(search),
    apiKey: cmsConfig.apiKey,
    websiteId: cmsConfig.websiteId || undefined,
    cmsUrl: cmsConfig.cmsUrl,
    registry,
  })
})

function DocsCatchAll() {
  const { _splat } = Route.useParams()
  const rawSearch = Route.useSearch({ strict: false }) as
    | Record<string, string | string[] | undefined>
    | undefined

  const segments = _splat ? _splat.split('/').filter(Boolean) : []

  return (
    <Suspense fallback={null}>
      <DocsCatchAllBody slug={segments} searchParams={rawSearch ?? {}} />
    </Suspense>
  )
}

async function DocsCatchAllBody({
  slug,
  searchParams,
}: {
  slug: string[]
  searchParams: Record<string, string | string[] | undefined>
}) {
  const result = await renderParametricRouteCached(stableRouteCacheKey(slug, searchParams))

  if (result.status === 'not_found') {
    throw notFound()
  }
  if (result.status === 'error') {
    throw result.error
  }

  return result.node
}
