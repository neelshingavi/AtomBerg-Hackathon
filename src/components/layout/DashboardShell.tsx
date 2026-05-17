"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { DemoModeBar } from "@/components/demo/DemoModeBar";
import { FeatureSpotlight } from "@/components/demo/FeatureSpotlight";
import { OnboardingChecklist } from "@/components/demo/OnboardingChecklist";
import { AtomCopilot } from "@/components/copilot/AtomCopilot";
import { DemoResilienceBanner } from "@/components/polish/DemoResilienceBanner";
import { ClientTelemetry } from "@/components/providers/ClientTelemetry";
import { ExecutiveLiveTicker } from "@/components/polish/ExecutiveLiveTicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-dvh bg-background">
      <ClientTelemetry />
      <div className="hidden md:flex md:shrink-0">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
            >
              <div className="flex h-full flex-col">
                <div className="flex justify-end border-b border-sidebar-border p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                    aria-label="Close navigation"
                    onClick={() => setMobileOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Sidebar
                  onNavigate={() => setMobileOpen(false)}
                  className="h-[calc(100%-3rem)] w-full"
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <DemoResilienceBanner />
        <ExecutiveLiveTicker />
        <DemoModeBar />
        <div className="flex items-center gap-3 border-b border-border/80 bg-card/80 px-4 py-3 backdrop-blur-md md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="text-sm font-semibold text-gradient">
            {process.env.NEXT_PUBLIC_APP_NAME ?? "AtomGoal"}
          </span>
        </div>

        <ErrorBoundary>
          <main className={cn("flex-1")}>{children}</main>
        </ErrorBoundary>
        <OnboardingChecklist />
        <FeatureSpotlight />
        <AtomCopilot />
      </div>
    </div>
  );
}
