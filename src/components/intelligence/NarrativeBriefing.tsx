"use client";

import { FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useExecutiveBriefing } from "@/hooks/useIntelligence";
import { FadeIn } from "@/components/motion";

export function NarrativeBriefing() {
  const { data: briefing, isLoading } = useExecutiveBriefing();

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (!briefing) return null;

  return (
    <FadeIn>
      <Card className="enterprise-card border-l-4 border-l-brand-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-brand-600" />
            {briefing.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            AI-generated leadership briefing · {new Date(briefing.generatedAt).toLocaleString()}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed font-medium">{briefing.summary}</p>
          {briefing.developments.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Major developments
              </p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {briefing.developments.map((d, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-brand-500">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {briefing.nextActions.length > 0 && (
            <div className="rounded-lg bg-brand-500/5 px-3 py-2">
              <p className="text-xs font-semibold text-brand-800 mb-1">Next actions</p>
              <ul className="text-xs text-brand-700 space-y-0.5">
                {briefing.nextActions.map((a, i) => (
                  <li key={i}>→ {a}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
