<!-- {{RIPER-10 Action}}
Role: DW | Task_ID: #restore | Time: 2025-12-24T10:01:59+08:00
Principle: Single Source of Truth (SSoT).
Taste: Document only what developers will actually touch.
-->

# Quantum Front

## Quickstart

```bash
bun install
bun run dev
```

## Environment variables

Vite loads env files automatically:

- `.env`
- `.env.development` (dev server default)
- `.env.production` (build default)
- Local overrides: `.env.local`, `.env.development.local`, `.env.production.local` (gitignored)

Variables used by this starter:

- `VITE_APP_TITLE`: page/app title (also used in `index.html`)
- `VITE_APP_DESCRIPTION`: meta description in `index.html`
- `VITE_API_BASE_URL`: client API base URL (recommended: `/api`)
- `VITE_API_PROXY_TARGET`: Vite dev-server proxy target for `/api` (e.g. `http://localhost:8080`)

## Enterprise utilities

- HTTP: `axios` wrapper in `src/utils/request.ts`
- Runtime validation: `zod` schemas in `src/schemas/` (example API in `src/api/user.ts`)
- Date/time: `dayjs` helpers in `src/utils/date.ts`
- Money/precision: `decimal.js` helpers in `src/utils/decimal.ts`
- Query strings: `query-string` helpers in `src/utils/query.ts`
- State persistence: `pinia-plugin-persistedstate` (wired in `src/main.ts`, demo store `src/stores/user.ts`)
- Server cache: `@tanstack/vue-query` (wired in `src/main.ts`)

## Auto imports & components (optional)

Configured in `vite.config.ts`:

- `unplugin-auto-import` → `src/types/auto-imports.d.ts`
- `unplugin-vue-components` → `src/types/components.d.ts`
