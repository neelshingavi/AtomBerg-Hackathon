"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AnalyticsFilterValues = {
  cycleId: string;
  departmentId?: string;
  quarter?: string;
};

export function AnalyticsFilters({
  onChange,
  showDepartment = true,
  showQuarter = false,
}: {
  onChange: (filters: AnalyticsFilterValues) => void;
  showDepartment?: boolean;
  showQuarter?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [cycleId, setCycleId] = useState(searchParams.get("cycleId") ?? "");
  const [departmentId, setDepartmentId] = useState(searchParams.get("departmentId") ?? "");
  const [quarter, setQuarter] = useState(searchParams.get("quarter") ?? "");

  const { data: cycles } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => {
      const res = await fetch("/api/cycles");
      const json = await res.json();
      return json.data.cycles as Array<{ id: string; name: string; isActive: boolean }>;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await fetch("/api/departments");
      const json = await res.json();
      return json.data.departments as Array<{ id: string; name: string }>;
    },
    enabled: showDepartment,
  });

  const activeCycleId = cycleId || cycles?.find((c) => c.isActive)?.id || "";

  const syncUrl = useCallback(
    (filters: AnalyticsFilterValues) => {
      const params = new URLSearchParams();
      if (filters.cycleId) params.set("cycleId", filters.cycleId);
      if (filters.departmentId) params.set("departmentId", filters.departmentId);
      if (filters.quarter) params.set("quarter", filters.quarter);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router]
  );

  useEffect(() => {
    if (!activeCycleId) return;
    const filters: AnalyticsFilterValues = {
      cycleId: activeCycleId,
      departmentId: departmentId || undefined,
      quarter: quarter || undefined,
    };
    onChange(filters);
    syncUrl(filters);
  }, [activeCycleId, departmentId, quarter, onChange, syncUrl]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <FilterField label="Cycle">
        <Select value={activeCycleId} onValueChange={setCycleId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select cycle" />
          </SelectTrigger>
          <SelectContent>
            {cycles?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterField>

      {showDepartment && (
        <FilterField label="Department">
          <Select
            value={departmentId || "all"}
            onValueChange={(v) => setDepartmentId(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All departments</SelectItem>
              {departments?.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}

      {showQuarter && (
        <FilterField label="Quarter">
          <Select
            value={quarter || "all"}
            onValueChange={(v) => setQuarter(v === "all" ? "" : v)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="All quarters" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {["Q1", "Q2", "Q3", "Q4"].map((q) => (
                <SelectItem key={q} value={q}>
                  {q}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FilterField>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
