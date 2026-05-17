"use client";

import { useEffect } from "react";
import type { TimelineFrame } from "@/lib/alignment/types";

export function TimelineScrubber({
  frames,
  index,
  onIndexChange,
  playing,
  onPlayingChange,
}: {
  frames: TimelineFrame[];
  index: number;
  onIndexChange: (i: number) => void;
  playing: boolean;
  onPlayingChange: (p: boolean) => void;
}) {
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const timer = setInterval(() => {
      onIndexChange((index + 1) % frames.length);
    }, 2000);
    return () => clearInterval(timer);
  }, [playing, index, frames.length, onIndexChange]);

  const frame = frames[index];
  if (!frame) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/90 px-4 py-3 backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-300">Execution Replay — {frame.label}</span>
        <span className="tabular-nums text-slate-500">
          Health {frame.healthScore} · Alignment {frame.alignmentScore}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={Math.max(0, frames.length - 1)}
        value={index}
        onChange={(e) => {
          onPlayingChange(false);
          onIndexChange(Number(e.target.value));
        }}
        className="w-full accent-brand-500"
      />
      <div className="mt-2 flex justify-between text-[10px] text-slate-600">
        {frames.map((f, i) => (
          <span key={f.timestamp} className={i === index ? "text-brand-400" : ""}>
            {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}
