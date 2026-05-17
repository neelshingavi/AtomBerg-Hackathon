"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Map, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JUDGE_PRESENTATION_FLOW } from "@/lib/demo/judge-flow";
import { useDemoModeOptional } from "@/contexts/DemoModeContext";
import { cn } from "@/lib/utils";

export function JudgeFlowGuide() {
  const demo = useDemoModeOptional();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!demo?.enabled) return null;

  const currentIndex = JUDGE_PRESENTATION_FLOW.findIndex((step) => {
    const base = step.route.split("#")[0];
    return pathname === base || pathname.startsWith(`${base}/`);
  });

  const current = currentIndex >= 0 ? JUDGE_PRESENTATION_FLOW[currentIndex] : null;
  const next =
    currentIndex >= 0 && currentIndex < JUDGE_PRESENTATION_FLOW.length - 1
      ? JUDGE_PRESENTATION_FLOW[currentIndex + 1]
      : null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="fixed bottom-24 left-4 z-40 flex items-center gap-2 rounded-full border border-brand-300/50 bg-white px-4 py-2 text-xs font-semibold shadow-lg hover:bg-brand-50"
            onClick={() => setOpen(true)}
            aria-label="Open judge presentation flow"
          >
            <Map className="h-4 w-4 text-brand-600" />
            Judge flow
            {current && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] text-brand-800">
                {current.order}/{JUDGE_PRESENTATION_FLOW.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            className="fixed bottom-4 left-4 z-40 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl"
            aria-label="Judge presentation flow"
          >
            <header className="flex items-center justify-between border-b bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-semibold">Judge presentation flow</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                aria-label="Close judge flow"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </header>
            <ol className="max-h-[min(420px,50vh)] overflow-y-auto p-3 space-y-1">
              {JUDGE_PRESENTATION_FLOW.map((step) => {
                const active = step.order === current?.order;
                return (
                  <li key={step.order}>
                    <Link
                      href={step.route}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-2.5 text-left transition-colors",
                        active
                          ? "bg-brand-50 border border-brand-200"
                          : "hover:bg-muted/60"
                      )}
                    >
                      <span className="text-[10px] font-bold tabular-nums text-brand-600">
                        {step.order}
                      </span>
                      <p className="text-sm font-medium leading-snug">{step.title}</p>
                      <p className="text-[11px] text-muted-foreground">{step.subtitle}</p>
                      {active && (
                        <p className="mt-1 text-[10px] font-medium text-brand-700">
                          Wow → {step.wowMoment}
                        </p>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ol>
            {next && (
              <footer className="border-t p-3">
                <Button
                  className="w-full gap-1 bg-brand-600 hover:bg-brand-700"
                  size="sm"
                  onClick={() => {
                    router.push(next.route);
                    setOpen(false);
                  }}
                >
                  Next: {next.title}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </footer>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
