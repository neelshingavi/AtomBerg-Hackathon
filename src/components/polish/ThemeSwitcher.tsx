"use client";

import { Monitor, Moon, Sun, Briefcase, Radio } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTheme, type AppTheme } from "@/contexts/ThemeContext";

const OPTIONS: { value: AppTheme; label: string; icon: React.ElementType }[] = [
  { value: "default", label: "Standard", icon: Sun },
  { value: "executive", label: "Executive dark", icon: Moon },
  { value: "boardroom", label: "Boardroom", icon: Briefcase },
  { value: "operational", label: "Operations", icon: Radio },
  { value: "accessible", label: "High contrast", icon: Monitor },
];

export function ThemeSwitcher({ compact }: { compact?: boolean }) {
  const { theme, setTheme } = useTheme();
  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[0];
  const Icon = current.icon;

  return (
    <Select value={theme} onValueChange={(v) => v && setTheme(v as AppTheme)}>
      <SelectTrigger className={compact ? "h-8 w-[130px] text-xs" : "h-9 w-[160px]"}>
        <Icon className="mr-1.5 h-3.5 w-3.5 opacity-70" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
