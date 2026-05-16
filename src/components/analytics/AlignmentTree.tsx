"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Building2, Users, User, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AlignmentNode } from "@/lib/intelligence/alignment";

const TYPE_ICONS = {
  company: Building2,
  department: Building2,
  team: Users,
  employee: User,
};

export function AlignmentTree({ tree }: { tree: AlignmentNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Organizational alignment</CardTitle>
        <p className="text-xs text-muted-foreground">
          Company goals → Department KPIs → Team goals → Employee goals
        </p>
      </CardHeader>
      <CardContent className="max-h-[480px] overflow-y-auto scrollbar-thin">
        <AlignmentNodeRow node={tree} depth={0} defaultOpen />
      </CardContent>
    </Card>
  );
}

function AlignmentNodeRow({
  node,
  depth,
  defaultOpen = false,
}: {
  node: AlignmentNode;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen || depth < 1);
  const hasChildren = node.children.length > 0;
  const Icon = TYPE_ICONS[node.type] ?? Target;

  return (
    <div className={cn(depth > 0 && "ml-4 border-l border-border pl-3")}>
      <button
        type="button"
        onClick={() => hasChildren && setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/50",
          hasChildren && "cursor-pointer"
        )}
      >
        {hasChildren ? (
          open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-brand-600" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{node.title}</p>
          {node.subtitle && (
            <p className="truncate text-[10px] text-muted-foreground">{node.subtitle}</p>
          )}
        </div>
        <div className="flex w-24 shrink-0 items-center gap-2">
          <Progress value={node.progressPct} className="h-1.5 flex-1" />
          <span className="text-xs font-semibold tabular-nums">{node.progressPct}%</span>
        </div>
        {node.isShared && (
          <span className="rounded bg-brand-500/10 px-1.5 py-0.5 text-[9px] font-medium text-brand-600">
            Shared
          </span>
        )}
      </button>
      {open &&
        node.children.map((child) => (
          <AlignmentNodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
    </div>
  );
}
