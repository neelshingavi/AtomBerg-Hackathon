"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { UoMType } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WeightageBar } from "@/components/goals/WeightageBar";
import { UoMSelector } from "@/components/goals/UoMSelector";
import { useThrustAreas } from "@/hooks/useGoals";
import { validateSubmission, validateWeightage } from "@/lib/calculations/weightage";
import { uomTypeSchema } from "@/lib/validations/goal.schema";
import { Plus, Trash2 } from "lucide-react";

const goalFieldSchema = z.object({
  id: z.string().optional(),
  thrustAreaId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  uomType: uomTypeSchema,
  plannedTarget: z.number(),
  targetDeadline: z.string().optional(),
  unit: z.string().optional(),
  weightage: z.number().min(0).max(100),
  isShared: z.boolean().optional(),
  isTitleLocked: z.boolean().optional(),
  isTargetLocked: z.boolean().optional(),
});

const formSchema = z.object({
  cycleId: z.string().min(1),
  goals: z.array(goalFieldSchema).min(1).max(8),
});

type FormValues = z.infer<typeof formSchema>;
export type GoalFormGoal = FormValues["goals"][number];

const defaultGoal = {
  thrustAreaId: "",
  title: "",
  description: "",
  uomType: "NUMERIC_MIN" as UoMType,
  plannedTarget: 0,
  targetDeadline: "",
  unit: "",
  weightage: 10,
};

