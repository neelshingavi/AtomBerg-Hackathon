import type { OperationalEventType, PresenceStatus } from "@prisma/client";

export type RealtimeEventPayload = {
  version: string;
  lastEvent: string | null;
  timestamp: string;
  pendingApprovals: number;
  unreadNotifications: number;
  activeEscalations: number;
  recentActivityAt: string | null;
  onlineCount?: number;
};

export type StreamMessage =
  | { type: "connected"; version: string }
  | { type: "update"; payload: RealtimeEventPayload }
  | { type: "event"; event: LiveStreamEvent }
  | { type: "heartbeat" };

export type LiveStreamEvent = {
  id: string;
  eventType: OperationalEventType;
  title: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  actorName?: string;
  departmentName?: string;
  href?: string;
  createdAt: string;
};

export type PresenceUser = {
  userId: string;
  name: string;
  status: PresenceStatus;
  currentView?: string;
  department?: string;
  lastSeenAt: string;
};

export type OperationalAlertItem = {
  id: string;
  alertType: string;
  title: string;
  message: string;
  severity: string;
  status: string;
  recommendation?: string;
  affectedDepartments?: string[];
  createdAt: string;
  acknowledgedAt?: string;
};

export type CollaborationInsight = {
  id: string;
  title: string;
  body: string;
  trend: "positive" | "warning" | "critical";
  metric?: string;
};

export type CommandCenterLive = {
  pulse: {
    overallScore: number;
    trend: string;
    escalations: number;
    pendingApprovals: number;
    alignmentScore: number;
    momentum: number;
  };
  alerts: OperationalAlertItem[];
  recentEvents: LiveStreamEvent[];
  presence: PresenceUser[];
  approvalVelocity: { avgHours: number; bottleneckCount: number };
  collaborationInsights: CollaborationInsight[];
  initiatives: Array<{
    id: string;
    title: string;
    momentum: string;
    blockers: number;
  }>;
};
