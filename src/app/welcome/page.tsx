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
export default function WelcomePage() {
  return (
    <div className="min-h-dvh mesh-bg">
      <header className="border-b border-border/60 bg-card/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-lg font-bold text-gradient">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomQuest"}
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-600 hover:underline"
          >
            Sign in →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
            <Sparkles className="h-3.5 w-3.5" />
            AI-powered organizational intelligence
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            The operating system for{" "}
            <span className="text-gradient">workforce execution</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            Unify goals, alignment, predictive risk, executive briefings, and live operations
            in one enterprise command platform — built for leaders who need clarity before
            quarter-end surprises.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:opacity-95"
            >
              Launch demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex h-11 items-center rounded-lg border px-6 text-sm font-medium hover:bg-muted/50"
            >
              Executive sign in
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
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
          ].map((f) => (
            <article
              key={f.title}
              className="enterprise-card rounded-2xl p-6 transition-shadow hover:shadow-card-hover"
            >
              <f.icon className="mb-3 h-8 w-8 text-brand-600" />
              <h2 className="font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </div>

        <section className="mt-24 rounded-2xl border bg-gradient-to-br from-slate-900 to-slate-950 p-8 text-white md:p-12">
          <h2 className="text-2xl font-bold">Built for enterprise demos</h2>
          <p className="mt-3 max-w-2xl text-slate-300">
            Sign in with demo accounts to experience the full judge flow: briefing → alignment
            → forecast → command center → AI copilot → live collaboration. Press ⌘K anywhere for
            instant navigation.
          </p>
          <p className="mt-6 text-sm text-slate-400">
            Demo: admin@demo.com / manager@demo.com / employee@demo.com · password123
          </p>
        </section>
      </main>
    </div>
  );
}
