"use client";

import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TimelineFrame } from "@/lib/alignment/types";

export function TimelinePlayback({
  frames,
  currentIndex,
  isPlaying,
  onIndexChange,
  onTogglePlay,
}: {
  frames: TimelineFrame[];
  currentIndex: number;
  isPlaying: boolean;
  onIndexChange: (i: number) => void;
  onTogglePlay: () => void;
}) {
  if (!frames.length) return null;
  const frame = frames[currentIndex];

  return (
    <div className="rounded-xl border bg-card/90 px-4 py-3 backdrop-blur">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Execution replay
        </span>
        <Button variant="outline" size="sm" className="h-7 gap-1" onClick={onTogglePlay}>
          {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
      </div>
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={currentIndex}
        onChange={(e) => onIndexChange(Number(e.target.value))}
        className="w-full accent-brand-600"
      />
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{frame?.label}</span>
        <span>
          Health {frame?.healthScore} · Alignment {frame?.alignmentScore} ·{" "}
          {frame?.atRiskCount} at-risk
        </span>
      </div>
    </div>
  );
}

