# create-profound-app

Scaffold a **Next.js** or **TanStack Start** app with Profound CMS (`cms-renderer`).

## Usage

```bash
bunx create-profound-app <project-name>
```

**Interactive (TTY):** you will be prompted to choose a **framework** (step 2) and a **template** (step 3).  
**Non-interactive (CI):** defaults to Next.js + Base unless you pass flags (see below).

```bash
bunx create-profound-app <project-name> --framework=next --template=base
bunx create-profound-app <project-name> --framework=tanstack --template=base
bunx create-profound-app <project-name> --framework=tanstack --template=docs
```

Shortcuts (skip the framework step — same CLI entry):

```bash
bunx create-profound-next <project-name>
bunx create-profound-tanstack <project-name>
```

Shortcut detection reads `npm_config_argv` and the full process argv (not only the script basename), so it works when `argv[1]` is `index.ts` on Windows. If the framework prompt still appears, pass `--framework=next|tanstack` or set `PROFOUND_DEFAULT_FRAMEWORK` to `next` or `tanstack` for that run.

```bash
cd <project-name>
bun dev
```

```bash
bunx create-profound-app <project-name> --no-install
```

## Environment variables

Create a `.env` or `.env.local` (see each template’s `.env.example`):

```env
PROFOUND_API_KEY=your_api_key
NEXT_PUBLIC_PROFOUND_WEBSITE_ID=your_website_id
NEXT_PUBLIC_CMS_API_URL=https://cms.dev.tryprofound.com
NEXT_PUBLIC_BUNNY_CDN_URL="https://cms-profound.b-cdn.net"
```

## TanStack templates

- **Base** and **Docs** use `cms-renderer/lib/parametric-route`. That subpath exists in the **CMS monorepo** `apps/renderer` build (package version **0.6.7** there) but is **not** in the latest release on npm yet (**0.6.6**). Templates depend on **`cms-renderer` ^0.6.6** so `bun install` always resolves from the registry.
- **End-to-end testing before you publish 0.6.7:** install dependencies in the app, then link your local renderer over `node_modules/cms-renderer`:
  1. In the CMS repo: `cd apps/renderer && bun install && bun run build && bun link`
  2. In the scaffolded app: `bun link cms-renderer` (after `bun install` in that app)
- After **cms-renderer@0.6.7** is on npm, a normal `bun install` is enough; you can drop the link.
- The full **TanStack + Profound** walkthrough will live on the **Profound CMS** docs site when that page is published.

## Commands (generated app)

| Command                 | Description                        |
| ----------------------- | ---------------------------------- |
| `bun dev`               | Start development server           |
| `bun build`             | Production build                   |
| `bun generate-schemas`  | Sync Zod schemas from the CMS    |

### generate-schemas

```bash
bun generate-schemas
```

Requires `NEXT_PUBLIC_CMS_API_URL` and `NEXT_PUBLIC_PROFOUND_WEBSITE_ID`. Re-run when you change content models in the CMS.
