"use client";

import { memo } from "react";
import { BaseEdge, getBezierPath, type EdgeProps } from "@xyflow/react";

export type AlignmentEdgeData = {
  edgeType?: string;
  animated?: boolean;
  isBlocked?: boolean;
  label?: string;
};

function AlignmentEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const d = (data ?? {}) as AlignmentEdgeData;
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  const stroke =
    d.edgeType === "risk_propagation"
      ? "#ef4444"
      : d.isBlocked
        ? "#f97316"
        : d.edgeType === "dependency"
          ? "#a855f7"
          : d.edgeType === "collaboration"
            ? "#06b6d4"
            : "#64748b";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke,
          strokeWidth: d.isBlocked || d.edgeType === "risk_propagation" ? 2.5 : 1.5,
          strokeDasharray: d.edgeType === "dependency" ? "6 4" : undefined,
        }}
        className={d.animated ? "alignment-edge-animated" : undefined}
      />
    </>
  );
}

export const alignmentEdgeTypes = {
  alignmentEdge: memo(AlignmentEdge),
};
