# Docs template (TanStack Start)

Hostable documentation site on **TanStack Start** + published `cms-renderer`, mirroring the Next.js docs template under `src/nextjs/template/docs`.

## Install

```bash
bun install
```

## Environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_BUNNY_CDN_URL=https://cms-profound.b-cdn.net
NEXT_PUBLIC_CMS_API_URL=https://cms.dev.tryprofound.com
NEXT_PUBLIC_PROFOUND_WEBSITE_ID=your-website-id
PROFOUND_API_KEY=your-api-key
```

## Scripts

```bash
bun run dev
bun run generate-schemas
bun run build
```

## Notes

- **CMS catch-all:** `src/routes/$.tsx` uses `cms-renderer/lib/parametric-route`. On npm, use **`bun link cms-renderer`** to a local `apps/renderer` build until **cms-renderer@0.6.7** is published (see the create-profound-app README).
- **Live refresh:** `DocsRefresher` subscribes to CMS content changes and calls `router.invalidate()` (no Next `revalidatePath`).
- **Search index:** built at request time (no `next/cache`); consider adding your own cache layer for very large sites.
- **Proxy:** the Next template’s `proxy.ts` is not ported; configure your host or Vite dev proxy if you need `/admin` or `/api` passthrough to the CMS origin.
