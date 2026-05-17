"use client";

import { cn } from "@/lib/utils";
import type { GraphViewMode } from "@/lib/alignment/types";
import {
  GitBranch,
  HeartPulse,
  LayoutGrid,
  Link2,
  AlertTriangle,
  Target,
  Maximize2,
  Download,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const MODES: { id: GraphViewMode; label: string; icon: React.ElementType }[] = [
  { id: "structure", label: "Structure", icon: LayoutGrid },
  { id: "health", label: "Health", icon: HeartPulse },
  { id: "risk", label: "Risk", icon: AlertTriangle },
  { id: "alignment", label: "Alignment", icon: Target },
  { id: "dependency", label: "Dependencies", icon: Link2 },
];

export function AlignmentToolbar({
  viewMode,
  onViewModeChange,
  warRoom,
  onWarRoomToggle,
  timelinePlaying,
  onTimelineToggle,
  onExport,
  overallScore,
}: {
  viewMode: GraphViewMode;
  onViewModeChange: (mode: GraphViewMode) => void;
  warRoom: boolean;
  onWarRoomToggle: () => void;
  timelinePlaying: boolean;
  onTimelineToggle: () => void;
  onExport: () => void;
  overallScore?: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/90 px-3 py-2 backdrop-blur-md">
      <div className="flex flex-wrap gap-1">
        {MODES.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onViewModeChange(m.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all",
                viewMode === m.id
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-1 h-6 w-px bg-slate-700" />

      {overallScore != null && (
        <div className="flex items-center gap-1.5 rounded-lg bg-slate-900 px-2.5 py-1 text-xs">
          <GitBranch className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-slate-500">Alignment</span>
          <span className="font-semibold tabular-nums text-emerald-400">{overallScore}</span>
        </div>
      )}

      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-slate-400"
        onClick={onTimelineToggle}
      >
        {timelinePlaying ? <Pause className="mr-1 h-3.5 w-3.5" /> : <Play className="mr-1 h-3.5 w-3.5" />}
        Timeline
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn("h-8 text-xs", warRoom && "bg-red-500/20 text-red-400")}
        onClick={onWarRoomToggle}
      >
        <Maximize2 className="mr-1 h-3.5 w-3.5" />
        War Room
      </Button>

      <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-400" onClick={onExport}>
        <Download className="mr-1 h-3.5 w-3.5" />
        Export
      </Button>
    </div>
  );
}
