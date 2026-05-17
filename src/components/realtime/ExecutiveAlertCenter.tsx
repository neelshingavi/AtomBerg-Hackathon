"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOperationalAlerts, useAcknowledgeAlert } from "@/hooks/useOperationalAlerts";
import { LivePulseIndicator } from "./LivePulseIndicator";
import { cn } from "@/lib/utils";

const SEV: Record<string, string> = {
  CRITICAL: "border-red-500/40 bg-red-500/10",
  HIGH: "border-orange-500/30 bg-orange-500/10",
  MEDIUM: "border-amber-500/30 bg-amber-500/10",
  LOW: "border-slate-300 bg-muted/30",
};

export function ExecutiveAlertCenter({ compact }: { compact?: boolean }) {
  const { data: alerts } = useOperationalAlerts();
  const ack = useAcknowledgeAlert();

  return (
    <section className="space-y-3" data-executive-alerts>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <h3 className="text-sm font-semibold">Live executive alerts</h3>
        </div>
        <LivePulseIndicator label={`${alerts?.length ?? 0} active`} />
      </div>

      <AnimatePresence mode="popLayout">
        <ul className={cn("space-y-2", compact && "max-h-64 overflow-y-auto")}>
          {alerts?.map((a) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className={cn("rounded-lg border p-3", SEV[a.severity] ?? SEV.MEDIUM)}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="mb-1 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px]">
                      {a.alertType.replace(/_/g, " ")}
                    </Badge>
                    <Badge variant="destructive" className="text-[9px]">
                      {a.severity}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">{a.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{a.message}</p>
                  {a.recommendation && (
                    <p className="mt-2 text-xs font-medium text-violet-700 dark:text-violet-300">
                      → {a.recommendation}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-7"
                  disabled={ack.isPending}
                  onClick={() => ack.mutate(a.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              </div>
            </motion.li>
          ))}
          {!alerts?.length && (
            <li className="text-sm text-muted-foreground">No active operational alerts.</li>
          )}
        </ul>
      </AnimatePresence>
    </section>
  );
}
