"use client";

import { useState } from "react";
import type { UoMType } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProgressScore } from "@/components/checkins/ProgressScore";
import type { AchievementGoal } from "@/hooks/useAchievements";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not started" },
  { value: "ON_TRACK", label: "On track" },
  { value: "AT_RISK", label: "At risk" },
  { value: "COMPLETED", label: "Completed" },
] as const;

export type AchievementFormValue = {
  goalId: string;
  actualValue?: number | null;
  completionDate?: string | null;
  status: "NOT_STARTED" | "ON_TRACK" | "AT_RISK" | "COMPLETED";
  remark?: string | null;
};

function uomLabel(uom: string) {
  return uom.replace(/_/g, " ").toLowerCase();
}

export function AchievementForm({
  goal,
  quarter,
  disabled,
  value,
  onChange,
}: {
  goal: AchievementGoal;
  quarter: string;
  disabled?: boolean;
  value: AchievementFormValue;
  onChange: (v: AchievementFormValue) => void;
}) {
  const existing = goal.achievements.find((a) => a.quarter === quarter);
  const [actualValue, setActualValue] = useState<string>(
    value.actualValue?.toString() ?? existing?.actualValue?.toString() ?? ""
  );
  const [completionDate, setCompletionDate] = useState(
    value.completionDate?.slice(0, 10) ??
      existing?.completionDate?.slice(0, 10) ??
      ""
  );
  const [status, setStatus] = useState<AchievementFormValue["status"]>(
    value.status ?? (existing?.status as AchievementFormValue["status"]) ?? "NOT_STARTED"
  );
  const [remark, setRemark] = useState(value.remark ?? existing?.remark ?? "");

  function emit(
    patch: Partial<{
      actualValue: string;
      completionDate: string;
      status: AchievementFormValue["status"];
      remark: string;
    }>
  ) {
    const av = patch.actualValue !== undefined ? patch.actualValue : actualValue;
    const cd = patch.completionDate !== undefined ? patch.completionDate : completionDate;
    const st = patch.status !== undefined ? patch.status : status;
    const rm = patch.remark !== undefined ? patch.remark : remark;
    onChange({
      goalId: goal.id,
      actualValue: av === "" ? null : Number(av),
      completionDate: cd || null,
      status: st,
      remark: rm || null,
    });
  }

  const parsedActual = actualValue === "" ? null : Number(actualValue);
  const isTimeline = goal.uomType === "TIMELINE";
  const isZeroBased = goal.uomType === "ZERO_BASED";

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">{goal.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {goal.thrustArea.name} · Weightage {goal.weightage}%
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground shrink-0">
            {uomLabel(goal.uomType)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Planned target:{" "}
          <span className="font-medium">
            {goal.plannedTarget} {goal.unit ?? ""}
          </span>
        </p>

        {!isTimeline && (
          <div className="space-y-2">
            <Label>Actual achievement</Label>
            <Input
              type="number"
              step="any"
              disabled={disabled}
              value={actualValue}
              onChange={(e) => {
                setActualValue(e.target.value);
                emit({ actualValue: e.target.value });
              }}
              placeholder={isZeroBased ? "0 = success" : "Enter actual"}
            />
          </div>
        )}

        {isTimeline && (
          <div className="space-y-2">
            <Label>Completion date</Label>
            <Input
              type="date"
              disabled={disabled}
              value={completionDate}
              onChange={(e) => {
                setCompletionDate(e.target.value);
                emit({ completionDate: e.target.value });
              }}
            />
            {goal.targetDeadline && (
              <p className="text-xs text-muted-foreground">
                Deadline: {new Date(goal.targetDeadline).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer",
                  status === opt.value && "border-brand-500 bg-brand-50/50",
                  disabled && "opacity-60 pointer-events-none"
                )}
              >
                <input
                  type="radio"
                  name={`status-${goal.id}`}
                  checked={status === opt.value}
                  disabled={disabled}
                  onChange={() => {
                    setStatus(opt.value);
                    emit({ status: opt.value });
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <ProgressScore
          input={{
            uomType: goal.uomType as UoMType,
            plannedTarget: goal.plannedTarget,
            actualValue: parsedActual,
            targetDeadline: goal.targetDeadline ? new Date(goal.targetDeadline) : null,
            completionDate: completionDate ? new Date(completionDate) : null,
          }}
        />

        <div className="space-y-2">
          <Label>Remark (optional)</Label>
          <Textarea
            rows={2}
            disabled={disabled}
            value={remark}
            onChange={(e) => {
              setRemark(e.target.value);
              emit({ remark: e.target.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
