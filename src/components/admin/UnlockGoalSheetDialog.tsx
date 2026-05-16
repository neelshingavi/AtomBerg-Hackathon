"use client";

import { useState } from "react";
import { toast } from "sonner";
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

export function UnlockGoalSheetDialog({
  sheetId,
  open,
  onOpenChange,
  onUnlocked,
}: {
  sheetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked?: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleUnlock() {
    if (!reason.trim()) {
      toast.error("Please provide a reason");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/goals/${sheetId}/unlock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      toast.success("Goal sheet unlocked");
      setReason("");
      onOpenChange(false);
      onUnlocked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Unlock failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unlock goal sheet</DialogTitle>
          <DialogDescription>
            This allows the employee to edit goals again. The action is recorded in the audit log.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label>Reason (required)</Label>
          <Textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Employee requested correction of typo in goal title"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleUnlock} disabled={loading}>
            {loading ? "Unlocking…" : "Unlock sheet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
