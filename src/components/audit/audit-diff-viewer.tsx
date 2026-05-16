"use client";

import { cn } from "@/lib/utils";

type JsonRecord = Record<string, unknown>;

function flattenForDiff(
  prev: JsonRecord | null | undefined,
  next: JsonRecord | null | undefined
): Array<{ key: string; before: unknown; after: unknown }> {
  const keys = Array.from(
    new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})])
  );
  const rows: Array<{ key: string; before: unknown; after: unknown }> = [];
  for (const key of keys) {
    const before = prev?.[key];
    const after = next?.[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      rows.push({ key, before, after });
    }
  }
  return rows;
}

function formatValue(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export function AuditDiffViewer({
  previousValues,
  newValues,
  className,
}: {
  previousValues?: JsonRecord | null;
  newValues?: JsonRecord | null;
  className?: string;
}) {
  const changes = flattenForDiff(previousValues ?? undefined, newValues ?? undefined);

  if (changes.length === 0) {
    return (
      <p className={cn("text-sm text-muted-foreground py-4 text-center", className)}>
        No field-level changes recorded.
      </p>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {changes.map(({ key, before, after }) => (
        <div key={key} className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b bg-muted/40 px-3 py-1.5">
            <span className="font-mono text-xs font-semibold text-foreground">{key}</span>
          </div>
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
            <div className="p-3 bg-destructive/5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-destructive mb-1">
                Before
              </p>
              <pre className="text-xs whitespace-pre-wrap break-words text-destructive/90">
                {formatValue(before)}
              </pre>
            </div>
            <div className="p-3 bg-success/5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-success mb-1">
                After
              </p>
              <pre className="text-xs whitespace-pre-wrap break-words text-success">
                {formatValue(after)}
              </pre>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
