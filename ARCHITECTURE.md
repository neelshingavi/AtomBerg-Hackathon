# AtomGoal — Architecture Overview

## System context

```mermaid
flowchart TB
  subgraph clients [Clients]
    Browser[Web Browser]
  end

  subgraph app [Next.js 14 App]
    UI[React UI / shadcn]
    API[API Routes]
    Auth[NextAuth v5]
    Cron[Vercel Cron Jobs]
  end

  subgraph data [Data]
    PG[(PostgreSQL)]
    Prisma[Prisma ORM]
  end

  subgraph external [External Services]
    Resend[Resend Email]
    Teams[MS Teams Webhook]
    Azure[Azure AD SSO]
  end

  Browser --> UI
  UI --> API
  UI --> Auth
  API --> Prisma
  Prisma --> PG
  Cron --> API
  API --> Resend
  API --> Teams
  Auth --> Azure
```

## Core domains

| Domain | Key routes | Notes |
|--------|------------|-------|
| Goals | `/employee/goals`, `/api/goals` | Weightage 100%, max 8 goals, min 10% each |
| Approvals | `/manager/approvals`, submit/approve/reject APIs | Locks sheet on approve |
| Check-ins | `/employee/goals/[id]/checkin`, `/api/achievements` | Quarter windows enforced |
| Admin | `/admin/*` | Users, cycles, reports, escalations |
| Notifications | Bell UI, `/api/notifications` | In-app + email + Teams |

## Role model

- **EMPLOYEE** — create/submit goals, log achievements
- **MANAGER** — approve team sheets, team check-ins, team analytics
- **ADMIN** — full org config, reports, unlock sheets, escalations

## Background jobs

| Cron | Schedule | Purpose |
|------|----------|---------|
| `check-reminders` | Daily 9:00 | Quarterly achievement reminders |
| `escalation-check` | Daily 10:00 | Escalation rule engine |
| `cycle-open` | Monthly 1st | Phase sync + cycle start alerts |

Protected by `CRON_SECRET` bearer token.
