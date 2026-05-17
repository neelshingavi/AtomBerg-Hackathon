"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LivePulseIndicator } from "@/components/realtime/LivePulseIndicator";

type SpaceSummary = {
  id: string;
  name: string;
  description?: string;
  slug: string;
  color: string;
  ownerName: string;
  postCount: number;
  memberCount: number;
  latestPost?: { body: string; authorName: string; postType: string; createdAt: string };
};

export function CollaborationSpaces() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const { data: spaces, isLoading } = useQuery({
    queryKey: ["collaboration-spaces"],
    queryFn: async () => {
      const res = await fetch("/api/collaboration/spaces");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.spaces as SpaceSummary[];
    },
    refetchInterval: 12_000,
  });

  const create = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/collaboration/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: desc }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      setName("");
      setDesc("");
      void qc.invalidateQueries({ queryKey: ["collaboration-spaces"] });
    },
  });

  return (
    <div className="space-y-6" data-collaboration-spaces>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Initiative collaboration spaces</h2>
          <p className="text-sm text-muted-foreground">
            Cross-functional rooms for strategic initiatives, blockers, and decisions.
          </p>
        </div>
        <LivePulseIndicator />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Create space</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Initiative name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} className="min-h-[40px]" />
          <Button disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
            <Plus className="mr-1 h-4 w-4" />
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading spaces…</p>}
        {spaces?.map((s) => (
          <Link key={s.id} href={`/admin/collaboration/${s.id}`}>
            <Card className="h-full transition-shadow hover:shadow-md" style={{ borderTopColor: s.color, borderTopWidth: 3 }}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{s.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">
                <div className="flex gap-3">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {s.postCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {s.memberCount}
                  </span>
                </div>
                {s.latestPost && (
                  <p className="mt-2 line-clamp-2 border-t pt-2">
                    {s.latestPost.authorName}: {s.latestPost.body}
                    <span className="block text-[10px]">
                      {formatDistanceToNow(new Date(s.latestPost.createdAt), { addSuffix: true })}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
