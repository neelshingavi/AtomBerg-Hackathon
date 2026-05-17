import type { AlignmentGraphNode } from "@/lib/alignment/types";

export type AlignmentNodeData = {
  node: AlignmentGraphNode;
  viewMode: string;
  highlighted?: boolean;
  dimmed?: boolean;
};
