"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackClientEvent } from "@/lib/observability/client-telemetry";

export function ClientTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    trackClientEvent("page_view", { pathname });
  }, [pathname]);

  return null;
}
