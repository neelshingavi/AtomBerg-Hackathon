import { DIFFERENTIATION, PRODUCT } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function CategoryDifferentiation({ className }: { className?: string }) {
  return (
    <section className={cn("space-y-4", className)}>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Category creation
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight">
          Not project management —{" "}
          <span className="text-gradient">organizational execution intelligence</span>
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          {PRODUCT.name} is a {PRODUCT.category.toLowerCase()}. It unifies
          predictive coordination, strategic alignment, and leadership response —
          where traditional tools remain reactive.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {DIFFERENTIATION.map((row) => (
          <article
            key={row.not}
            className="rounded-xl border border-border/80 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-medium text-muted-foreground line-through decoration-red-300/60">
              {row.not}
            </p>
            <p className="mt-2 text-sm font-medium leading-snug">{row.is}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
