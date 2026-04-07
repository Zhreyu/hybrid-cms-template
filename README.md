# create-profound-next

Scaffold a Next.js + Profound CMS starter app.

## Usage

```bash
bunx create-profound-next <project-name>
```

Pick a template during scaffolding, or pass one explicitly:

```bash
bunx create-profound-next <project-name> --template=base
bunx create-profound-next <project-name> --template=docs
```

```bash
cd <project-name>
bun install
```

## Environment Variables

Create a `.env.local` file:

```env
PROFOUND_API_KEY=your_api_key
NEXT_PUBLIC_PROFOUND_WEBSITE_ID=your_website_id
NEXT_PUBLIC_CMS_API_URL=https://cms.dev.tryprofound.com
NEXT_PUBLIC_BUNNY_CDN_URL="https://cms-profound.b-cdn.net"
```

## Commands

| Command                  | Description                        |
| ------------------------ | ---------------------------------- |
| `bun dev`                | Start development server           |
| `bun build`              | Production build                   |
| `bun start`              | Run production server              |
| `bun lint`               | Lint with ESLint                   |
| `bun generate-schemas`   | Sync Zod schemas from the CMS      |

### generate-schemas

Fetches your custom content schemas from Profound CMS and writes them to `generated/cms-schemas.ts`:

```bash
bun generate-schemas
```

Requires `NEXT_PUBLIC_CMS_API_URL` and `NEXT_PUBLIC_PROFOUND_WEBSITE_ID` to be set. Re-run whenever you update your content models in the CMS.
