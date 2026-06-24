# E-Marketing Task Manager

Next.js 14 (App Router) based task manager with Dashboard, Masters, and FMS Master views.

## Features

- **Dashboard** — Total / Completed / Pending stats, pending tasks list, `+ Add FMS` button
- **Masters** — All checklist tasks (Daily / Weekly / Monthly / One-time)
- **FMS Master** — Step-by-step campaign workflow tracking (8 steps per client). Click any pending status badge to mark it done.

## Tech Stack

- Next.js 14 (App Router, Server Components)
- React 18
- Tailwind CSS
- File-based JSON storage (`database/store.json`) — no database needed

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Run dev server
npm run dev

# 3. Open http://localhost:3000
```

## Production Build

```bash
npm run build
npm run start
```

## Data Storage

All data is stored in `database/store.json` which is auto-created on first run. To reset, just delete the file.

For production with multiple users, replace `backend/lib/store.js` with a real database (Postgres, MongoDB, Supabase, etc.) — the API routes stay the same.

## Customize FMS Steps

Edit the `FMS_STEPS` array in `backend/lib/store.js` to change step names, owners, or add/remove steps.

## Folder Structure

The code is organised into three top-level layers — **frontend**, **backend**, **database** —
plus the thin `app/` routing shell that Next.js requires at the project root.

```
Lallubhai-Amichand/
├── frontend/               # ── FRONTEND (all UI) ──
│   ├── components/         #   Sidebar, Topbar, modals, charts, AppShell, Providers
│   ├── DashboardClient.jsx #   Per-page client components ("...Client.jsx")
│   ├── <route>/...Client.jsx
│   └── globals.css         #   Global styles (Tailwind)
│
├── backend/               # ── BACKEND (server / data layer) ──
│   └── lib/                #   db.js, store.js, store-mysql/postgres, auth helpers,
│                          #   google-sheets, access, guards, config  (imported as @/lib/*)
│
├── database/              # ── DATABASE (schema + tooling, tracked on GitHub) ──
│   ├── migration.sql       #   Schema / migrations
│   ├── india_automotive_data.sql
│   ├── scripts/            #   migrate.mjs, gen-sql.mjs, seed.ts, test-*.mjs
│   └── store.json          #   Local JSON store (auto-generated, gitignored)
│
├── app/                   # ── Next.js routing shell (required at root) ──
│   ├── page.jsx, <route>/page.jsx   # Server components → read backend/, render frontend/
│   ├── api/.../route.js             # API route handlers → call backend/lib
│   └── layout.jsx
│
├── middleware.js, next.config.mjs, tailwind.config.js, jsconfig.json, package.json
```

> **Note:** Next.js' App Router requires the `app/` directory at the project root, so the
> route/API entry points live there. They are thin — all UI lives in `frontend/`, all server
> logic in `backend/lib/` (imported via the `@/lib/*` alias), and all SQL in `database/`.
