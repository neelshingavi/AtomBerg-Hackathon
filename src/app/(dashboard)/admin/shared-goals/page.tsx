"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import { useThrustAreas } from "@/hooks/useGoals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UoMSelector } from "@/components/goals/UoMSelector";
import type { UoMType } from "@prisma/client";

export default function AdminSharedGoalsPage() {
  const { data: cycleData } = useCurrentCycle();
  const { data: thrustAreas } = useThrustAreas();
  const cycle = cycleData?.active;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uomType, setUomType] = useState<UoMType>("ZERO_BASED");
  const [plannedTarget, setPlannedTarget] = useState(0);
  const [unit, setUnit] = useState("");
  const [thrustAreaId, setThrustAreaId] = useState("");
  const [defaultWeightage, setDefaultWeightage] = useState(15);
  const [employeeIds, setEmployeeIds] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePush(e: React.FormEvent) {
    e.preventDefault();
    if (!cycle) {
      toast.error("No active cycle");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/shared-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          uomType,
          plannedTarget,
          unit,
          thrustAreaId,
          cycleId: cycle.id,
          defaultWeightage,
          targetEmployeeIds: employeeIds.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success(`Shared goal pushed to ${json.data.pushed.length} employees`);
      setTitle("");
      setEmployeeIds("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Push failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Topbar title="Push shared goals" />
      <PageContainer>
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Push shared goal to employees</CardTitle>
            <p className="text-sm text-muted-foreground">
              Title and target are locked for employees; they can adjust weightage only.
            </p>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handlePush}>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <UoMSelector value={uomType} onChange={setUomType} />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target</Label>
                  <Input
                    type="number"
                    value={plannedTarget}
                    onChange={(e) => setPlannedTarget(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Thrust area ID</Label>
                <Input
                  value={thrustAreaId}
                  onChange={(e) => setThrustAreaId(e.target.value)}
                  placeholder={thrustAreas?.[0]?.id ?? "ta-quality"}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Default weightage (%)</Label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  value={defaultWeightage}
                  onChange={(e) => setDefaultWeightage(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Employee user IDs (comma-separated)</Label>
                <Input
                  value={employeeIds}
                  onChange={(e) => setEmployeeIds(e.target.value)}
                  placeholder="cuid1, cuid2"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Pushing…" : "Push shared goal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
