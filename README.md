# AtomGoal — Goal Setting & Tracking Portal

Production-grade **Organizational Performance Operating System** for Atomberg Hackathon (**AtomQuest 1.0**). Strategic alignment, workforce intelligence, operational visibility, and proactive governance — built for enterprise leaders.

**Full specification:** [`../SOLUTION.md`](../SOLUTION.md) · **Architecture:** [`ARCHITECTURE.md`](ARCHITECTURE.md) · **In-app architecture:** `/admin/architecture` · **Phase checklist:** [`PHASES.md`](PHASES.md)

### Judge demo (5–7 minutes)

| Step | Action | Highlight |
|------|--------|-----------|
| 1 | Login → click **Employee** demo card | One-click role access |
| 2 | Create/submit goals | Validation + workflow |
| 3 | **Demo bar** → switch to **Manager** | Instant role switch |
| 4 | Approve pending goals | Live manager dashboard |
| 5 | Switch to **Executive** | Organization Health KPIs + live ticker |
| 6 | Start **Feature tour** | Guided spotlights (risk, alignment, audit) |
| 7 | `/admin/escalations` | Escalation intelligence |
| 8 | Export **Board Report (PDF)** | Executive report pack |

**Demo mode:** Set `NEXT_PUBLIC_DEMO_MODE=true` (auto-enabled in development). Password for all accounts: `password123`.

**Health check:** `GET /api/health` · **Docker:** `docker build -t atomgoal .`

---

## Table of contents

