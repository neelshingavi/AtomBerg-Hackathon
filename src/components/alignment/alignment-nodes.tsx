"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { healthColor } from "@/lib/alignment/health";
import type { HealthStatus } from "@/lib/alignment/types";
import type { AlignmentNodeData } from "./types";

const TYPE_STYLES: Record<string, string> = {
  strategic_objective:
    "min-w-[200px] border-2 border-violet-400/60 bg-gradient-to-br from-violet-950/90 to-indigo-900/80 shadow-lg shadow-violet-500/20",
  initiative_cluster:
    "min-w-[180px] border border-cyan-400/40 bg-gradient-to-br from-cyan-950/80 to-slate-900/90",
  shared_goal:
    "min-w-[160px] border border-emerald-400/50 bg-gradient-to-br from-emerald-950/70 to-slate-900/90",
  department: "min-w-[150px] border border-slate-500/50 bg-slate-900/95",
  manager: "min-w-[130px] border border-blue-500/40 bg-slate-900/90",
  employee: "min-w-[110px] border border-slate-600/40 bg-slate-900/85 text-xs",
  goal: "min-w-[120px] border border-slate-700/50 bg-slate-950/90 text-[10px]",
};

function StatusRing({ status, pulse }: { status: HealthStatus; pulse?: boolean }) {
  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-900",
        pulse && "animate-pulse"
      )}
      style={{ backgroundColor: healthColor(status) }}
    />
  );
}

function AlignmentNodeCard({ data }: NodeProps) {
  const d = data as AlignmentNodeData;
  const { node, viewMode, highlighted, dimmed } = d;
  const style = TYPE_STYLES[node.type] ?? TYPE_STYLES.goal;
  const showHealth = viewMode === "health" || viewMode === "risk";

  return (
    <div
      className={cn(
        "relative rounded-xl px-3 py-2 transition-all duration-300",
        style,
        highlighted && "scale-105 ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-950",
        dimmed && "opacity-30",
        node.isBottleneck && "ring-2 ring-amber-500/70",
        node.isPropagatingRisk && "shadow-[0_0_20px_rgba(239,68,68,0.4)]"
      )}
    >
      <Handle type="target" position={Position.Top} className="!h-2 !w-2 !bg-slate-500" />
      <StatusRing
        status={node.healthStatus}
        pulse={(viewMode === "risk" && !!node.isAtRisk) || !!node.isPropagatingRisk}
      />
      <p className="max-w-[180px] truncate font-semibold leading-tight text-white">{node.label}</p>
      {node.subtitle && (
        <p className="mt-0.5 truncate text-[10px] text-slate-400">{node.subtitle}</p>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        {showHealth && (
          <span
            className="text-[10px] font-medium tabular-nums"
            style={{ color: healthColor(node.healthStatus) }}
          >
            {node.healthScore}
          </span>
        )}
        <span className="text-[10px] tabular-nums text-slate-500">{node.progressPct}%</span>
      </div>
      {node.isBottleneck && (
        <span className="mt-1 inline-block rounded bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-medium text-amber-400">
          Bottleneck
        </span>
      )}
      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2 !bg-slate-500" />
    </div>
  );
}

export const alignmentNodeTypes = {
  alignmentNode: memo(AlignmentNodeCard),
};
