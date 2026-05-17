import { isDemoModeEnabled } from "./config";

const DEFAULT_TIMEOUT_MS = 12_000;

export class ResilientFetchError extends Error {
  constructor(
    message: string,
    readonly usedFallback: boolean
  ) {
    super(message);
    this.name = "ResilientFetchError";
  }
}

/** Fetch JSON API with timeout; in demo mode returns fallback instead of throwing. */
export async function resilientJsonFetch<T>(params: {
  url: string;
  fallback: T;
  timeoutMs?: number;
  init?: RequestInit;
}): Promise<{ data: T; fromFallback: boolean }> {
  const { url, fallback, timeoutMs = DEFAULT_TIMEOUT_MS, init } = params;
  const demoSafe = isDemoModeEnabled();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) {
      if (demoSafe) return { data: fallback, fromFallback: true };
      throw new ResilientFetchError(`Request failed (${res.status})`, false);
    }

    const json = (await res.json()) as { success?: boolean; data?: T; error?: string };
    if (json.success === false || json.data === undefined) {
      if (demoSafe) return { data: fallback, fromFallback: true };
      throw new ResilientFetchError(json.error ?? "Invalid response", false);
    }

    return { data: json.data as T, fromFallback: false };
  } catch (err) {
    clearTimeout(timer);
    if (demoSafe) return { data: fallback, fromFallback: true };
    if (err instanceof ResilientFetchError) throw err;
    throw new ResilientFetchError(
      err instanceof Error ? err.message : "Network error",
      false
    );
  }
}

export const DEMO_QUERY_DEFAULTS = {
  retry: 3,
  retryDelay: (attempt: number) => Math.min(800 * 2 ** attempt, 8_000),
  refetchOnWindowFocus: true,
  staleTime: 30_000,
} as const;