1. [Quick start](#quick-start)
2. [Demo accounts](#demo-accounts)
3. [Phase 0 — Project setup](#phase-0--project-setup)
4. [Phase 1 — Goals & approval](#phase-1--goals--approval)
5. [Phase 2 — Check-ins & achievements](#phase-2--check-ins--achievements)
6. [Phase 3 — Admin & reports](#phase-3--admin--reports)
7. [Phase 4 — Notifications & cron](#phase-4--notifications--cron)
8. [Phase 5 — Bonus features](#phase-5--bonus-features)
9. [Phase 6 — Polish & quality](#phase-6--polish--quality)
10. [Testing (§16)](#testing-16)
11. [Deployment (§17)](#deployment-17)
12. [API reference](#api-reference)
13. [Routes & navigation](#routes--navigation)
14. [Business rules](#business-rules)
15. [Environment variables](#environment-variables)
16. [Scripts](#scripts)
17. [Production readiness notes](#production-readiness-notes)

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **Docker** (for local Postgres) or a hosted Postgres URL (Supabase / Neon)
- **npm** (project uses npm; SOLUTION spec mentions pnpm — commands below use npm)

### Local setup (≈5 minutes)

```bash
cd atomquest-portal
cp .env.example .env.local
```

Edit `.env.local` — minimum required:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/atomquest?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/atomquest?schema=public"
AUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_SECRET="$AUTH_SECRET"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="$(openssl rand -base64 32)"
```

Start database and app:

```bash
docker compose up -d          # Postgres 15 on :5432
npm install
npx prisma db push            # apply schema (no migration history in repo yet)
npm run db:seed               # demo users, cycle, goals, escalations
npm run dev                   # http://localhost:3000
```

### Verify everything works

```bash
npm run verify:seed           # demo data integrity
npm run verify:edge-cases     # weightage / submit rules
npm test                      # unit + integration (18 tests)
npm run test:e2e              # Playwright (16 tests; installs Chromium first time)
npm run build                 # production build
npm run demo                  # printed demo script for judges
```

---

## Atom AI Intelligence (Phase 6)

- **Atom AI Copilot** — floating assistant with data-driven Q&A (`/api/copilot/chat`)
- **Organization Pulse** — weighted health score with animated gauge (`/api/intelligence/pulse`)
- **Live insight carousel** — auto-rotating executive insights with confidence scores
- **Leadership recommendations** — proactive actions with urgency and explainability
- **Anomaly detection** — spikes in escalations, risk, and completion trends
- **What changed engine** — week-over-week organizational deltas
- **Executive briefings** — auto-generated leadership narratives
- **Optional OpenAI** — set `OPENAI_API_KEY` for natural language polish (deterministic fallback without it)

## Enterprise polish (Phase 5)

- **Demo Mode** — Role switcher, onboarding checklist, 6-step feature spotlight tour
- **PDF exports** — Executive summary & escalation reports (`/api/reports/pdf`)
- **Enterprise XLSX** — Cover sheet, department/manager grouping (`/api/reports/achievement?format=xlsx`)
- **Architecture showcase** — `/admin/architecture` with Mermaid diagrams
- **Observability** — Cron, email, API latency + performance panel
- **Premium login** — One-click demo cards for Employee / Manager / Admin / Executive

## Demo accounts

All passwords: **`password123`**. The seed creates **exactly 9 users** — 3 per role — with no extra demo accounts.

### Admins

| Email | Name | Purpose |
|-------|------|---------|
| `admin@demo.com` | Priya Mehta | Primary admin — cycles, users, reports, audit |
| `admin2@demo.com` | Vikram Singh | Secondary admin — HR operations |
| `admin3@demo.com` | Kavita Nair | Secondary admin — people ops |

### Managers

| Email | Name | Department | Purpose |
|-------|------|------------|---------|
| `manager@demo.com` | Amit Patel | Engineering | Approvals queue, team check-ins (3 direct reports) |
| `manager2@demo.com` | Deepa Joshi | Operations | Manager dashboard / analytics |
| `manager3@demo.com` | Karan Desai | Finance | Manager dashboard / analytics |

### Employees

| Email | Name | Goal sheet state | Purpose |
|-------|------|------------------|---------|
| `employee@demo.com` | Riya Sharma | **APPROVED** (locked) | Q1 check-in, approved goals |
| `employee2@demo.com` | Rohan Verma | **SUBMITTED** | Manager approval queue |
| `employee3@demo.com` | Sneha Iyer | **DRAFT** (60/40 weightage) | Submit-for-approval demo |

> Re-run `npm run db:seed` before demos if E2E tests changed `employee3@demo.com` to Submitted.

---

## Phase 0 — Project setup

**SOLUTION reference:** §14 Phase 0, §5 Schema, §6 Auth

**Goal:** Runnable Next.js app with auth, database, and seeded demo data.

### Implemented

| Requirement | Status | Location |
|-------------|--------|----------|
| Next.js 14 App Router + TypeScript | ✅ | `src/app/` |
| Prisma 5 schema (all models) | ✅ | `prisma/schema.prisma` |
| Postgres via Docker | ✅ | `docker-compose.yml` |
| NextAuth v5 (credentials) | ✅ | `src/lib/auth.ts`, `src/app/api/auth/` |
| Optional Azure AD SSO | ✅ | Same; enable via env |
| JWT session (7-day) | ✅ | `session.strategy: "jwt"` |
| Role middleware | ✅ | `src/middleware.ts` |
| Seed script | ✅ | `prisma/seed.ts` |
| Env template | ✅ | `.env.example` |
| shadcn/ui + Tailwind | ✅ | `src/components/ui/` |

### Key files

```
prisma/schema.prisma       # User, GoalSheet, Goal, Achievement, AuditLog, …
prisma/seed.ts             # FY 2025-26 cycle, 3 roles + extras
src/middleware.ts          # Auth + role-based route guard
src/app/(auth)/login/      # Credentials + optional Microsoft
src/lib/prisma.ts          # Singleton Prisma client
```

### How to verify Phase 0

```bash
docker compose up -d && npm run db:seed
npm run dev
# Login as employee@demo.com / manager@demo.com / admin@demo.com
npm run verify:seed
```

### Deviations from SOLUTION

| SOLUTION | This repo |
|----------|-----------|
| `pnpm` | **npm** (lockfile: `package-lock.json`) |
| `prisma migrate dev` | **`prisma db push`** for hackathon speed (no `prisma/migrations/` yet) |
| Supabase RLS | **App-level** auth in API routes + middleware (no Postgres RLS policies) |

---

## Phase 1 — Goals & approval

**SOLUTION reference:** §14 Phase 1, §7.2, §9.4–9.5, §10.1

**Goal:** Full goal lifecycle — create → submit → approve/rework → lock.

### Employee features

| Feature | Route | API |
|---------|-------|-----|
| Dashboard | `/employee` | — |
| My goal sheets | `/employee/goals` | `GET /api/goals` |
| Create goals | `/employee/goals/new` | `POST /api/goals` |
| Edit draft / rework | `/employee/goals/[sheetId]` | `PATCH /api/goals/[goalId]` per goal |
| Add/remove goals on sheet | Edit form | `POST/DELETE …/goals/…` |
| Submit for approval | Edit form / detail | `POST /api/goals/[sheetId]/submit` |
| View shared goals | `/employee/shared-goals` | `GET /api/shared-goals` |

**Components:** `GoalSheetForm`, `WeightageBar`, `UoMSelector`, `GoalTable`, `GoalStatusBadge`

**Business rules (server + client):**

- Max **8** goals per sheet; min **1** to submit
- Each goal **≥10%** weightage; total **=100%** at submit
- Goal setting only when cycle phase is **`GOAL_SETTING`** (`src/lib/cycle.ts`)
- One sheet per employee per cycle
- **Shared goals:** title/target locked; weightage editable (`isTitleLocked`, `isTargetLocked`)

### Manager features

| Feature | Route | API |
|---------|-------|-----|
| Approvals queue | `/manager/approvals` | `GET /api/goals?status=SUBMITTED` |
| Review sheet | `/manager/approvals/[sheetId]` | Approve/reject |
| Inline edits before approve | Review UI | `POST …/approve` with `inlineEdits` |
| Push shared goals | `/manager/shared-goals` | `POST /api/shared-goals` |

### Admin (Phase 1 slice)

| Feature | Route |
|---------|-------|
| Push shared goals | `/admin/shared-goals` |
| Unlock locked sheet | Button on employee sheet (admin) |

### APIs (Phase 1 core)

```
GET    /api/goals
POST   /api/goals
GET    /api/goals/[sheetId]
PATCH  /api/goals/[goalId]          # goalId = individual Goal id
POST   /api/goals/[sheetId]/goals     # add goal to sheet
DELETE /api/goals/[sheetId]/goals/[itemId]
POST   /api/goals/[sheetId]/submit
POST   /api/goals/[sheetId]/approve
POST   /api/goals/[sheetId]/reject
POST   /api/goals/[sheetId]/unlock    # admin
POST   /api/shared-goals
```

### Phase 1 validation checklist (SOLUTION §14)

| Rule | Enforced |
|------|----------|
| Weightage sum = 100% at submit | ✅ `validateSubmission` |
| Min 10% per goal | ✅ |
| Max 8 goals | ✅ |
| Shared goal title/target read-only | ✅ API + form |
| Locked after approval | ✅ `isLocked` |
| Manager inline-edit | ✅ approve payload |

### How to verify Phase 1

```bash
# employee@demo.com — create additional goals (no draft sheet)
login employee@demo.com → /employee/goals/new → add goals

# employee3 — submit pre-filled draft
login employee3@demo.com → /employee/goals/sheet-employee3-draft → Submit

# manager — approve employee2
login manager@demo.com → /manager/approvals → Review Rohan Verma → Approve

npm run verify:edge-cases
npx playwright test e2e/employee-journey.spec.ts e2e/manager-journey.spec.ts
```

---

## Phase 2 — Check-ins & achievements

**SOLUTION reference:** §14 Phase 2, §7.3–7.4, §10.2–10.3

**Goal:** Quarterly achievement logging after goals are approved and locked.

### Employee

| Feature | Route | API |
|---------|-------|-----|
| Quarterly check-in | `/employee/goals/[sheetId]/checkin` | `GET/POST /api/achievements` |
| Q1–Q4 tabs | Check-in page | Quarter windows from cycle dates |
| Progress score (live) | `AchievementForm` + `ProgressScore` | UoM formulas in `progress.ts` |
| Dashboard progress | `/employee` | `QuarterlyProgressCard`, `CycleStatusBanner` |

### Manager

| Feature | Route | API |
|---------|-------|-----|
| Team list | `/manager/team` | `GET /api/team` |
| Review check-in | `/manager/team/[employeeId]/checkin` | `GET/POST /api/checkins` |
| Comments | `CheckinCommentModal` | Manager rating + comment |

### UoM progress formulas

Implemented in `src/lib/calculations/progress.ts`:

- `NUMERIC_MIN` / `NUMERIC_MAX`
- `PERCENTAGE_MIN` / `PERCENTAGE_MAX`
- `TIMELINE` (deadline vs completion date)
- `ZERO_BASED`

### Shared goal sync

When a primary owner logs an achievement, linked shared goal rows sync via `src/lib/shared-goal-sync.ts` (called from achievements API).

### Phase 2 checklist

| Rule | Status |
|------|--------|
| Check-in only when sheet APPROVED + locked | ✅ |
| Quarter window enforcement | ✅ `isQuarterWindowOpen` |
| Progress on check-in form | ✅ |
| Manager planned vs actual | ✅ team check-in page |
| Shared achievement sync | ✅ |

### How to verify Phase 2

```bash
login employee@demo.com
/employee/goals → View approved sheet → Quarterly check-in → Save Q1
npx playwright test -g "Q1 achievement"
```

---

## Phase 3 — Admin & reports

**SOLUTION reference:** §14 Phase 3, §7.6, §12

**Goal:** Org master data, cycle config, exports, audit visibility.

### Admin pages

| Page | Route | APIs |
|------|-------|------|
| Dashboard | `/admin` | Aggregates |
| Users | `/admin/users` | `GET/POST /api/users`, `PATCH …/[userId]` |
| Departments | `/admin/departments` | `GET/POST`, `PATCH …/[id]` |
| Thrust areas | `/admin/thrust-areas` | `GET/POST`, `PATCH …/[id]` |
| Goal cycles | `/admin/cycles` | `GET/POST`, `PATCH …/[cycleId]` |
| Achievement report | `/admin/reports/achievement` | `GET /api/reports/achievement` |
| Completion report | `/admin/reports/completion` | `GET /api/reports/completion` |
| Audit log | `/admin/audit-log` | `GET /api/audit-logs` |
| Unlock sheet | Employee sheet (admin) | `POST …/unlock` |

### Reports & export

- **Achievement report:** filters + **JSON / XLSX / CSV** (`xlsx`, `ExportButton`)
- **Completion report:** goal-setting and check-in completion by department
- **Audit log:** filter by action; **Details** shows `previousValues`, `newValues`, `metadata`

### Phase 3 checklist

| Item | Status | Notes |
|------|--------|-------|
| User CRUD | ✅ | Deactivate via `isActive` |
| Department / thrust area | ✅ | PATCH only (no delete) |
| Cycle create + activate | ✅ | `systemConfig.active_cycle_id` |
| Cycle date edit UI | ⚠️ | PATCH API exists; limited edit UI |
| TanStack Table on reports | ⚠️ | Plain tables; package installed |
| Audit diff modal | ✅ | previous/new JSON |
| XLSX/CSV export | ✅ | |

### How to verify Phase 3

```bash
login admin@demo.com
/admin/users → /admin/cycles → /admin/reports/achievement → Export XLSX
/admin/audit-log → Details on a row
npx playwright test e2e/admin-journey.spec.ts
```

---

## Phase 4 — Notifications & cron

**SOLUTION reference:** §14 Phase 4, §11

### In-app notifications

- **Bell** in topbar (`NotificationBell`)
- `GET /api/notifications`, mark read `PATCH …/[id]`
- Created on: submit, approve, reject, shared goal push, escalations

### Email (Resend + React Email)

Templates in `src/lib/email/templates/`:

| Template | Trigger |
|----------|---------|
| `GoalSubmitted` | Employee submits |
| `GoalApproved` | Manager approves |
| `GoalRejected` | Manager rework |
| `CheckinReminder` | Cron |
| `EscalationAlert` | Escalation engine |

Requires `RESEND_API_KEY` + `EMAIL_FROM` in production.

### Vercel cron (`vercel.json`)

| Schedule | Route | Purpose |
|----------|-------|---------|
| Daily 09:00 | `/api/cron/check-reminders` | Check-in reminders |
| Daily 10:00 | `/api/cron/escalation-check` | Escalation rules |
| Monthly 1st 08:00 | `/api/cron/cycle-open` | Cycle phase notifications |

Cron routes protected by `CRON_SECRET` (`src/lib/cron-auth.ts`) — Bearer or `x-vercel-cron-secret`.

### How to verify Phase 4

```bash
# Manual cron (local)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/check-reminders

# Submit a goal → manager gets in-app notification (+ email if Resend configured)
```

---

## Phase 5 — Bonus features

**SOLUTION reference:** §13, §14 Phase 5

### Analytics dashboards

| Role | Route | API |
|------|-------|-----|
| Admin | `/admin/analytics` | `GET /api/reports/analytics` |
| Manager | `/manager/analytics` | Same (scoped) |

**Charts (Recharts):** QoQ trends, department breakdown, thrust-area pie, manager effectiveness table — `AnalyticsDashboard.tsx`.

### Escalations

| Page | Route | APIs |
|------|-------|------|
| Rules + logs | `/admin/escalations` | `/api/escalations/rules`, `…/logs` |

Engine: `src/lib/escalation.ts` + daily cron.

### Azure AD SSO

- Provider in `src/lib/auth.ts` when `AZURE_AD_*` set
- Login button when `NEXT_PUBLIC_AZURE_AD_ENABLED=true`
- **Not implemented:** Microsoft Graph org hierarchy auto-sync (SOLUTION §13.1 sample) — users still seeded / created in admin

### Microsoft Teams

- Webhook URL in **Admin → Settings** (`/admin/settings`, `PATCH /api/settings`)
- Adaptive card on goal submit: `src/lib/teams/webhook.ts`

### How to verify Phase 5

```bash
/admin/analytics → charts load
/admin/escalations → rules list
/admin/settings → paste Teams webhook URL (optional)
# Azure: set AZURE_AD_* and NEXT_PUBLIC_AZURE_AD_ENABLED=true
```

---

## Phase 6 — Polish & quality

**SOLUTION reference:** §14 Phase 6

| Item | Status | Location |
|------|--------|----------|
| Responsive layout / mobile nav | ✅ | `DashboardShell`, `TableScroll` |
| Loading skeletons | ✅ | Major list/detail pages |
| Error boundary | ✅ | `ErrorBoundary` in dashboard layout |
| Route error UI | ✅ | `src/app/(dashboard)/error.tsx` |
| Empty states | ✅ | Goals list, approvals, audit log |
| Edge-case script | ✅ | `scripts/verify-edge-cases.ts` |
| Seed verification | ✅ | `scripts/verify-seed.ts` |
| Architecture doc | ✅ | `ARCHITECTURE.md` |
| E2E tests | ✅ | `e2e/` (16 tests) |
| Demo walkthrough script | ✅ | `npm run demo` |

### Edge cases covered

```bash
npm run verify:edge-cases
# 0 goals blocked, 99% blocked, 100% OK, >8 goals blocked, <10% per goal blocked
```

### How to verify Phase 6

```bash
npm run test:e2e
npm run build
# Resize browser → mobile sidebar drawer works
```

---

## Testing (§16)

### Unit tests (Vitest)

| File | Covers |
|------|--------|
| `src/lib/calculations/weightage.test.ts` | Submit validation rules |
| `src/lib/calculations/progress.test.ts` | All UoM progress scores |

```bash
npm test
```

### Integration tests (Vitest + Prisma)

`src/lib/goals-workflow.integration.test.ts` — requires DB + seed:

```bash
npm run db:seed
npm run test:integration
```

### E2E (Playwright)

```bash
npx playwright install chromium   # first time only
npm run test:e2e                  # 16 tests — auth, employee, manager, admin
```

**CI:** `.github/workflows/ci.yml` — lint, typecheck, unit, integration, build, E2E on Postgres.

---

## Deployment (§17)

### Target architecture

```
Vercel (Next.js + API routes + Cron)
    ↓
Supabase / Neon (PostgreSQL)
    ↓
Resend (email) · Teams webhook · Azure AD (optional)
```

### Vercel steps

1. Import repo; root directory = `atomquest-portal`
2. Set env vars from `.env.example`
3. Deploy (`postinstall` → `prisma generate`; build → `prisma generate && next build`)
4. Once per environment:
   ```bash
   npx prisma db push
   npm run db:seed
   ```

### Pre-deploy checklist

```bash
npm run db:seed
npm run verify:seed && npm run verify:edge-cases
npm test && npm run test:integration
npm run test:e2e
npm run build
```

---

## API reference

**Convention:** `{ success: true, data }` or `{ success: false, error }` — see `src/lib/api-response.ts`.

> **Note:** `[goalId]` in path means **goal sheet id** for submit/approve/unlock/nested goals; **individual Goal id** for `PATCH /api/goals/[goalId]`.

### Goals & sheets

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/goals` | List sheets (role-scoped) |
| POST | `/api/goals` | Create sheet + goals |
| GET | `/api/goals/[id]` | Sheet or goal detail |
| PATCH | `/api/goals/[goalId]` | Update one goal |
| POST | `/api/goals/[sheetId]/goals` | Add goal to sheet |
| DELETE | `/api/goals/[sheetId]/goals/[itemId]` | Remove goal |
| POST | `/api/goals/[sheetId]/submit` | Submit for approval |
| POST | `/api/goals/[sheetId]/approve` | Approve (+ optional inline edits) |
| POST | `/api/goals/[sheetId]/reject` | Return for rework |
| POST | `/api/goals/[sheetId]/unlock` | Admin unlock |

### Achievements & check-ins

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/achievements` | List / upsert achievements |
| GET/POST | `/api/checkins` | Manager comments |

### Admin & reports

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/users` | List / create |
| PATCH | `/api/users/[userId]` | Update role, dept, active |
| GET/POST | `/api/departments` | Departments |
| GET/POST | `/api/thrust-areas` | Thrust areas |
| GET/POST/PATCH | `/api/cycles` | Goal cycles |
| GET | `/api/reports/achievement` | `?format=json\|xlsx\|csv` |
| GET | `/api/reports/completion` | Completion stats |
| GET | `/api/reports/analytics` | Analytics payload |
| GET | `/api/audit-logs` | Paginated audit trail |

### Other

| Method | Path | Description |
|--------|------|-------------|
| GET/PATCH | `/api/notifications` | In-app notifications |
| POST | `/api/shared-goals` | Push shared goal |
| GET | `/api/team` | Manager's direct reports |
| GET/PATCH | `/api/settings` | Teams webhook URL |
| GET/POST/PATCH | `/api/escalations/rules` | Escalation config |
| GET | `/api/escalations/logs` | Escalation history |
| GET | `/api/cron/*` | Scheduled jobs (secured) |

---

## Routes & navigation

### Employee

| Path | Description |
|------|-------------|
| `/employee` | Dashboard + cycle banner |
| `/employee/goals` | Goal sheet list |
| `/employee/goals/new` | Create (redirects if draft exists) |
| `/employee/goals/[sheetId]` | Edit or view sheet |
| `/employee/goals/[sheetId]/checkin` | Quarterly achievements |
| `/employee/shared-goals` | Org shared goals |

### Manager

| Path | Description |
|------|-------------|
| `/manager` | Dashboard |
| `/manager/approvals` | Pending submissions |
| `/manager/approvals/[sheetId]` | Review / approve / rework |
| `/manager/team` | Direct reports |
| `/manager/team/[employeeId]/checkin` | Team check-in review |
| `/manager/analytics` | Team analytics |
| `/manager/shared-goals` | Push shared goals |

### Admin

| Path | Description |
|------|-------------|
| `/admin` | Admin dashboard |
| `/admin/users` | User management |
| `/admin/departments` | Departments |
| `/admin/thrust-areas` | Thrust areas |
| `/admin/cycles` | Cycle windows |
| `/admin/reports/achievement` | Achievement export |
| `/admin/reports/completion` | Completion rates |
| `/admin/audit-log` | Audit trail |
| `/admin/shared-goals` | Push shared goals |
| `/admin/analytics` | Org analytics |
| `/admin/escalations` | Escalation rules/logs |
| `/admin/settings` | Integrations (Teams) |

---

## Business rules

### Weightage (goals)

| Rule | Value |
|------|-------|
| Min goals to submit | 1 |
| Max goals | 8 |
| Min weightage per goal | 10% |
| Total at submit | **100%** (±0.01) |

### Cycle phases (`getCurrentPhase`)

Derived from configurable date windows on `GoalCycle`:

`GOAL_SETTING` → `Q1_CHECKIN` → `Q2_CHECKIN` → `Q3_CHECKIN` → `Q4_ANNUAL` → `CLOSED`

Goal create/submit requires **GOAL_SETTING**. Achievements require **approved + locked** sheet and open quarter window.

### Goal sheet statuses

`DRAFT` → `SUBMITTED` → `APPROVED` (locked) or `REWORK` (editable again)

---

## Environment variables

See [`.env.example`](.env.example) for full list.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres (pooler in prod) |
| `DIRECT_URL` | Yes | Direct connection (migrations) |
| `AUTH_SECRET` / `NEXTAUTH_SECRET` | Yes | Session signing |
| `NEXTAUTH_URL` | Yes | Auth callback base URL |
| `NEXT_PUBLIC_APP_URL` | Yes | Client links |
| `CRON_SECRET` | Prod | Cron authentication |
| `RESEND_API_KEY` | Optional | Email |
| `EMAIL_FROM` | Optional | Sender address |
| `AZURE_AD_*` | Optional | Microsoft SSO |
| `NEXT_PUBLIC_AZURE_AD_ENABLED` | Optional | Show Microsoft button |
| `TEAMS_WEBHOOK_URL` | Optional | Default Teams webhook |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run build` | `prisma generate && next build` |
| `npm run start` | Production server |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio GUI |
| `npm test` | Unit + integration tests |
| `npm run test:integration` | DB workflow tests only |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run verify:seed` | Verify seed data |
| `npm run verify:edge-cases` | Business rule checks |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run demo` | Print demo walkthrough |

---

## Production readiness notes

**Implemented at production-oriented quality** for a hackathon scope: typed API layer, Zod validation, audit logs, role guards, tests, CI, cron, email templates, and comprehensive seed data.

**Known gaps vs full SOLUTION spec** (acceptable for submission; document for roadmap):

| Area | Gap |
|------|-----|
| Azure AD | SSO works; **Graph API manager sync** not implemented |
| Database | **`db push`** instead of versioned migrations |
| Supabase RLS | Security via **application layer**, not RLS policies |
| Reports UI | **TanStack Table** not used on all report pages |
| Cycle admin | **Full date-window edit UI** limited |
| Husky / lint-staged | Not configured (CI runs lint) |
| Package manager | **npm** vs SOLUTION's pnpm |
| Check-ins nav | No `/employee/check-ins` index; use per-sheet check-in URL |

**Security reminders for production:**

- Rotate all secrets; never commit `.env.local`
- Use pooled `DATABASE_URL` on Vercel
- Restrict cron routes with strong `CRON_SECRET`
- Verify Resend domain (SPF/DKIM)

---

## Demo walkthrough (judges)

```bash
npm run demo
```

**Suggested order (~10 min):**

1. **Employee** — `employee@demo.com` → goals → check-in on approved sheet  
2. **Manager** — `manager@demo.com` → approve `employee2@demo.com` → team check-in  
3. **Admin** — `admin@demo.com` → cycles → achievement export → audit log  

---

## Related documents

- [`../SOLUTION.md`](../SOLUTION.md) — Complete blueprint (4014 lines)
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — Mermaid diagram + domain overview
- [`PHASES.md`](PHASES.md) — Phase completion summary

---

*AtomGoal — Atomberg Hackathon · Built with Next.js 14, Prisma 5, NextAuth v5*
