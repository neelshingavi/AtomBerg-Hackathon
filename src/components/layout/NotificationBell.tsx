"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckSquare,
  AlertTriangle,
  MessageSquare,
  Clock,
  Filter,
  X,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<string, typeof Bell> = {
  GOAL_APPROVED: CheckSquare,
  GOAL_REJECTED: AlertTriangle,
  APPROVAL: CheckSquare,
  REMINDER: Clock,
  ESCALATION: AlertTriangle,
  COMMENT: MessageSquare,
};

const CATEGORY_MAP: Record<string, string> = {
  GOAL_APPROVED: "approvals",
  GOAL_REJECTED: "approvals",
  APPROVAL: "approvals",
  ESCALATION: "escalations",
  REMINDER: "reminders",
  COMMENT: "comments",
};

function severityFromTitle(title: string): "low" | "medium" | "critical" | null {
  const t = title.toLowerCase();
  if (t.includes("escalat") || t.includes("overdue")) return "critical";
  if (t.includes("reject") || t.includes("deadline")) return "medium";
  if (t.includes("remind")) return "low";
  return null;
}

export function NotificationBell() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<string>("all");
  const { data, isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = (data?.notifications ?? []).filter((n) => {
    if (filter === "unread" && n.isRead) return false;
    if (category === "all") return true;
    return (CATEGORY_MAP[n.type ?? ""] ?? "other") === category;
  });

  async function handleNavigate(id: string, link: string | null, isRead: boolean) {
    if (!isRead) {
      await markRead.mutateAsync({ id, isRead: true });
    }
    if (link) router.push(link);
  }

  async function handleDismiss(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    await markRead.mutateAsync({ id, isRead: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-[min(100vw-2rem,400px)] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold">Inbox</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-9 px-2 gap-1">
            <TabsTrigger
              value="all"
              className="text-xs"
              onClick={() => setFilter("all")}
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="unread"
              className="text-xs"
              onClick={() => setFilter("unread")}
            >
              Unread
            </TabsTrigger>
          </TabsList>
          <div className="flex gap-1 overflow-x-auto border-b px-2 py-1.5 scrollbar-thin">
            {["all", "approvals", "escalations", "reminders", "comments"].map((cat) => (
              <Button
                key={cat}
                variant={category === cat ? "secondary" : "ghost"}
                size="sm"
                className="h-7 shrink-0 text-xs capitalize"
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
          <TabsContent value={filter} className="mt-0 max-h-[min(400px,55vh)] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full skeleton-shimmer" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">
                <Filter className="mx-auto mb-2 h-8 w-8 opacity-30" />
                No notifications in this view
              </p>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICONS[n.type ?? ""] ?? Bell;
                const severity = severityFromTitle(n.title);
                const isApproval =
                  n.type === "GOAL_APPROVED" ||
                  n.link?.includes("/approvals/");

                return (
                  <div
                    key={n.id}
                    className={cn(
                      "flex gap-2 border-b px-3 py-3 last:border-0",
                      !n.isRead && "bg-brand-500/5"
                    )}
                  >
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 gap-3 text-left transition-colors hover:opacity-90"
                      onClick={() => void handleNavigate(n.id, n.link, n.isRead)}
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          severity === "critical" && "bg-destructive/10 text-destructive",
                          severity === "medium" && "bg-warning/10 text-warning",
                          !severity && "bg-muted text-muted-foreground"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium leading-snug">{n.title}</p>
                          {!n.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                          {CATEGORY_MAP[n.type ?? ""] && (
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {CATEGORY_MAP[n.type ?? ""]}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col gap-1">
                      {n.link && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          aria-label="Open"
                          onClick={() => void handleNavigate(n.id, n.link, n.isRead)}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        aria-label="Dismiss"
                        onClick={(e) => void handleDismiss(e, n.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                      {isApproval && n.link?.includes("/approvals/") && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-[10px] px-2"
                          onClick={() => void handleNavigate(n.id, n.link, n.isRead)}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
