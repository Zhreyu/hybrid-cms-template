# {{PROJECT_NAME}}

Bootstrapped with [`create-profound-app`](https://github.com/tryprofound/hybrid-cms-template) (TanStack Start + Profound CMS).
This template includes Nitro so it can deploy cleanly to Vercel's TanStack Start runtime.

## Setup

```bash
bun install
cp .env.example .env
# set PROFOUND_API_KEY, NEXT_PUBLIC_PROFOUND_WEBSITE_ID, NEXT_PUBLIC_CMS_API_URL
bun dev
```

## CMS routes

- **Home** — `src/routes/index.tsx` (static marketing shell).
- **Parametric pages** — `src/routes/$.tsx` maps URL paths to Profound via `cms-renderer/lib/parametric-route` (splat / `$` → slug segments).

Register custom block components in the empty `registry` in `src/routes/$.tsx` as you add schemas in the CMS.

## Scripts

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `bun dev`             | Dev server (port 3000)               |
| `bun build`           | Production build via Vite + Nitro    |
| `bun preview`         | Preview production build             |
| `bun generate-schemas`| Sync Zod schemas from the CMS      |

For deeper docs and guides, see the Profound CMS documentation.

## Deploying to Vercel

No extra Vercel config should be required. Import the project in Vercel and use the default build command:

```bash
bun run build
```

Nitro will produce the deployment output Vercel expects for TanStack Start.
