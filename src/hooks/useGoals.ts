"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GoalStatus } from "@prisma/client";

export type GoalSheetSummary = {
  id: string;
  status: GoalStatus;
  isLocked: boolean;
  submittedAt: string | null;
  approvedAt: string | null;
  totalWeightage: number;
  goalsCount: number;
  employee: {
    id: string;
    name: string;
    employeeCode: string;
    department: { name: string };
  };
  cycle: { id: string; name: string; currentPhase: string };
  goals: Array<{
    id: string;
    title: string;
    description: string | null;
    weightage: number;
    uomType: string;
    plannedTarget: number;
    targetDeadline: string | null;
    unit: string | null;
    isShared: boolean;
    isTitleLocked: boolean;
    isTargetLocked: boolean;
    thrustArea: { id: string; name: string; color: string };
  }>;
};

async function parseResponse(res: Response) {
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Request failed");
  return json.data;
}

export function useGoalSheets(params?: {
  cycleId?: string;
  status?: GoalStatus;
  employeeId?: string;
}) {
  const qs = new URLSearchParams();
  if (params?.cycleId) qs.set("cycleId", params.cycleId);
  if (params?.status) qs.set("status", params.status);
  if (params?.employeeId) qs.set("employeeId", params.employeeId);

  return useQuery({
    queryKey: ["goalSheets", params],
    queryFn: async () => {
      const res = await fetch(`/api/goals?${qs.toString()}`);
      const data = await parseResponse(res);
      return data as {
        goalSheets: GoalSheetSummary[];
        pagination: { page: number; limit: number; total: number };
      };
    },
  });
}

export function useGoalSheet(sheetId: string | undefined) {
  return useQuery({
    queryKey: ["goalSheet", sheetId],
    enabled: Boolean(sheetId),
    queryFn: async () => {
      const res = await fetch(`/api/goals/${sheetId}`);
      const data = await parseResponse(res);
      return data.goalSheet as GoalSheetSummary;
    },
  });
}

export function useThrustAreas() {
  return useQuery({
    queryKey: ["thrustAreas"],
    queryFn: async () => {
      const res = await fetch("/api/thrust-areas");
      const data = await parseResponse(res);
      return data.thrustAreas as Array<{
        id: string;
        name: string;
        color: string;
        description: string | null;
      }>;
    },
  });
}

export function usePendingApprovalsCount() {
  return useQuery({
    queryKey: ["goalSheets", { status: "SUBMITTED", pendingCount: true }],
    queryFn: async () => {
      const res = await fetch("/api/goals?status=SUBMITTED&limit=1");
      const data = await parseResponse(res);
      return (data as { pagination: { total: number } }).pagination.total;
    },
  });
}

export function useSubmitGoalSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (sheetId: string) => {
      const res = await fetch(`/api/goals/${sheetId}/submit`, { method: "POST" });
      return parseResponse(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["goalSheets"] });
      void qc.invalidateQueries({ queryKey: ["goalSheet"] });
    },
  });
}

export function useApproveGoalSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      sheetId: string;
      managerNote?: string;
      inlineEdits?: Array<{
        goalId: string;
        weightage?: number;
        plannedTarget?: number;
      }>;
    }) => {
      const res = await fetch(`/api/goals/${payload.sheetId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          managerNote: payload.managerNote,
          inlineEdits: payload.inlineEdits,
        }),
      });
      return parseResponse(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["goalSheets"] });
      void qc.invalidateQueries({ queryKey: ["goalSheet"] });
    },
  });
}

export function useRejectGoalSheet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { sheetId: string; managerNote: string }) => {
      const res = await fetch(`/api/goals/${payload.sheetId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ managerNote: payload.managerNote }),
      });
      return parseResponse(res);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["goalSheets"] });
    },
  });
}
