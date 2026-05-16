"use client";

import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeSharedGoalsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sharedGoals"],
    queryFn: async () => {
      const res = await fetch("/api/shared-goals");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.sharedGoals as Array<{
        id: string;
        title: string;
        description: string | null;
        plannedTarget: number;
        unit: string | null;
      }>;
    },
  });

  return (
    <>
      <Topbar title="Shared goals" />
      <PageContainer>
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : data?.length ? (
          <div className="grid gap-4">
            {data.map((sg) => (
              <Card key={sg.id}>
                <CardHeader>
                  <CardTitle className="text-base">{sg.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {sg.description}
                  <p className="mt-2 font-mono">
                    Target: {sg.plannedTarget} {sg.unit}
                  </p>
                  <p className="mt-1 text-xs">Title and target are read-only on your goal sheet.</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No shared goals assigned.</p>
        )}
      </PageContainer>
    </>
  );
}
