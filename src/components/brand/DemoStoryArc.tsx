import { DEMO_STORY_ARC } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function DemoStoryArc({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-6", className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Judge demo arc
        </p>
        <h2 className="mt-1 text-xl font-bold tracking-tight">
          A cinematic journey through organizational intelligence
        </h2>
      </div>
      <ol className="grid gap-4 md:grid-cols-5">
        {DEMO_STORY_ARC.map((step) => (
          <li
            key={step.part}
            className="relative rounded-2xl border border-border/80 bg-white p-5 shadow-sm"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 text-xs font-bold text-white">
              {step.part}
            </span>
            <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
