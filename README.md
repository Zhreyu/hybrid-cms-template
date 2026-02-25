# Hybrid template for the CMS


## Getting Started

Create a Hybrid project by name
```
git clone https://github.com/eng-manager-xyz/hybrid-cms-template.git
cd hybrid-cms-template/

bun run src/index.ts <name-of-project>
cd <name-of-project>
```

## Project Structure

```
src/
  app/
    layout.tsx      # Root layout
    page.tsx        # Home page
  components/
    Hello.tsx       # Example component
  lib/
    client.ts       # Typed fetch client
  middleware.ts     # CMS proxy
scripts/
  generate-schemas.ts   # 
```

## Scripts

Sync schemas: `bun generate-schemas`

| Command       | Description              |
| ------------- | ------------------------ |
| `bun dev`     | Start development server |
| `bun build`   | Production build         |
| `bun start`   | Run production server    |
| `bun lint`    | Lint with ESLint         |