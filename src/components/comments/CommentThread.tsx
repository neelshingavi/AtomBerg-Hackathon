"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  isEdited: boolean;
  author: { id: string; name: string; employeeCode: string };
  replies: Comment[];
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function CommentThread({
  entityType,
  entityId,
  goalSheetId,
  className,
}: {
  entityType: "GOAL_SHEET" | "GOAL" | "CHECKIN" | "ESCALATION";
  entityId: string;
  goalSheetId?: string;
  className?: string;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["comments", entityType, entityId],
    queryFn: async () => {
      const qs = new URLSearchParams({ entityType, entityId });
      if (goalSheetId) qs.set("goalSheetId", goalSheetId);
      const res = await fetch(`/api/comments?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data.comments as Comment[];
    },
  });

  const post = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityType,
          entityId,
          goalSheetId,
          parentId: replyTo ?? undefined,
          body,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
    },
    onSuccess: () => {
      setBody("");
      setReplyTo(null);
      void qc.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
    },
  });

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4 text-brand-600" />
        Discussion
      </div>

      {isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <ul className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {(data ?? []).map((c) => (
            <li key={c.id} className="space-y-3">
              <CommentItem comment={c} onReply={() => setReplyTo(c.id)} />
              {c.replies?.map((r) => (
                <div key={r.id} className="ml-8 border-l-2 pl-4">
                  <CommentItem comment={r} />
                </div>
              ))}
            </li>
          ))}
          {!data?.length && (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Start the conversation — add a comment below.
            </p>
          )}
        </ul>
      )}

      {replyTo && (
        <p className="text-xs text-muted-foreground">
          Replying to thread ·{" "}
          <button type="button" className="underline" onClick={() => setReplyTo(null)}>
            cancel
          </button>
        </p>
      )}
      <div className="flex gap-2">
        <Textarea
          rows={2}
          placeholder="Add a comment… Use @[Name](userId) for mentions"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="resize-none"
        />
        <Button
          size="icon"
          className="shrink-0 h-10 w-10"
          disabled={!body.trim() || post.isPending}
          onClick={() => post.mutate()}
          aria-label="Send comment"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply?: () => void;
}) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-[10px]">{initials(comment.author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.author.name}</span>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm mt-1 whitespace-pre-wrap">{comment.body}</p>
        {onReply && (
          <button
            type="button"
            className="text-xs text-brand-600 mt-1 hover:underline"
            onClick={onReply}
          >
            Reply
          </button>
        )}
      </div>
    </div>
  );
}
