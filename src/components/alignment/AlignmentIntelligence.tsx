"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { AlignmentGraphCanvas } from "./AlignmentGraphCanvas";
import { useAlignmentGraph } from "@/hooks/useAlignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendCopilotMessage } from "@/hooks/useIntelligence";
import { FadeIn } from "@/components/motion";

const GRAPH_PROMPTS = [
  "Why is Engineering at risk?",
  "Show dependency bottlenecks",
  "Which managers affect Revenue Growth?",
  "What goals are blocking execution?",
];

export function AlignmentIntelligence() {
  const [expand, setExpand] = useState(false);
  const { data, isLoading } = useAlignmentGraph(expand);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  async function askGraphAi() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const res = await sendCopilotMessage(aiQuery);
      setAiResponse(res.response.summary);
    } catch {
      setAiResponse("Unable to analyze graph context. Try again.");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <FadeIn className="space-y-4">
      <AlignmentGraphCanvas data={data} loading={isLoading} />

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setExpand((e) => !e)}>
          {expand ? "Collapse workforce" : "Expand full workforce"}
        </Button>
        {data && (
          <span className="self-center text-xs text-slate-500">
            {data.meta.nodeCount} nodes · {data.meta.edgeCount} relationships
          </span>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 to-indigo-950/30 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-white">Graph Intelligence</h3>
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {GRAPH_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAiQuery(p)}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-400 transition-colors hover:border-violet-500 hover:text-violet-300"
            >
              {p}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask about alignment, dependencies, risk propagation..."
            className="border-slate-700 bg-slate-900"
            onKeyDown={(e) => e.key === "Enter" && void askGraphAi()}
          />
          <Button onClick={() => void askGraphAi()} disabled={aiLoading}>
            {aiLoading ? "Analyzing…" : "Ask"}
          </Button>
        </div>
        {aiResponse && (
          <p className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2 text-sm text-slate-300">
            {aiResponse}
          </p>
        )}
      </div>
    </FadeIn>
  );
}
