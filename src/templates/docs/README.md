# Docs Template

This app is the docs-template candidate your lead described: a hostable Next.js docs site built on top of the published `cms-renderer` package.

It is not meant to be published as an npm library like `apps/renderer`. Instead, it is meant to be copied or scaffolded as an application template.

## What makes this a template

- Uses `cms-renderer` for route rendering, proxying, schema generation, and refresh handling.
- Keeps docs-specific UI in local components such as the sidebar, navbar, content area, and markdown renderer.
- Reads configuration from environment variables so a generated app can point at its own CMS project.

## Install

```bash
bun install
```

## Environment

Copy `.env.example` to `.env.local` and set:

```env
NEXT_PUBLIC_BUNNY_CDN_URL="https://cms-profound.b-cdn.net"
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

## Template notes

- The published dependency boundary is `cms-renderer`.
- Docs-specific markdown rendering is implemented locally with `md4w`, so the starter does not depend on unpublished `cms-renderer` internals.
- The homepage language list is local to this app so the template no longer imports directly from monorepo schema sources.
