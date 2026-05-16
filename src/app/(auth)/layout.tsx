import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh overflow-hidden">
      <div className="relative hidden w-[52%] flex-col justify-between overflow-hidden bg-[hsl(222,47%,11%)] p-12 lg:flex">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-brand-500/20 blur-[100px] animate-pulse-soft" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/15 blur-[80px] animate-float" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand-300">
            Atomberg Hackathon
          </p>
          <h1 className="mt-6 max-w-md text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
            Goals that drive{" "}
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
              performance
            </span>
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-slate-400">
            Set objectives, track quarterly achievements, and align your team — all in one
            enterprise-grade portal.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {[
            { label: "Roles", value: "3" },
            { label: "Quarters", value: "4" },
            { label: "Workflow", value: "E2E" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center mesh-bg px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">{children}</div>
        <p className="mt-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}{" "}
          {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"} · AtomQuest 1.0
        </p>
      </div>
    </div>
  );
}
