"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ONBOARDING_TASKS } from "@/lib/demo/config";
import { useDemoModeOptional } from "@/contexts/DemoModeContext";
import { useState } from "react";

export function OnboardingChecklist() {
  const demo = useDemoModeOptional();
  const [dismissed, setDismissed] = useState(false);

  if (!demo?.enabled || dismissed || demo.onboardingProgress >= 100) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        className="fixed bottom-4 right-4 z-40 w-72 max-w-[calc(100vw-2rem)]"
      >
        <Card className="border-brand-500/20 shadow-xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-sm font-semibold">Getting started</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {demo.onboardingProgress}% complete
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label="Dismiss checklist"
              onClick={() => setDismissed(true)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <Progress value={demo.onboardingProgress} className="h-1.5" />
            <ul className="space-y-2">
              {ONBOARDING_TASKS.map((task) => {
                const done = demo.completedTasks.has(task.id);
                return (
                  <li key={task.id} className="flex items-center gap-2 text-xs">
                    {done ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    )}
                    {task.path ? (
                      <Link
                        href={task.path}
                        className={done ? "text-muted-foreground line-through" : "hover:text-brand-600"}
                      >
                        {task.label}
                      </Link>
                    ) : (
                      <span className={done ? "text-muted-foreground line-through" : ""}>
                        {task.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <Button
              size="sm"
              className="w-full gap-2 bg-gradient-to-r from-brand-600 to-brand-500 text-white"
              onClick={() => demo.startWalkthrough()}
            >
              <Play className="h-3.5 w-3.5" />
              Start feature tour
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
