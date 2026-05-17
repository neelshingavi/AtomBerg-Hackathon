"use client";

import { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  ReactFlowProvider,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { applyDagreLayout } from "@/lib/graph-layout";
import type { GraphViewMode, AlignmentGraphNode, AlignmentGraphEdge } from "@/lib/alignment/types";
import type { AlignmentGraphData } from "@/hooks/useAlignment";
import { alignmentNodeTypes } from "./alignment-nodes";
import { alignmentEdgeTypes } from "./alignment-edges";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { AlignmentToolbar } from "./AlignmentToolbar";
import { AlignmentInsightsPanel } from "./AlignmentInsightsPanel";
import { TimelineScrubber } from "./TimelineScrubber";
import { useNodeDetail, useAlignmentTimeline } from "@/hooks/useAlignment";
import type { NodeDetailPayload } from "@/lib/alignment/types";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function filterByViewMode(
  nodes: AlignmentGraphNode[],
  edges: AlignmentGraphEdge[],
  mode: GraphViewMode
): { nodes: AlignmentGraphNode[]; edges: AlignmentGraphEdge[] } {
  if (mode === "dependency") {
    const depEdges = edges.filter((e) => e.type === "dependency" || e.type === "risk_propagation");
    const ids = new Set<string>();
    depEdges.forEach((e) => {
      ids.add(e.source);
      ids.add(e.target);
    });
    return {
      nodes: nodes.filter(
        (n) =>
          ids.has(n.id) ||
          n.type === "strategic_objective" ||
          n.type === "shared_goal" ||
          n.type === "goal"
      ),
      edges: depEdges,
    };
  }
  if (mode === "alignment") {
    return {
      nodes: nodes.filter(
        (n) =>
          ["strategic_objective", "initiative_cluster", "shared_goal", "department", "manager"].includes(
            n.type
          ) || (n.type === "employee" && n.metrics.hasStrategicLink === true)
      ),
      edges: edges.filter(
        (e) =>
          e.type === "strategic_link" ||
          e.type === "shared_ownership" ||
          e.type === "collaboration"
      ),
    };
  }
  if (mode === "risk") {
    return { nodes, edges };
  }
  if (mode === "health") {
    return { nodes, edges };
  }
  return {
    nodes: nodes.filter((n) => n.type !== "goal"),
    edges: edges.filter((e) => e.type !== "dependency"),
  };
}

function toFlowNodes(
  graphNodes: AlignmentGraphNode[],
  positions: Map<string, { x: number; y: number }>,
  viewMode: GraphViewMode,
  selectedId: string | null,
  timelineHealth?: number
): Node[] {
  return graphNodes.map((n) => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 };
    const healthOverride =
      timelineHealth != null
        ? Math.max(20, Math.min(95, timelineHealth - (100 - n.healthScore) * 0.3))
        : n.healthScore;
    return {
      id: n.id,
      type: "alignmentNode",
      position: pos,
      data: {
        node: { ...n, healthScore: Math.round(healthOverride) },
        viewMode,
        highlighted: selectedId === n.id,
        dimmed: selectedId != null && selectedId !== n.id,
      },
    };
  });
}

function toFlowEdges(graphEdges: AlignmentGraphEdge[], viewMode: GraphViewMode): Edge[] {
  return graphEdges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: "alignmentEdge",
    animated: e.animated || e.type === "risk_propagation",
    data: {
      edgeType: e.type,
      animated: e.animated,
      isBlocked: e.isBlocked,
      label: e.label,
    },
    hidden: viewMode === "structure" && e.type === "dependency",
  }));
}

