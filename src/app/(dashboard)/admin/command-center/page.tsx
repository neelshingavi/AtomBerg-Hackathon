"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PageContainer } from "@/components/layout/PageContainer";
import { LiveCommandCenterDashboard } from "@/components/realtime/LiveCommandCenterDashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Maximize2, Minimize2 } from "lucide-react";
import Link from "next/link";

export default function CommandCenterPage() {
  const [warRoom, setWarRoom] = useState(false);

  if (warRoom) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950">
        <div className="sticky top-0 z-50 flex items-center justify-between border-b border-red-500/30 px-6 py-3">
          <Badge className="border-red-500/40 bg-red-500/10 text-red-300">War Room Active</Badge>
          <Button variant="ghost" size="sm" onClick={() => setWarRoom(false)}>
            <Minimize2 className="mr-1 h-4 w-4" />
            Exit
          </Button>
        </div>
        <LiveCommandCenterDashboard warRoom />
      </div>
    );
  }

  return (
    <>
      <Topbar title="Leadership Response Center" />
      <PageContainer>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge className="mb-2 border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
              Real-time operations
            </Badge>
            <p className="text-sm text-muted-foreground">
              Demo finale war room — live organizational pulse, executive alerts, presence, and
              real-time workforce coordination. End here with all intelligence layers active.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setWarRoom(true)}>
              <Maximize2 className="mr-1 h-4 w-4" />
              War room
            </Button>
            <Link
              href="/admin/collaboration"
              className="inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium hover:bg-muted"
            >
              Collaboration →
            </Link>
          </div>
        </div>
        <LiveCommandCenterDashboard />
      </PageContainer>
    </>
  );
}
