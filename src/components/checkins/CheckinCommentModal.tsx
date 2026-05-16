"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useSaveCheckin } from "@/hooks/useCheckins";
import type { Quarter } from "@/lib/cycle";
import { toast } from "sonner";

export function CheckinCommentModal({
  open,
  onOpenChange,
  goalSheetId,
  quarter,
  employeeName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalSheetId: string;
  quarter: Quarter;
  employeeName: string;
}) {
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState<number | "">("");
  const [isPrivate, setIsPrivate] = useState(false);
  const save = useSaveCheckin();

  async function handleSubmit() {
    if (!comment.trim()) {
      toast.error("Comment is required");
      return;
    }
    try {
      await save.mutateAsync({
        goalSheetId,
        quarter,
        comment: comment.trim(),
        rating: rating === "" ? undefined : Number(rating),
        isPrivate,
      });
      toast.success("Check-in comment saved");
      setComment("");
      setRating("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{quarter} check-in comment</DialogTitle>
          <DialogDescription>
            Feedback for {employeeName}&apos;s {quarter} achievements.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Comment</Label>
            <Textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Progress summary and coaching notes…"
            />
          </div>
          <div className="space-y-2">
            <Label>Rating (1–5, optional)</Label>
            <Input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(e.target.value === "" ? "" : Number(e.target.value))}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            Private (manager/HR only)
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save comment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
