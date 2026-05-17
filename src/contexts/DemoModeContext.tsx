"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  ONBOARDING_TASKS,
  SPOTLIGHT_STEPS,
  type SpotlightId,
  isDemoModeEnabled,
} from "@/lib/demo/config";

const STORAGE_KEY = "atomgoal-demo-mode";
const ONBOARDING_KEY = "atomgoal-onboarding";
const SPOTLIGHT_KEY = "atomgoal-spotlight-index";

type DemoModeState = {
  enabled: boolean;
  walkthroughActive: boolean;
  spotlightIndex: number;
  completedTasks: Set<string>;
  completedSpotlights: Set<SpotlightId>;
};

type DemoModeContextValue = DemoModeState & {
  toggleDemoMode: () => void;
  startWalkthrough: () => void;
  stopWalkthrough: () => void;
  nextSpotlight: () => void;
  prevSpotlight: () => void;
  skipSpotlight: () => void;
  currentSpotlight: (typeof SPOTLIGHT_STEPS)[number] | null;
  markTaskComplete: (taskId: string) => void;
  onboardingProgress: number;
};

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify(Array.from(set)));
}

export function DemoModeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [walkthroughActive, setWalkthroughActive] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => new Set());
  const [completedSpotlights, setCompletedSpotlights] = useState<Set<SpotlightId>>(
    () => new Set()
  );

  useEffect(() => {
    if (!isDemoModeEnabled()) return;
    const stored = localStorage.getItem(STORAGE_KEY);
    setEnabled(stored !== "false");
    setCompletedTasks(loadSet(ONBOARDING_KEY));
    const idx = localStorage.getItem(SPOTLIGHT_KEY);
    if (idx) setSpotlightIndex(parseInt(idx, 10) || 0);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    for (const task of ONBOARDING_TASKS) {
      if (task.path && pathname.startsWith(task.path)) {
        setCompletedTasks((prev) => {
          if (prev.has(task.id)) return prev;
          const next = new Set(prev);
          next.add(task.id);
          saveSet(ONBOARDING_KEY, next);
          return next;
        });
      }
    }
  }, [pathname, enabled]);

  const toggleDemoMode = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const startWalkthrough = useCallback(() => {
    setWalkthroughActive(true);
    setSpotlightIndex(0);
    localStorage.setItem(SPOTLIGHT_KEY, "0");
  }, []);

  const stopWalkthrough = useCallback(() => {
    setWalkthroughActive(false);
  }, []);

  const markSpotlightDone = useCallback((id: SpotlightId) => {
    setCompletedSpotlights((prev) => new Set([...Array.from(prev), id]));
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.add("run-spotlight");
      saveSet(ONBOARDING_KEY, next);
      return next;
    });
  }, []);

  const nextSpotlight = useCallback(() => {
    const current = SPOTLIGHT_STEPS[spotlightIndex];
    if (current) markSpotlightDone(current.id);
    const next = Math.min(spotlightIndex + 1, SPOTLIGHT_STEPS.length);
    setSpotlightIndex(next);
    localStorage.setItem(SPOTLIGHT_KEY, String(next));
    if (next >= SPOTLIGHT_STEPS.length) setWalkthroughActive(false);
  }, [spotlightIndex, markSpotlightDone]);

  const prevSpotlight = useCallback(() => {
    setSpotlightIndex((i) => Math.max(0, i - 1));
  }, []);

  const skipSpotlight = useCallback(() => {
    setWalkthroughActive(false);
    setSpotlightIndex(SPOTLIGHT_STEPS.length);
  }, []);

  const markTaskComplete = useCallback((taskId: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      saveSet(ONBOARDING_KEY, next);
      return next;
    });
  }, []);

  const currentSpotlight =
    walkthroughActive && spotlightIndex < SPOTLIGHT_STEPS.length
      ? SPOTLIGHT_STEPS[spotlightIndex]
      : null;

  const onboardingProgress = Math.round(
    (completedTasks.size / ONBOARDING_TASKS.length) * 100
  );

  const value = useMemo(
    () => ({
      enabled: enabled && isDemoModeEnabled(),
      walkthroughActive,
      spotlightIndex,
      completedTasks,
      completedSpotlights,
      toggleDemoMode,
      startWalkthrough,
      stopWalkthrough,
      nextSpotlight,
      prevSpotlight,
      skipSpotlight,
      currentSpotlight,
      markTaskComplete,
      onboardingProgress,
    }),
    [
      enabled,
      walkthroughActive,
      spotlightIndex,
      completedTasks,
      completedSpotlights,
      toggleDemoMode,
      startWalkthrough,
      stopWalkthrough,
      nextSpotlight,
      prevSpotlight,
      skipSpotlight,
      currentSpotlight,
      markTaskComplete,
      onboardingProgress,
    ]
  );

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
}

export function useDemoModeOptional() {
  return useContext(DemoModeContext);
}
