# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/scripts run seed` — seed users and demo incidents (idempotent)

## Quality Incident Reporting System (`artifacts/incidents`)

Full-stack incident logging app. Auth uses bcryptjs + express-session backed by `connect-pg-simple` (table `user_sessions`, cookie `qirs.sid`). Roles: admin, supervisor, operator. Routes: `/api/auth/*`, `/api/lookups`, `/api/incidents` (supports filters: search, department, category, severity, status, startDate, endDate, reportedById), `/api/dashboard/summary`. Frontend pages: Login, Register, Dashboard (charts via Recharts), Incidents list (filters + search + date range + CSV export), My Incidents (`/my-incidents`, reuses `IncidentsList` with `mineOnly` prop that injects `reportedById = currentUser.id`), New Incident form, Incident detail (status / root cause editable by admin/supervisor).

UI is fully responsive: `Shell` has a hamburger sheet drawer for mobile (`md:hidden`) and a fixed sidebar (`md:flex`); dashboard and form grids collapse to single column on small screens; tables scroll horizontally inside `overflow-x-auto`.

Demo logins (password `password123`):
- `admin@factory.local`
- `supervisor@factory.local`
- `operator@factory.local`

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
