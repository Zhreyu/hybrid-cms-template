# {{PROJECT_NAME}}

Bootstrapped with [`create-profound-next`](https://github.com/your-org/create-profound-next).

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
  lib/
    client.ts       # Typed fetch client
    cms-config.ts   # CMS environment config
```

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `bun dev`     | Start development server |
| `bun build`   | Production build         |
| `bun start`   | Run production server    |
| `bun lint`    | Lint with ESLint         |
