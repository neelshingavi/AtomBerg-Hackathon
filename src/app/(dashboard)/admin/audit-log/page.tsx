"use client";

import { Suspense } from "react";
import AuditLogPageContent from "./AuditLogContent";

export default function AuditLogPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Loading audit log…</div>}>
      <AuditLogPageContent />
    </Suspense>
  );
}
