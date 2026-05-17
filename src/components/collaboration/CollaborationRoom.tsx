"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LivePulseIndicator } from "@/components/realtime/LivePulseIndicator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Post = {
  id: string;
  body: string;
  postType: string;
  createdAt: string;
  author: { id: string; name: string };
};

export function CollaborationRoom({ spaceId }: { spaceId: string }) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState("DISCUSSION");

  const { data: space } = useQuery({
    queryKey: ["collaboration-space", spaceId],
    queryFn: async () => {
      const res = await fetch(`/api/collaboration/spaces/${spaceId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as {
        id: string;
        name: string;
        description?: string;
        posts: Post[];
        owner: { name: string };
      };
    },
    refetchInterval: 8_000,
  });

  const post = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/collaboration/spaces/${spaceId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, postType }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["collaboration-space", spaceId] });
      void qc.invalidateQueries({ queryKey: ["collaboration-spaces"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{space?.name ?? "Collaboration space"}</h1>
          <p className="text-sm text-muted-foreground">{space?.description}</p>
          <p className="text-xs text-muted-foreground">Owner: {space?.owner.name}</p>
        </div>
        <LivePulseIndicator />
      </div>

      <div className="flex gap-2">
        <Select value={postType} onValueChange={(v) => v && setPostType(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="BLOCKER">Blocker</SelectItem>
            <SelectItem value="DECISION">Decision</SelectItem>
            <SelectItem value="DISCUSSION">Discussion</SelectItem>
          </SelectContent>
        </Select>
        <Textarea
          placeholder="Share update, blocker, or decision…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[60px] flex-1"
        />
        <Button disabled={!body.trim() || post.isPending} onClick={() => post.mutate()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <ul className="space-y-3">
        {space?.posts.map((p) => (
          <li key={p.id} className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] capitalize">
                {p.postType.toLowerCase()}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {p.author.name} · {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
              </span>
            </div>
            <p className="text-sm whitespace-pre-wrap">{p.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
