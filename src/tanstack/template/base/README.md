# {{PROJECT_NAME}}

Bootstrapped with [`create-profound-app`](https://github.com/tryprofound/hybrid-cms-template) (TanStack Start + Profound CMS).

## Setup

```bash
bun install
cp .env.example .env
# set PROFOUND_API_KEY, NEXT_PUBLIC_PROFOUND_WEBSITE_ID, NEXT_PUBLIC_CMS_API_URL
bun dev
```

## CMS routes

- **Home** — `src/routes/index.tsx` (static marketing shell).
- **Parametric pages** — `src/routes/$.tsx` maps URL paths to Profound via `cms-renderer/lib/parametric-route` (splat / `$` → slug segments). Until **cms-renderer@0.6.7** is on npm, use **`bun link cms-renderer`** to a local `apps/renderer` build (see the create-profound-app README).

Register custom block components in the empty `registry` in `src/routes/$.tsx` as you add schemas in the CMS.

## Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `bun dev`             | Dev server (port 3000)               |
| `bun build`           | Production build                     |
| `bun preview`         | Preview production build             |
| `bun generate-schemas`| Sync Zod schemas from the CMS      |

Full TanStack + Profound guides are published on the Profound CMS docs site (see the hybrid template README for links).