export function GoalSheetForm({
  cycleId,
  cycleName,
  existingSheetId,
  initialGoals,
  readOnly,
  onSaved,
}: {
  cycleId: string;
  cycleName: string;
  existingSheetId?: string;
  initialGoals?: GoalFormGoal[];
  readOnly?: boolean;
  onSaved?: () => void;
}) {
  const router = useRouter();
  const { data: thrustAreas } = useThrustAreas();
  const initialIds = new Set(initialGoals?.map((g) => g.id).filter(Boolean) as string[]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cycleId,
      goals: initialGoals?.length ? initialGoals : [{ ...defaultGoal }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "goals" });
  const goals = form.watch("goals");

  const weightageGoals = goals.map((g, i) => ({
    title: g.title || `Goal ${i + 1}`,
    weightage: Number(g.weightage) || 0,
    color: thrustAreas?.find((t) => t.id === g.thrustAreaId)?.color,
  }));

  async function persistExistingSheet(values: FormValues, submit: boolean) {
    if (!existingSheetId) return;

    const currentIds = new Set(
      values.goals.map((g) => g.id).filter(Boolean) as string[]
    );

    for (const id of Array.from(initialIds)) {
      if (!currentIds.has(id)) {
        const del = await fetch(`/api/goals/${existingSheetId}/goals/${id}`, {
          method: "DELETE",
        });
        const delJson = await del.json();
        if (!delJson.success) throw new Error(delJson.error);
      }
    }

    for (const goal of values.goals) {
      const payload = {
        thrustAreaId: goal.thrustAreaId,
        title: goal.title,
        description: goal.description || undefined,
        uomType: goal.uomType,
        plannedTarget: Number(goal.plannedTarget),
        targetDeadline: goal.targetDeadline || undefined,
        unit: goal.unit || undefined,
        weightage: Number(goal.weightage),
      };

      if (goal.id) {
        const patchBody: Record<string, unknown> = {};
        if (!goal.isTitleLocked) patchBody.title = payload.title;
        if (!goal.isTargetLocked) {
          patchBody.plannedTarget = payload.plannedTarget;
          patchBody.uomType = payload.uomType;
          patchBody.unit = payload.unit;
          patchBody.targetDeadline = payload.targetDeadline;
        }
        if (!goal.isShared) {
          Object.assign(patchBody, payload);
        } else {
          patchBody.weightage = payload.weightage;
        }

        const res = await fetch(`/api/goals/${goal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      } else {
        const res = await fetch(`/api/goals/${existingSheetId}/goals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }
    }

    if (submit) {
      const sub = await fetch(`/api/goals/${existingSheetId}/submit`, { method: "POST" });
      const subJson = await sub.json();
      if (!subJson.success) throw new Error(subJson.error);
      toast.success("Submitted for approval");
    } else {
      toast.success("Changes saved");
    }

    onSaved?.();
    router.refresh();
  }

  async function saveGoals(submit: boolean) {
    const valid = await form.trigger();
    if (!valid) {
      toast.error("Please fix form errors before saving");
      return;
    }

    const values = form.getValues();
    const check = submit
      ? validateSubmission(values.goals.map((g) => ({ title: g.title, weightage: Number(g.weightage) })))
      : validateWeightage(values.goals.map((g) => ({ title: g.title, weightage: Number(g.weightage) })));

    if (!check.isValid) {
      toast.error(check.errors[0]);
      return;
    }

    try {
      if (!existingSheetId) {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cycleId: values.cycleId,
            goals: values.goals.map((g) => ({
              thrustAreaId: g.thrustAreaId,
              title: g.title,
              description: g.description,
              uomType: g.uomType,
              plannedTarget: Number(g.plannedTarget),
              targetDeadline: g.targetDeadline || undefined,
              unit: g.unit,
              weightage: Number(g.weightage),
            })),
          }),
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
        const sheetId = json.data.goalSheet.id as string;

        if (submit) {
          const sub = await fetch(`/api/goals/${sheetId}/submit`, { method: "POST" });
          const subJson = await sub.json();
          if (!subJson.success) throw new Error(subJson.error);
          toast.success("Goal sheet submitted for approval");
        } else {
          toast.success("Goal sheet saved as draft");
        }
        router.push(`/employee/goals/${sheetId}`);
        router.refresh();
        return;
      }

      await persistExistingSheet(values, submit);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    }
  }

  return (
    <form className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cycle: {cycleName}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Up to 8 goals · minimum 10% weightage each · 100% total to submit
            </p>
          </CardHeader>
        </Card>

        {fields.map((field, index) => {
          const uom = form.watch(`goals.${index}.uomType`);
          const goalMeta = goals[index];
          const titleLocked = readOnly || goalMeta?.isTitleLocked;
          const targetLocked = readOnly || goalMeta?.isTargetLocked;
          const shared = goalMeta?.isShared;

          return (
            <Card key={field.id}>
              <CardHeader className="flex flex-row items-center justify-between py-4">
                <CardTitle className="text-base">
                  Goal #{index + 1}
                  {shared && (
                    <span className="ml-2 text-xs font-normal text-amber-600">Shared</span>
                  )}
                </CardTitle>
                {!readOnly && !shared && fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Thrust area</Label>
                  <Select
                    disabled={readOnly || shared}
                    value={form.watch(`goals.${index}.thrustAreaId`)}
                    onValueChange={(v) => {
                      if (v) form.setValue(`goals.${index}.thrustAreaId`, v);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select thrust area" />
                    </SelectTrigger>
                    <SelectContent>
                      {thrustAreas?.map((ta) => (
                        <SelectItem key={ta.id} value={ta.id}>
                          {ta.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input disabled={titleLocked} {...form.register(`goals.${index}.title`)} />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    disabled={readOnly || shared}
                    rows={2}
                    {...form.register(`goals.${index}.description`)}
                  />
                </div>

                <UoMSelector
                  value={uom}
                  disabled={targetLocked}
                  onChange={(v) => form.setValue(`goals.${index}.uomType`, v)}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Target</Label>
                    <Input
                      type="number"
                      step="any"
                      disabled={targetLocked}
                      {...form.register(`goals.${index}.plannedTarget`, { valueAsNumber: true })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Unit</Label>
                    <Input disabled={targetLocked} {...form.register(`goals.${index}.unit`)} />
                  </div>
                </div>

                {uom === "TIMELINE" && (
                  <div className="space-y-2">
                    <Label>Target deadline</Label>
                    <Input
                      type="date"
                      disabled={targetLocked}
                      {...form.register(`goals.${index}.targetDeadline`)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Weightage (%)</Label>
                  <Input
                    type="number"
                    min={10}
                    max={100}
                    disabled={readOnly}
                    {...form.register(`goals.${index}.weightage`, { valueAsNumber: true })}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}

        {!readOnly && fields.length < 8 && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => append({ ...defaultGoal })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add another goal
          </Button>
        )}
      </div>

      <div className="lg:col-span-2">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle className="text-base">Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <WeightageBar goals={weightageGoals} />
            {!readOnly && (
              <div className="flex flex-col gap-2">
                <Button type="button" variant="secondary" onClick={() => saveGoals(false)}>
                  Save as draft
                </Button>
                <Button
                  type="button"
                  onClick={() => saveGoals(true)}
                  disabled={Math.abs(weightageGoals.reduce((s, g) => s + g.weightage, 0) - 100) > 0.01}
                >
                  Submit for approval
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </form>
  );
}
