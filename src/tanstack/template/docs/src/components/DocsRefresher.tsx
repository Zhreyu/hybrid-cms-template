'use client'

import { useRouter } from '@tanstack/react-router'
import { createTRPCClient, httpSubscriptionLink } from '@trpc/client'
import { useEffect } from 'react'
import superjson from 'superjson'
import { cmsConfig } from '@/lib/cms-config'

/**
 * Live content refresh for the docs site (TanStack Router equivalent of Next.js Refresher).
 */
export function DocsRefresher() {
  const router = useRouter()

  useEffect(() => {
    let url = new URL('/api/trpc', cmsConfig.cmsUrl).toString()
    if (cmsConfig.apiKey) {
      const u = new URL(url)
      u.searchParams.set('api_key', cmsConfig.apiKey)
      url = u.toString()
    }

    const client = createTRPCClient<any>({
      links: [
        httpSubscriptionLink({
          url,
          transformer: superjson,
        }),
      ],
    })

    const subscription = client.website.onContentChange.subscribe(
      { websiteId: cmsConfig.websiteId },
      {
        onData: async () => {
          await router.invalidate()
        },
        onError: (err: unknown) => {
          console.error('[DocsRefresher] subscription error:', err)
        },
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  return null
}
