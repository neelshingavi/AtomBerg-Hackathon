"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Activity, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/app/api/activity/route";

const SEVERITY_STYLES: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning border-warning/20",
  high: "bg-orange-500/10 text-orange-700 border-orange-200",
  critical: "bg-destructive/10 text-destructive border-destructive/20",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function OperationalActivityCenter({ limit = 30 }: { limit?: number }) {
  const [severity, setSeverity] = useState<string>("all");
  const [kind, setKind] = useState<string>("all");

  const qs = new URLSearchParams({ limit: String(limit) });
  if (severity !== "all") qs.set("severity", severity);
  if (kind !== "all") qs.set("kind", kind);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["activity-center", severity, kind, limit],
    queryFn: async () => {
      const res = await fetch(`/api/activity?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.items as ActivityItem[];
    },
    refetchInterval: 60_000,
  });

  return (
    <Card className="enterprise-card overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="type-card flex items-center gap-2">
            <Activity className="h-4 w-4 text-brand-600" />
            Activity center
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={kind} onValueChange={(v) => v && setKind(v)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="audit">Audit</SelectItem>
                <SelectItem value="submission">Submissions</SelectItem>
                <SelectItem value="escalation">Escalations</SelectItem>
              </SelectContent>
            </Select>
            <Select value={severity} onValueChange={(v) => v && setSeverity(v)}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All severity</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />
            ))}
          </div>
        ) : isError ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Failed to load activity.{" "}
            <Button variant="link" size="sm" className="h-auto p-0" onClick={() => void refetch()}>
              Retry
            </Button>
          </p>
        ) : !data?.length ? (
          <p className="flex flex-col items-center gap-2 p-10 text-sm text-muted-foreground">
            <Filter className="h-8 w-8 opacity-30" />
            No activity matches your filters.
          </p>
        ) : (
          <ul className="divide-y">
            {data.map((item) => (
              <li key={item.id} className="flex gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-[10px] bg-brand-500/10 text-brand-700">
                    {initials(item.actorName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <Badge variant="outline" className={cn("text-[10px]", SEVERITY_STYLES[item.severity])}>
                      {item.severity}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] font-normal">
                      {item.kind}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {item.actorName} · {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                  </p>
                </div>
                {item.href && (
                  <Link
                    href={item.href}
                    className="shrink-0 text-xs text-brand-600 hover:underline self-center"
                  >
                    View
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
