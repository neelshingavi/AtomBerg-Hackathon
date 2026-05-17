"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeIn, FadeInView } from "@/components/motion";
import {
  Database,
  Shield,
  Zap,
  Globe,
  Layers,
  GitBranch,
  Server,
  Lock,
} from "lucide-react";

const DIAGRAMS = [
  {
    id: "high-level",
    title: "High-Level Architecture",
    description: "Next.js App Router frontend with API routes, Prisma ORM, and PostgreSQL.",
    mermaid: `flowchart TB
  subgraph Client
    UI[React 18 + TanStack Query]
    Auth[NextAuth Session]
  end
  subgraph NextJS["Next.js 14 App Router"]
    Pages[Server + Client Components]
    API[API Routes / Route Handlers]
    Cron[Vercel Cron Jobs]
  end
  subgraph Data
    PG[(PostgreSQL)]
    Prisma[Prisma ORM]
  end
  subgraph External
    Email[Resend Email]
    Teams[MS Teams Webhook]
    Azure[Azure AD SSO]
  end
  UI --> Pages
  UI --> API
  Auth --> API
  API --> Prisma
  Prisma --> PG
  Cron --> API
  API --> Email
  API --> Teams
  Auth --> Azure`,
  },
  {
    id: "auth-flow",
    title: "Authentication Flow",
    description: "JWT sessions with credentials and optional Azure AD enterprise SSO.",
    mermaid: `sequenceDiagram
  participant U as User
  participant L as Login Page
  participant NA as NextAuth
  participant DB as PostgreSQL
  U->>L: Submit credentials
  L->>NA: signIn(credentials)
  NA->>DB: Validate user + bcrypt
  DB-->>NA: User profile + role
  NA-->>L: JWT session cookie
  L->>U: Redirect by role
  Note over NA,DB: Middleware enforces route access`,
  },
  {
    id: "escalation-flow",
    title: "Escalation Engine",
    description: "Cron-driven rules evaluate deadlines and trigger multi-channel notifications.",
    mermaid: `flowchart LR
  Cron[Escalation Cron] --> Rules[Escalation Rules]
  Rules --> Eval{Trigger Met?}
  Eval -->|Yes| Log[Escalation Log]
  Log --> Notify[Notifications]
  Log --> Email[Email Alert]
  Log --> Teams[Teams Webhook]
  Eval -->|No| Skip[Skip]`,
  },
  {
    id: "analytics",
    title: "Analytics Pipeline",
    description: "Aggregated reports power executive dashboards and risk intelligence.",
    mermaid: `flowchart TB
  GS[Goal Sheets] --> Agg[Report Aggregators]
  CH[Check-ins] --> Agg
  ES[Escalations] --> Agg
  Agg --> Exec[Executive Report API]
  Agg --> Risk[Risk Engine]
  Agg --> Align[Alignment Tree]
  Exec --> Dash[Executive Dashboard]
  Risk --> Dash
  Align --> Dash`,
  },
  {
    id: "deployment",
    title: "Deployment Topology",
    description: "Low-cost Vercel + managed Postgres with efficient cron scheduling.",
    mermaid: `flowchart TB
  Users[Users] --> CDN[Vercel Edge CDN]
  CDN --> App[Next.js Serverless]
  App --> DB[(Neon / Supabase Postgres)]
  Cron[Vercel Cron] --> App
  App --> Resend[Resend API]
  App --> Teams[Teams Webhook]`,
  },
];

const SCALING = [
  {
    icon: Database,
    title: "Database",
    items: [
      "Indexed foreign keys on goal sheets, escalations, audit logs",
      "Pagination on all list endpoints",
      "Prisma select/include optimization per query",
    ],
  },
  {
    icon: Zap,
    title: "Performance",
    items: [
      "React Query 30s stale time + realtime invalidation",
      "Lazy-loaded chart bundles via next/dynamic",
      "Debounced search and table URL state",
    ],
  },
  {
    icon: Shield,
    title: "Security",
    items: [
      "Role-based API guards on every route",
      "Immutable audit trail with IP tracking",
      "Session timeout indicators + sensitive action confirmations",
    ],
  },
  {
    icon: Globe,
    title: "Cost Optimization",
    items: [
      "Serverless — pay per request, zero idle cost",
      "Batched notification delivery",
      "Cron jobs limited to 3 scheduled tasks",
    ],
  },
];

export default function ArchitecturePage() {
  return (
    <>
      <Topbar title="Architecture" />
      <PageContainer>
        <PageHeader
          title="System architecture"
          description="Production-grade design for organizational performance at scale."
          actions={
            <Badge variant="outline" className="gap-1">
              <Layers className="h-3 w-3" />
              Engineering maturity
            </Badge>
          }
        />

        <FadeIn>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Server, label: "Runtime", value: "Next.js 14" },
              { icon: Database, label: "Data", value: "PostgreSQL + Prisma" },
              { icon: GitBranch, label: "Pattern", value: "Modular monolith" },
              { icon: Lock, label: "Auth", value: "NextAuth JWT" },
            ].map((s) => (
              <Card key={s.label} className="enterprise-card">
                <CardContent className="flex items-center gap-3 p-4">
                  <s.icon className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                    <p className="font-semibold">{s.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeIn>

        <div className="space-y-8">
          {DIAGRAMS.map((d) => (
            <FadeInView key={d.id}>
              <Card className="enterprise-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg">{d.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{d.description}</p>
                </CardHeader>
                <CardContent>
                  <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-relaxed text-slate-300">
                    <code>{d.mermaid}</code>
                  </pre>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Mermaid diagram — render in GitHub, Notion, or mermaid.live
                  </p>
                </CardContent>
              </Card>
            </FadeInView>
          ))}
        </div>

        <FadeInView className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Scaling & optimization strategy</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {SCALING.map((s) => (
              <Card key={s.title} className="enterprise-card">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <s.icon className="h-4 w-4 text-brand-600" />
                    {s.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {s.items.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="text-brand-500">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeInView>
      </PageContainer>
    </>
  );
}
