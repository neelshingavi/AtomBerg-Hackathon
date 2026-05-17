"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Radio, Gauge, Zap, Users, Clock } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCommandCenterLive } from "@/hooks/useCommandCenterLive";
import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { LivePulseIndicator } from "./LivePulseIndicator";
import { PresenceAvatars } from "./PresenceAvatars";
import { LiveActivityStream } from "./LiveActivityStream";
import { ExecutiveAlertCenter } from "./ExecutiveAlertCenter";
import { IncidentResponsePanel } from "./IncidentResponsePanel";
import { OperationalTimeline } from "./OperationalTimeline";
import { cn } from "@/lib/utils";

export function LiveCommandCenterDashboard({ warRoom }: { warRoom?: boolean }) {
  const { data, isLoading } = useCommandCenterLive();
  const [incidentMode, setIncidentMode] = useState(false);
  usePresenceHeartbeat(warRoom ? "war-room" : "command-center");

  if (isLoading || !data) {
    return <Skeleton className="h-[70vh] w-full rounded-xl" />;
  }

  return (
    <motion.div
      className={cn(
        "space-y-6",
        warRoom && "min-h-screen bg-slate-950 p-6 text-white"
      )}
      data-command-center
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Radio className={cn("h-5 w-5", warRoom ? "text-red-400 animate-pulse" : "text-emerald-500")} />
            <h1 className={cn("text-2xl font-bold", warRoom && "text-white")}>
              {warRoom ? "Live War Room" : "Operations Command Center"}
            </h1>
            <LivePulseIndicator />
          </div>
          <p className={cn("text-sm", warRoom ? "text-slate-400" : "text-muted-foreground")}>
            Real-time organizational pulse · live approvals · AI monitoring
          </p>
          <PresenceAvatars className="mt-3" max={10} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={incidentMode ? "destructive" : "outline"}
            size="sm"
            onClick={() => setIncidentMode((v) => !v)}
          >
            {incidentMode ? "Exit incident mode" : "Incident response"}
          </Button>
          <Link
            href="/admin/briefing"
            className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
          >
            Executive briefing →
          </Link>
        </div>
      </header>

      {incidentMode && <IncidentResponsePanel alerts={data.alerts} pulse={data.pulse} />}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <PulseCard icon={Gauge} label="Org health" value={`${data.pulse.overallScore}`} warRoom={warRoom} />
        <PulseCard icon={Zap} label="Momentum" value={`${data.pulse.momentum}`} warRoom={warRoom} />
        <PulseCard icon={Clock} label="Pending approvals" value={String(data.pulse.pendingApprovals)} warRoom={warRoom} />
        <PulseCard icon={Radio} label="Escalations" value={String(data.pulse.escalations)} warRoom={warRoom} />
        <PulseCard icon={Users} label="Avg wait (h)" value={String(data.approvalVelocity.avgHours)} warRoom={warRoom} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className={cn(warRoom && "border-white/10 bg-slate-900/60")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Live activity</CardTitle>
          </CardHeader>
          <CardContent>
            <LiveActivityStream limit={12} compact />
          </CardContent>
        </Card>

        <Card className={cn(warRoom && "border-white/10 bg-slate-900/60")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Executive alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <ExecutiveAlertCenter compact />
          </CardContent>
        </Card>

        <Card className={cn(warRoom && "border-white/10 bg-slate-900/60")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Collaboration intelligence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.collaborationInsights.map((ins) => (
              <div
                key={ins.id}
                className={cn(
                  "rounded-lg border p-2 text-xs",
                  ins.trend === "warning" && "border-amber-500/30 bg-amber-500/5",
                  ins.trend === "positive" && "border-emerald-500/30 bg-emerald-500/5"
                )}
              >
                <p className="font-medium">{ins.title}</p>
                <p className="mt-1 text-muted-foreground">{ins.body}</p>
              </div>
            ))}
            <div className="border-t pt-3">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                Strategic initiatives
              </p>
              {data.initiatives.map((i) => (
                <div key={i.id} className="flex justify-between py-1 text-xs">
                  <span className="truncate pr-2">{i.title}</span>
                  <span className={i.momentum === "On track" ? "text-emerald-600" : "text-amber-600"}>
                    {i.momentum}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <OperationalTimeline />
    </motion.div>
  );
}

function PulseCard({
  icon: Icon,
  label,
  value,
  warRoom,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  warRoom?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 text-center",
        warRoom ? "border-white/10 bg-slate-900/80" : "bg-card"
      )}
    >
      <Icon className={cn("mx-auto h-4 w-4", warRoom ? "text-brand-400" : "text-muted-foreground")} />
      <p className={cn("mt-2 text-2xl font-bold tabular-nums", warRoom && "text-white")}>{value}</p>
      <p className={cn("text-[10px] uppercase tracking-wide", warRoom ? "text-slate-500" : "text-muted-foreground")}>
        {label}
      </p>
    </div>
  );
}
