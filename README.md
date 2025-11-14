# Aminid

Modern content platform starter built with Vite + React + TypeScript, Tailwind CSS, and an Express server integrated into the Vite dev workflow. It includes sample pages, cards, modals, Netlify function example, and testing utilities.

## Overview

- Frontend: React 18 (SWC), Tailwind CSS, component library patterns
- Dev server: Vite (port `8080`) with an Express middleware
- Backend (dev): Express mounted on the Vite server via a custom plugin
- Server build: `vite.config.server.ts` produces server artifacts
- Functions: Netlify function example at `netlify/functions/api.ts`
- Testing: Vitest

## Tech Stack

- `React`, `TypeScript`, `@vitejs/plugin-react-swc`
- `Tailwind CSS`, `postcss`
- `Express` (mounted in dev), `serverless-http` example for Netlify
- `Vitest` (unit tests)

## Getting Started

1) Install dependencies

```bash
npm install
# or: pnpm install
```

2) Run the dev server

```bash
npm run dev
# Local: http://localhost:8080/
```

The Express app is automatically mounted as middleware in dev via a custom plugin (`expressPlugin`) defined in `vite.config.ts`.

## Scripts

- `npm run dev` — start Vite dev server (port `8080`)
- `npm run build` — build client and server
- `npm run build:client` — build SPA to `dist/spa`
- `npm run build:server` — build server using `vite.config.server.ts`
- `npm start` — run the built server (`dist/server/node-build.mjs`)
- `npm test` — run unit tests with Vitest
- `npm run format.fix` — format with Prettier
- `npm run typecheck` — TypeScript type checks

## Directory Structure (selected)

```
client/                # React app (components, pages, hooks, styles)
  components/          # UI components (cards, inputs, modals, etc.)
  pages/               # Routed pages (Index, Articles, Authors, Courses, etc.)
  App.tsx, main.tsx    # App bootstrap

server/                # Express server and routes (mounted in dev)
shared/                # Shared utilities across client/server
netlify/functions/     # Serverless function example
public/                # Static assets (favicon, placeholder.svg)
vite.config.ts         # Vite config (dev server + express plugin)
vite.config.server.ts  # Server build config
```

## Path Aliases

- `@` → `./client`
- `@shared` → `./shared`

Usable in TS imports (configured in `tsconfig.json` and `vite.config.ts`). For example:

```ts
import Navbar from "@/components/Navbar";
import { api } from "@shared/api";
```

## Environment Variables

Place env values in `.env`. The Vite dev server denies serving `.env` files directly for safety. Access env values via standard mechanisms (`import.meta.env` on the client; `process.env` on the server/build).

## Testing

```bash
npm test
```

Vitest is configured; add tests under `client/**` or `shared/**` as needed.

## Styling

- Tailwind CSS is set up via `tailwind.config.ts` and `postcss.config.js`.
- Global styles live in `client/global.css`.

## Images and ORB (Opaque Response Blocking)

Some external image CDNs (e.g., Unsplash) can be blocked in sandboxed previews, triggering Chrome’s ORB. To keep the UI stable:

- Use the `SafeImage` component (`client/components/SafeImage.tsx`) which:
  - Sets `crossOrigin="anonymous"` and `referrerPolicy="no-referrer"`
  - Falls back to `/placeholder.svg` if the remote image fails
- Consider hosting critical assets locally in `public/` or proxying images through your backend when required.

## Build & Run (Production)

```bash
npm run build
npm start
```

- Client output: `dist/spa`
- Server output: `dist/server`

## Deployment Notes

- Static hosting (SPA) can serve `dist/spa`. For server routes, deploy the server build or use serverless functions.
- Netlify example function: `netlify/functions/api.ts`. Configure in `netlify.toml` if deploying functions.

## Contributing

1. Fork and clone
2. Create a feature branch
3. Run `npm run dev` and `npm test`
4. Submit a PR

## License

Proprietary or custom — add your preferred license terms here.