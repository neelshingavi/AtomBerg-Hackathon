"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function useTableUrlState(prefix = "") {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const key = useCallback((name: string) => (prefix ? `${prefix}_${name}` : name), [prefix]);

  const get = useCallback(
    (name: string, fallback = "") => searchParams.get(key(name)) ?? fallback,
    [searchParams, key]
  );

  const setMany = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [name, value] of Object.entries(updates)) {
        const k = key(name);
        if (value == null || value === "") params.delete(k);
        else params.set(k, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams, key]
  );

  const filters = useMemo(
    () => ({
      q: get("q"),
      status: get("status"),
      department: get("department"),
      action: get("action"),
      entityType: get("entityType"),
      from: get("from"),
      to: get("to"),
    }),
    [get]
  );

  return { get, setMany, filters };
}
