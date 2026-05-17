import Link from "next/link";
import {
  Sparkles,
  Network,
  Radio,
  Brain,
  Shield,
  ArrowRight,
  BarChart3,
} from "lucide-react";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AtomQuest";

const FEATURES = [
  {
    icon: Sparkles,
    title: "Executive Briefing",
    body: "Cinematic boardroom narratives, war room, and presentation-ready intelligence.",
  },
  {
    icon: Network,
    title: "Strategic Alignment",
    body: "Interactive dependency graphs with risk propagation and timeline replay.",
  },
  {
    icon: BarChart3,
    title: "Predictive Forecasting",
    body: "Forward-looking risk radar, scenarios, and intervention recommendations.",
  },
  {
    icon: Radio,
    title: "Live Operations",
    body: "Real-time command center, presence, alerts, and collaboration spaces.",
  },
  {
    icon: Brain,
    title: "AI Copilot",
    body: "Natural-language organizational intelligence with live data context.",
  },
  {
    icon: Shield,
    title: "Enterprise Trust",
    body: "Audit trails, role-based access, automation, and observability built in.",
  },
] as const;

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-[hsl(220,20%,98%)]">
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold text-gradient">{appName}</span>
          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-4 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:opacity-95"
          >
            Sign in
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="mx-auto max-w-3xl text-center md:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered organizational intelligence
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            The operating system for{" "}
            <span className="text-gradient">workforce execution</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Unify goals, alignment, predictive risk, executive briefings, and live
            operations in one enterprise command platform.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:opacity-95 sm:w-auto"
            >
              Launch demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-white px-6 text-sm font-medium hover:bg-muted/40 sm:w-auto"
            >
              Executive sign in
            </Link>
          </div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article
              key={f.title}
              className="flex flex-col rounded-2xl border border-border/80 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <f.icon className="mb-4 h-8 w-8 text-brand-600" />
              <h2 className="text-base font-semibold">{f.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </article>
          ))}
        </div>

        <section className="mt-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-white md:p-10">
          <h2 className="text-2xl font-bold">Built for enterprise demos</h2>
          <p className="mt-3 max-w-2xl text-slate-300 leading-relaxed">
            Sign in with demo accounts to run the full judge flow: briefing → alignment
            → forecast → command center → AI copilot → live collaboration. Press ⌘K
            anywhere for instant navigation.
          </p>
          <p className="mt-6 font-mono text-sm text-slate-400">
            admin@demo.com · manager@demo.com · employee@demo.com · password123
          </p>
        </section>
      </main>
    </div>
  );
}
