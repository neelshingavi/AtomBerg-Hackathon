"use client";

import { Presentation, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "./RoleSwitcher";
import { ThemeSwitcher } from "@/components/polish/ThemeSwitcher";
import { useDemoModeOptional } from "@/contexts/DemoModeContext";

export function DemoModeBar() {
  const demo = useDemoModeOptional();

  if (!demo?.enabled) return null;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-brand-500/20 bg-gradient-to-r from-brand-500/10 via-cyan-500/5 to-transparent px-4 py-2">
      <div className="flex items-center gap-2 text-xs font-medium text-brand-800">
        <Presentation className="h-4 w-4" />
        <span>Presentation Mode</span>
        <span className="hidden text-muted-foreground sm:inline">
          — Judge flow · role switching · demo-safe fallbacks active
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ThemeSwitcher compact />
        <Button
          variant="ghost"
          size="sm"
          className="hidden gap-1.5 text-xs sm:flex"
          onClick={() => demo.startWalkthrough()}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Feature tour
        </Button>
        <RoleSwitcher />
      </div>
    </div>
  );
}
