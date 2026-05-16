"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { useState } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "sonner";
import { RealtimeProvider } from "@/components/providers/RealtimeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: true },
        },
      })
  );

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </SessionProvider>
  );
}
