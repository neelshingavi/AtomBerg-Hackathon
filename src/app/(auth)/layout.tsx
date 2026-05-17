import Link from "next/link";
import type { ReactNode } from "react";
import { Sparkles, Target, Radio, Brain } from "lucide-react";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "AtomQuest";

const HIGHLIGHTS = [
  { icon: Target, label: "Strategic alignment" },
  { icon: Brain, label: "AI workforce intelligence" },
  { icon: Radio, label: "Live command center" },
] as const;

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <div className="relative hidden overflow-hidden bg-[hsl(222,47%,9%)] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-brand-500/25 blur-[100px]" />
          <div className="absolute bottom-10 right-0 h-64 w-64 rounded-full bg-cyan-500/20 blur-[90px]" />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-between px-10 py-10 xl:px-14 xl:py-12">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-300/90">
              Atomberg Hackathon
            </p>
            <div className="mt-10 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 shadow-lg shadow-brand-500/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">{appName}</span>
            </div>
          </div>

          <div className="max-w-lg">
            <h1 className="text-[2.5rem] font-bold leading-[1.1] tracking-tight text-white xl:text-5xl">
              Your organization&apos;s
              <span className="mt-1 block bg-gradient-to-r from-brand-300 via-brand-400 to-cyan-400 bg-clip-text text-transparent">
                performance operating system
              </span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-slate-400">
              Strategic alignment, workforce intelligence, operational visibility, and
              proactive governance — built for enterprise leaders.
            </p>

            <ul className="mt-10 space-y-3">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-3 text-sm text-slate-300"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4 text-brand-300" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-white/10 pt-8">
            {[
              { value: "100+", label: "Seeded employees" },
              { value: "AI", label: "Copilot intelligence" },
              { value: "Live", label: "Ops command center" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-bold tabular-nums text-white">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex min-h-dvh flex-col bg-[hsl(220,20%,98%)]">
        <header className="flex shrink-0 items-center justify-between px-6 py-5 lg:justify-end lg:px-10">
          <Link
            href="/welcome"
            className="text-sm font-semibold text-gradient lg:hidden"
          >
            {appName}
          </Link>
          <Link
            href="/welcome"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Product overview →
          </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-4 pt-2 sm:px-10">
          <div className="w-full max-w-[420px]">{children}</div>
        </div>

        <footer className="shrink-0 px-6 py-5 text-center text-xs text-muted-foreground sm:px-10">
          © {new Date().getFullYear()} {appName} · AtomQuest 1.0
        </footer>
      </div>
    </div>
  );
}
