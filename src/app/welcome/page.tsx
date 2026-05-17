import Link from "next/link";
import {
  Sparkles,
  Network,
  Radio,
  Brain,
  Shield,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
} from "lucide-react";
import { PRODUCT, FUTURE_OF_WORK_PHRASES } from "@/lib/brand";
import { CategoryDifferentiation } from "@/components/brand/CategoryDifferentiation";
import { DemoStoryArc } from "@/components/brand/DemoStoryArc";

const CAPABILITIES = [
  {
    icon: Sparkles,
    title: "Executive Briefing Center",
    body: "Cinematic boardroom narratives, war room mode, and presentation-ready leadership intelligence.",
  },
  {
    icon: Network,
    title: "Strategic Alignment Network",
    body: "Interactive dependency graphs with risk propagation and alignment intelligence.",
  },
  {
    icon: BarChart3,
    title: "Execution Forecast Engine",
    body: "Forward-looking risk radar, scenario simulation, and intervention recommendations.",
  },
  {
    icon: Radio,
    title: "Leadership Response Center",
    body: "Real-time operational pulse, executive alerts, presence, and incident coordination.",
  },
  {
    icon: Brain,
    title: "Atom Strategic Advisor",
    body: "Executive-grade AI that explains implications, prioritizes risks, and recommends interventions.",
  },
  {
    icon: Shield,
    title: "Enterprise Trust Layer",
    body: "Audit trace visibility, RBAC, governance automation, and observability built in.",
  },
] as const;

export default function WelcomePage() {
  return (
    <div className="min-h-dvh bg-[hsl(220,20%,98%)]">
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <span className="text-lg font-bold text-gradient">{PRODUCT.name}</span>
          <span className="hidden text-xs font-medium uppercase tracking-widest text-muted-foreground sm:inline">
            {PRODUCT.tagline}
          </span>
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
            {PRODUCT.category}
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            {PRODUCT.vision}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Organizations are becoming too complex for reactive tools. Leadership lacks
            visibility. Execution fragments across departments. {PRODUCT.name} unifies{" "}
            {FUTURE_OF_WORK_PHRASES.slice(0, 3).join(", ")}, and{" "}
            {FUTURE_OF_WORK_PHRASES[3]} — in one intelligence operating system.
          </p>
          <p className="mt-3 text-sm font-medium text-brand-800">{PRODUCT.mission}</p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:opacity-95 sm:w-auto"
            >
              Experience the demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-border bg-white px-6 text-sm font-medium hover:bg-muted/40 sm:w-auto"
            >
              Executive access
            </Link>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap justify-center gap-2 md:justify-start">
          {FUTURE_OF_WORK_PHRASES.map((phrase) => (
            <span
              key={phrase}
              className="rounded-full border border-border/80 bg-white px-3 py-1 text-xs font-medium text-muted-foreground"
            >
              {phrase}
            </span>
          ))}
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((f) => (
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

        <div className="mt-20">
          <CategoryDifferentiation />
        </div>

        <div className="mt-20">
          <DemoStoryArc />
        </div>

        <section className="mt-16 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-brand-950 p-8 text-white md:p-10">
          <div className="flex items-start gap-3">
            <Target className="mt-1 h-6 w-6 text-brand-300" />
            <div>
              <h2 className="text-2xl font-bold">Built for the judge demo finale</h2>
              <p className="mt-3 max-w-2xl text-slate-300 leading-relaxed">
                End your presentation in the Executive War Room with organizational pulse,
                AI strategic summary, alignment network, and live collaboration — all active
                simultaneously. Press ⌘K anywhere for instant navigation.
              </p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400" /> Briefing → Alignment → Forecast
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Radio className="h-4 w-4 text-cyan-400" /> Command Center → Strategic Advisor
            </span>
          </div>
          <p className="mt-6 font-mono text-sm text-slate-500">
            admin@demo.com · manager@demo.com · employee@demo.com · password123
          </p>
        </section>
      </main>
    </div>
  );
}
