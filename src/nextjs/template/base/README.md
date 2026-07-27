# {{PROJECT_NAME}}

Bootstrapped with [`create-profound-app`](https://github.com/tryprofound/hybrid-cms-template).

## Getting Started

Install dependencies and start the dev server:

```bash
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

CMS-backed routes are rendered through `src/app/[...slug]/page.tsx`. The base template ships with an
empty component registry, so custom CMS block types need to be registered before those routes render
meaningful content.

## Project Structure

```
src/
  app/
    layout.tsx      # Root layout
    page.tsx        # Home page
    [...slug]/      # CMS-backed routes
  components/
    Hello.tsx       # Example component
  generated/
    cms-schemas.ts  # Committed Zod schemas (refresh with generate-schemas)
  lib/
    client.ts       # Typed fetch client
    cms-config.ts   # CMS environment config
```

## Scripts

| Command                | Description                                      |
| ---------------------- | ------------------------------------------------ |
| `bun dev`              | Start development server                         |
| `bun build`            | Production build (no CMS network required)       |
| `bun start`            | Run production server                            |
| `bun lint`             | Lint with ESLint                                 |
| `bun generate-schemas` | Sync Zod schemas from the CMS into `src/generated` |

`src/generated/cms-schemas.ts` is committed so fresh checkouts and Vercel deploys build without calling the CMS. Re-run `bun generate-schemas` (and commit) when content models change.
