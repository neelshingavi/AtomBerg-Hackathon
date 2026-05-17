export type GraphNodeType =
  | "strategic_objective"
  | "initiative_cluster"
  | "shared_goal"
  | "department"
  | "manager"
  | "employee"
  | "goal";

export type GraphEdgeType =
  | "strategic_link"
  | "org_hierarchy"
  | "shared_ownership"
  | "dependency"
  | "collaboration"
  | "risk_propagation";

export type GraphViewMode = "structure" | "health" | "risk" | "alignment" | "dependency";

export type HealthStatus = "healthy" | "warning" | "critical" | "blocker";

export type AlignmentGraphNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  healthScore: number;
  healthStatus: HealthStatus;
  progressPct: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  metrics: Record<string, number | string | boolean>;
  parentId?: string;
  clusterId?: string;
  isAtRisk?: boolean;
  isBottleneck?: boolean;
  isPropagatingRisk?: boolean;
  entityId?: string;
  hidden?: boolean;
};

export type AlignmentGraphEdge = {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label?: string;
  dependencyType?: string;
  isBlocked?: boolean;
  isCriticalPath?: boolean;
  animated?: boolean;
  strength?: number;
};

export type AlignmentGraphPayload = {
  nodes: AlignmentGraphNode[];
  edges: AlignmentGraphEdge[];
  clusters: Array<{ id: string; label: string; nodeIds: string[] }>;
  meta: {
    cycleId: string;
    cycleName: string;
    generatedAt: string;
    nodeCount: number;
    edgeCount: number;
  };
};

export type AlignmentScores = {
  overallScore: number;
  strategicLinkage: number;
  crossFunctionalCollaboration: number;
  orphanGoalRate: number;
  siloIndex: number;
  dependencyHealth: number;
  contributionCoverage: number;
  insights: string[];
  bottlenecks: BottleneckItem[];
};

export type BottleneckItem = {
  id: string;
  type: "manager" | "dependency" | "strategic" | "team" | "approval";
  title: string;
  description: string;
  severity: "high" | "medium" | "low";
  nodeId?: string;
};

export type TimelineFrame = {
  timestamp: string;
  label: string;
  healthScore: number;
  atRiskCount: number;
  escalationCount: number;
  alignmentScore: number;
  affectedNodeIds: string[];
};

export type NodeDetailPayload = {
  node: AlignmentGraphNode;
  kpis: Array<{ label: string; value: string | number; trend?: "up" | "down" | "flat" }>;
  escalations: Array<{ id: string; title: string; status: string; createdAt: string }>;
  dependencies: Array<{ id: string; title: string; type: string; direction: "in" | "out" }>;
  relatedGoals: Array<{ id: string; title: string; progressPct: number; status: string }>;
  insights: string[];
  recommendations: string[];
  activity: Array<{ label: string; at: string }>;
};

export const STRATEGIC_INITIATIVES = [
  {
    id: "init-digital",
    label: "Digital Transformation",
    thrustAreaIds: ["ta-innovation", "ta-efficiency"],
    color: "#8b5cf6",
  },
  {
    id: "init-cost",
    label: "Cost Optimization",
    thrustAreaIds: ["ta-efficiency", "ta-quality"],
    color: "#06b6d4",
  },
  {
    id: "init-workforce",
    label: "Workforce Expansion",
    thrustAreaIds: ["ta-people", "ta-business-growth"],
    color: "#ec4899",
  },
  {
    id: "init-innovation",
    label: "Innovation Strategy",
    thrustAreaIds: ["ta-innovation", "ta-business-growth"],
    color: "#f59e0b",
  },
] as const;