function AlignmentGraphInner({
  data,
  loading,
}: {
  data: AlignmentGraphData | undefined;
  loading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<GraphViewMode>("structure");
  const [warRoom, setWarRoom] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [detail, setDetail] = useState<NodeDetailPayload | null>(null);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [showInsights, setShowInsights] = useState(true);

  const nodeDetailMutation = useNodeDetail();
  const { data: timelineFrames = [] } = useAlignmentTimeline();

  const filtered = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    return filterByViewMode(data.nodes, data.edges, viewMode);
  }, [data, viewMode]);

  const positions = useMemo(() => {
    if (filtered.nodes.length === 0) return new Map<string, { x: number; y: number }>();
    return applyDagreLayout(filtered.nodes, filtered.edges, warRoom ? "LR" : "TB");
  }, [filtered.nodes, filtered.edges, warRoom]);

  const timelineHealth = timelineFrames[timelineIndex]?.healthScore;

  const initialNodes = useMemo(
    () =>
      toFlowNodes(filtered.nodes, positions, viewMode, selectedNodeId, timelineHealth),
    [filtered.nodes, positions, viewMode, selectedNodeId, timelineHealth]
  );
  const initialEdges = useMemo(
    () => toFlowEdges(filtered.edges, viewMode),
    [filtered.edges, viewMode]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(toFlowNodes(filtered.nodes, positions, viewMode, selectedNodeId, timelineHealth));
    setEdges(toFlowEdges(filtered.edges, viewMode));
  }, [filtered, positions, viewMode, selectedNodeId, timelineHealth, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      setSelectedNodeId(node.id);
      nodeDetailMutation.mutate(node.id, {
        onSuccess: (d) => setDetail(d),
      });
    },
    [nodeDetailMutation]
  );

  const handleExport = useCallback(async () => {
    const el = containerRef.current?.querySelector(".react-flow") as HTMLElement | null;
    if (!el) return;
    const png = await toPng(el, { backgroundColor: "#020617", pixelRatio: 2 });
    saveAs(png, `alignment-snapshot-${Date.now()}.png`);
  }, []);

  if (loading || !data) {
    return <Skeleton className="h-[600px] w-full rounded-xl" />;
  }

  return (
    <div
      ref={containerRef}
      data-alignment-graph
      className={cn(
        "relative overflow-hidden rounded-xl border border-slate-800",
        warRoom && "fixed inset-0 z-50 rounded-none border-0"
      )}
    >
      <div
        className={cn(
          "bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950",
          warRoom ? "h-screen" : "h-[min(72vh,720px)]"
        )}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={alignmentNodeTypes}
          edgeTypes={alignmentEdgeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.1}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="alignment-flow"
        >
          <Background color="#334155" gap={20} size={1} />
          <Controls className="!bg-slate-900 !border-slate-700 !shadow-xl" />
          <MiniMap
            className="!bg-slate-900/90 !border-slate-700"
            nodeColor={(n) => {
              const status = (n.data as { node?: { healthStatus: string } })?.node?.healthStatus;
              if (status === "critical") return "#ef4444";
              if (status === "warning") return "#f59e0b";
              return "#10b981";
            }}
          />
          <Panel position="top-left" className="!m-3 max-w-full">
            <AlignmentToolbar
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              warRoom={warRoom}
              onWarRoomToggle={() => setWarRoom((w) => !w)}
              timelinePlaying={timelinePlaying}
              onTimelineToggle={() => setTimelinePlaying((p) => !p)}
              onExport={handleExport}
              overallScore={data.scores.overallScore}
            />
          </Panel>
          {warRoom && (
            <Panel position="top-center" className="!mt-16">
              <div className="animate-pulse rounded-full border border-red-500/50 bg-red-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-red-400">
                War Room — Live Organizational Execution
              </div>
            </Panel>
          )}
          {timelineFrames.length > 0 && (timelinePlaying || timelineIndex > 0) && (
            <Panel position="bottom-center" className="!mb-3 w-full max-w-2xl px-4">
              <TimelineScrubber
                frames={timelineFrames}
                index={timelineIndex}
                onIndexChange={setTimelineIndex}
                playing={timelinePlaying}
                onPlayingChange={setTimelinePlaying}
              />
            </Panel>
          )}
        </ReactFlow>
      </div>

      <NodeDetailPanel
        detail={detail}
        loading={nodeDetailMutation.isPending}
        onClose={() => {
          setDetail(null);
          setSelectedNodeId(null);
        }}
      />

      {!warRoom && showInsights && (
        <aside className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 lg:absolute lg:bottom-4 lg:left-4 lg:mt-0 lg:max-w-xs lg:bg-slate-950/95">
          <button
            type="button"
            className="mb-2 text-xs text-slate-500 hover:text-slate-300 lg:hidden"
            onClick={() => setShowInsights(false)}
          >
            Hide insights
          </button>
          <AlignmentInsightsPanel scores={data.scores} />
        </aside>
      )}
    </div>
  );
}

export function AlignmentGraphCanvas(props: {
  data: AlignmentGraphData | undefined;
  loading: boolean;
}) {
  return (
    <ReactFlowProvider>
      <AlignmentGraphInner {...props} />
    </ReactFlowProvider>
  );
}
