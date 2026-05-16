"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Bell,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  Clock,
  Filter,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "border-muted text-muted-foreground",
  MEDIUM: "border-warning/30 bg-warning/5 text-warning",
  HIGH: "border-orange-300 bg-orange-50 text-orange-800",
  CRITICAL: "border-destructive/40 bg-destructive/10 text-destructive",
};

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  APPROVAL: CheckSquare,
  ESCALATION: AlertTriangle,
  COMMENT: MessageSquare,
  REMINDER: Clock,
};

type InboxNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  priority: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  entityType: string | null;
  entityId: string | null;
};

export default function NotificationsInboxPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("unread");
  const [category, setCategory] = useState<string>("all");
  const [selected, setSelected] = useState<string[]>([]);

  const qs = new URLSearchParams({ limit: "50" });
  if (filter === "unread") qs.set("unreadOnly", "true");
  if (category !== "all") qs.set("category", category);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", "inbox", filter, category],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        notifications: InboxNotification[];
        unreadCount: number;
        categoryCounts: Record<string, number>;
      };
    },
    refetchInterval: 15_000,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_all_read" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const dismiss = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "dismiss", ids }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      setSelected([]);
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markRead = async (id: string, link: string | null) => {
    await fetch(`/api/notifications/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });
    void qc.invalidateQueries({ queryKey: ["notifications"] });
    if (link) router.push(link);
  };

  return (
    <>
      <Topbar title="Inbox" />
      <PageContainer>
        <PageHeader
          title="Notification inbox"
          description="Approvals, escalations, comments, and automation alerts in one place."
          actions={
            <div className="flex gap-2">
              {selected.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => dismiss.mutate(selected)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Dismiss ({selected.length})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAll.mutate()}
                disabled={!data?.unreadCount}
              >
                Mark all read
              </Button>
            </div>
          }
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as "all" | "unread")}>
            <TabsList>
              <TabsTrigger value="unread">Unread ({data?.unreadCount ?? 0})</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-1">
            {["all", "APPROVAL", "ESCALATION", "COMMENT", "REMINDER", "RISK"].map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "secondary" : "ghost"}
                size="sm"
                className="h-7 text-xs capitalize"
                onClick={() => setCategory(cat)}
              >
                {cat === "all" ? "All" : cat.toLowerCase()}
                {cat !== "all" && data?.categoryCounts?.[cat] != null && (
                  <Badge variant="outline" className="ml-1 h-4 px-1 text-[9px]">
                    {data.categoryCounts[cat]}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : !data?.notifications.length ? (
          <p className="flex flex-col items-center py-16 text-muted-foreground">
            <Filter className="h-10 w-10 mb-2 opacity-30" />
            Inbox clear — no notifications match.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card shadow-elevation-sm">
            {data.notifications.map((n) => {
              const Icon = CATEGORY_ICONS[n.category] ?? Bell;
              const isSelected = selected.includes(n.id);
              return (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-3 p-4 transition-colors hover:bg-muted/30",
                    !n.isRead && "bg-brand-500/5"
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={isSelected}
                    onChange={(e) =>
                      setSelected((prev) =>
                        e.target.checked
                          ? [...prev, n.id]
                          : prev.filter((id) => id !== n.id)
                      )
                    }
                    aria-label={`Select ${n.title}`}
                  />
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                      n.priority === "CRITICAL" && "bg-destructive/10 text-destructive"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => void markRead(n.id, n.link)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{n.title}</span>
                      <Badge variant="outline" className={cn("text-[10px]", PRIORITY_STYLES[n.priority])}>
                        {n.priority}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {n.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </button>
                  {n.link && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => void markRead(n.id, n.link)}
                      aria-label="Open"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PageContainer>
    </>
  );
}
