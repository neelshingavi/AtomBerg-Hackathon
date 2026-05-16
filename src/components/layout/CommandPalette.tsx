"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  LayoutDashboard,
  Target,
  Users,
  CheckSquare,
  Share2,
  FileText,
  Building2,
  Calendar,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Plus,
  Shield,
  Activity,
  ClipboardCheck,
} from "lucide-react";
import { fuzzyMatch, fuzzyScore } from "@/lib/fuzzy-match";
import { cn } from "@/lib/utils";

const RECENT_KEY = "atomgoal-recent-searches";

type SearchResult = {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  href: string;
};

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  keywords?: string;
  roles: Array<"EMPLOYEE" | "MANAGER" | "ADMIN">;
};

const NAV_ITEMS: NavItem[] = [
  { id: "emp-dash", label: "Employee Dashboard", href: "/employee", icon: LayoutDashboard, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { id: "emp-goals", label: "My Goals", href: "/employee/goals", icon: Target, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { id: "emp-checkins", label: "Check-ins", href: "/employee/checkins", icon: ClipboardCheck, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { id: "mgr-dash", label: "Manager Dashboard", href: "/manager", icon: LayoutDashboard, roles: ["MANAGER", "ADMIN"] },
  { id: "mgr-approvals", label: "Approvals", href: "/manager/approvals", icon: CheckSquare, roles: ["MANAGER", "ADMIN"] },
  { id: "mgr-team", label: "My Team", href: "/manager/team", icon: Users, roles: ["MANAGER", "ADMIN"] },
  { id: "mgr-analytics", label: "Manager Analytics", href: "/manager/analytics", icon: TrendingUp, roles: ["MANAGER", "ADMIN"] },
  { id: "admin-dash", label: "Admin Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { id: "admin-users", label: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
  { id: "admin-depts", label: "Departments", href: "/admin/departments", icon: Building2, roles: ["ADMIN"] },
  { id: "admin-audit", label: "Audit Log", href: "/admin/audit-log", icon: FileText, roles: ["ADMIN"] },
  { id: "mgr-activity", label: "Activity Center", href: "/manager/activity", icon: Activity, roles: ["MANAGER"] },
  { id: "admin-activity", label: "Activity Center", href: "/admin/activity", icon: Activity, roles: ["ADMIN"] },
  { id: "admin-analytics", label: "Executive Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["ADMIN"] },
  { id: "admin-escalations", label: "Escalations", href: "/admin/escalations", icon: AlertTriangle, roles: ["ADMIN"] },
  { id: "admin-cycles", label: "Cycles", href: "/admin/cycles", icon: Calendar, roles: ["ADMIN"] },
  { id: "admin-shared", label: "Push Shared Goals", href: "/admin/shared-goals", icon: Share2, roles: ["ADMIN"] },
];

const QUICK_ACTIONS: Array<{
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  roles: Array<"EMPLOYEE" | "MANAGER" | "ADMIN">;
}> = [
  { id: "create-goal", label: "Create Goal Sheet", href: "/employee/goals/new", icon: Plus, roles: ["EMPLOYEE", "MANAGER", "ADMIN"] },
  { id: "push-shared", label: "Push Shared Goal", href: "/admin/shared-goals", icon: Share2, roles: ["ADMIN"] },
  { id: "approve", label: "Approve Pending Sheets", href: "/manager/approvals", icon: CheckSquare, roles: ["MANAGER", "ADMIN"] },
  { id: "audit", label: "Open Audit Logs", href: "/admin/audit-log", icon: Shield, roles: ["ADMIN"] },
  { id: "exec-dash", label: "Open Executive Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["ADMIN"] },
  { id: "analytics", label: "Open Analytics", href: "/admin/analytics", icon: BarChart3, roles: ["ADMIN", "MANAGER"] },
  { id: "create-user", label: "Create User", href: "/admin/users", icon: Users, roles: ["ADMIN"] },
  { id: "create-cycle", label: "Create Cycle", href: "/admin/cycles", icon: Calendar, roles: ["ADMIN"] },
];

function loadRecent(): SearchResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as SearchResult[];
  } catch {
    return [];
  }
}

function saveRecent(item: SearchResult) {
  const prev = loadRecent().filter((r) => r.id !== item.id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([item, ...prev].slice(0, 8)));
}

export function CommandPalette({ className }: { className?: string }) {
  const router = useRouter();
  const { data: session } = useSession();
  const role = session?.user?.role ?? "EMPLOYEE";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<SearchResult[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, [open]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.results as SearchResult[];
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

  const select = useCallback(
    (item: { href: string; id?: string; type?: string; title?: string; subtitle?: string }) => {
      if (item.id && item.title) {
        saveRecent({
          id: item.id,
          type: item.type ?? "Page",
          title: item.title,
          subtitle: item.subtitle,
          href: item.href,
        });
      }
      setOpen(false);
      setQuery("");
      router.push(item.href);
    },
    [router]
  );

  const filteredNav = useMemo(() => {
    const items = NAV_ITEMS.filter((n) => n.roles.includes(role));
    if (!query.trim()) return items;
    return items
      .filter((n) => fuzzyMatch(query, `${n.label} ${n.keywords ?? ""}`))
      .sort((a, b) => fuzzyScore(query, b.label) - fuzzyScore(query, a.label));
  }, [query, role]);

  const filteredActions = useMemo(() => {
    const items = QUICK_ACTIONS.filter((a) => a.roles.includes(role));
    if (!query.trim()) return items;
    return items.filter((a) => fuzzyMatch(query, a.label));
  }, [query, role]);

  const results = query.length >= 2 ? (data ?? []) : [];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "hidden h-9 w-56 justify-start gap-2 text-muted-foreground sm:flex md:w-64",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left text-sm">Search or jump to…</span>
        <kbd className="pointer-events-none hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={() => setOpen(true)}
        aria-label="Command palette"
      >
        <Search className="h-5 w-5" />
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search, navigate, or run an action…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {query.length < 2 && recent.length > 0 && (
            <CommandGroup heading="Recent">
              {recent.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => select(item)}
                  className="gap-2"
                >
                  <Search className="h-4 w-4 shrink-0 opacity-50" />
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{item.type}</span>
                  <span className="truncate font-medium">{item.title}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}

          {filteredActions.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick actions">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() =>
                        select({ href: action.href, id: action.id, title: action.label, type: "Action" })
                      }
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-brand-600" />
                      <span>{action.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {filteredNav.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Navigation">
                {filteredNav.map((nav) => {
                  const Icon = nav.icon;
                  return (
                    <CommandItem
                      key={nav.id}
                      onSelect={() =>
                        select({ href: nav.href, id: nav.id, title: nav.label, type: "Page" })
                      }
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" />
                      <span>{nav.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </>
          )}

          {query.length >= 2 && !isFetching && results.length === 0 && (
            <CommandEmpty>No results for &quot;{query}&quot;</CommandEmpty>
          )}
          {isFetching && query.length >= 2 && (
            <p className="py-6 text-center text-sm text-muted-foreground">Searching…</p>
          )}
          {results.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Search results">
                {results.map((item) => (
                  <CommandItem key={item.id} onSelect={() => select(item)} className="gap-2">
                    <Search className="h-4 w-4 shrink-0 opacity-50" />
                    <span className="text-xs text-muted-foreground w-16 shrink-0">{item.type}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.title}</p>
                      {item.subtitle && (
                        <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
