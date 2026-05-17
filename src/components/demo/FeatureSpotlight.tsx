"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDemoModeOptional } from "@/contexts/DemoModeContext";
import { SPOTLIGHT_STEPS } from "@/lib/demo/config";

export function FeatureSpotlight() {
  const demo = useDemoModeOptional();
  const router = useRouter();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = demo?.currentSpotlight;

  useEffect(() => {
    if (!demo?.walkthroughActive || !step) {
      setTargetRect(null);
      return;
    }

    if (!window.location.pathname.startsWith(step.route.split("#")[0])) {
      router.push(step.route);
      return;
    }

    const updateRect = () => {
      const el = document.querySelector(step.selector);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTargetRect(el.getBoundingClientRect());
      } else {
        setTargetRect(null);
      }
    };

    const timer = setTimeout(updateRect, 400);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [demo?.walkthroughActive, step, router]);

  if (!demo?.walkthroughActive || !step) return null;

  const total = SPOTLIGHT_STEPS.length;
  const progress = `${Math.min(demo.spotlightIndex + 1, total)} / ${total}`;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]" role="dialog" aria-modal aria-label="Feature spotlight tour">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
          onClick={() => demo.skipSpotlight()}
        />

        {targetRect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="pointer-events-none absolute rounded-xl ring-4 ring-brand-400 ring-offset-2 ring-offset-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          />
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-1/2 z-[101] w-[min(440px,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-border/80 bg-card p-5 shadow-2xl"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-cyan-500">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-600">
                  Feature spotlight · {progress}
                </p>
                <h3 className="font-semibold">{step.title}</h3>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="Close tour"
              onClick={() => demo.skipSpotlight()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
          <div className="mt-4 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={demo.spotlightIndex === 0}
              onClick={() => demo.prevSpotlight()}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => demo.skipSpotlight()}>
                Skip tour
              </Button>
              <Button
                size="sm"
                className="bg-gradient-to-r from-brand-600 to-brand-500 text-white"
                onClick={() => demo.nextSpotlight()}
              >
                {demo.spotlightIndex >= total - 1 ? "Finish" : "Next"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
