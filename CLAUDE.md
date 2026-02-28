# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start dev server on port 3001
npm run build      # Production build
npm run lint       # Run ESLint
```

There are no tests in this project.

To add a new shadcn component:
```bash
npx shadcn add <component>
```

## Architecture

**Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn/ui (new-york, slate) + React Query v5 + react-hook-form + Zod v4

**Backend:** NestJS API on `http://localhost:3000` (configured via `NEXT_PUBLIC_API_BASE_URL`). Auth via JWT cookies — all `apiFetch` calls use `credentials: "include"`.

### Layout hierarchy

```
app/layout.tsx          → QueryProvider (global)
app/(app)/layout.tsx    → AuthProvider + AppShell (authenticated routes)
app/(app)/page.tsx      → Dashboard
app/(app)/[feature]/    → accounts, credit-cards, installments, movements
app/login/              → unauthenticated
```

### Module structure

Each domain lives in `features/<module>/` with:
- `api/` — typed API functions using `apiFetch`
- `hooks/` — React Query hooks (useQuery / useMutation)
- `components/` — UI components for the module
- `schemas/` — Zod schemas for forms

### Key conventions

**Currency:** All amounts are stored in cents on the backend. Frontend displays using `formatCurrency(cents)` from `lib/utils.ts`. When sending to the API: multiply by 100. When receiving: divide by 100 for display only.

**Dates:** Always construct dates as local noon to avoid UTC timezone shift:
```ts
new Date(year, month - 1, day, 12, 0, 0).toISOString()
```
Never use `new Date("YYYY-MM-DD")` — it parses as UTC midnight and can shift the day in UTC-3.

**API pattern:**
```ts
// lib/api.ts
apiFetch<T>(path, options) // throws "UNAUTHORIZED" on 401
```

**React Query pattern:**
- `retry: false`, `refetchOnWindowFocus: false` (set in `lib/query-client.ts`)
- Invalidate relevant query keys in mutation `onSuccess`

**Form pattern:** `useForm` + `zodResolver` + shadcn `FormField/FormControl/FormMessage`

**Zod v4:** Use string literal `"custom"` in `superRefine`, not `z.ZodIssueCode.custom`.

### Auth flow

`AuthProvider` (in `components/auth/AuthProvider.tsx`) bootstraps on mount: calls `/auth/me`, falls back to `/auth/refresh` + `/auth/me`. Exposes `useAuth()` hook with `{ user, loading, logout }`.

### Accounts vs Credit Cards

These are completely separate entities. `CreditCard` has a `bankAccount` FK (BANK type account used to pay the bill). `useBankAccounts` returns only BANK + WALLET active accounts — used in `CreditCardForm` for the bank account selector.

### Dashboard activity

`GET /dashboard/activity?year=&month=` returns unified items (`DashboardActivityItem[]`) that include both regular movements and credit card installments for the period. The `kind` field distinguishes them: `"MOVEMENT"` or `"CREDIT_CARD_INSTALLMENT"`.

### Path alias

`@/` maps to the project root (e.g., `@/lib/api`, `@/features/movements/hooks`).
