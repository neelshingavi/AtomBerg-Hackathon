"use client";

import type { LucideIcon } from "lucide-react";
import { StaggerGrid, StaggerItem } from "@/components/motion";
import { StatCard } from "@/components/ui/stat-card";

export function DashboardStats({
  items,
  className,
}: {
  items: Array<{
    label: string;
    value: React.ReactNode;
    hint?: string;
    icon?: LucideIcon;
    accent?: "default" | "success" | "warning" | "info" | "neutral";
    trend?: "up" | "down" | "neutral";
    trendLabel?: string;
  }>;
  className?: string;
}) {
  return (
    <StaggerGrid className={className}>
      {items.map((item) => (
        <StaggerItem key={item.label}>
          <StatCard {...item} />
        </StaggerItem>
      ))}
    </StaggerGrid>
  );
}
