"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";
import { DemoModeProvider } from "@/contexts/DemoModeContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: true,
            retry: 3,
            retryDelay: (attempt) => Math.min(800 * 2 ** attempt, 8_000),
          },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <DemoModeProvider>
            <RealtimeProvider>
              <TooltipProvider>{children}</TooltipProvider>
            </RealtimeProvider>
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                classNames: {
                  toast: "rounded-xl border shadow-card backdrop-blur-sm",
                },
              }}
            />
          </DemoModeProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
