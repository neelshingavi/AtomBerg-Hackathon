"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot,
  X,
  Send,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { sendCopilotMessage } from "@/hooks/useIntelligence";
import { COPILOT_OPEN_EVENT } from "@/components/layout/CommandPalette";
import { SUGGESTED_PROMPTS } from "@/lib/ai/query-router";
import { useCurrentCycle } from "@/hooks/useCurrentCycle";
import type { CopilotResponse } from "@/lib/intelligence/types";
import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/brand";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: CopilotResponse;
};

export function AtomCopilot() {
  const { data: session } = useSession();
  const { data: cycleData } = useCurrentCycle();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const role = session?.user?.role;
  const show = role === "ADMIN" || role === "MANAGER";

  useEffect(() => {
    const openCopilot = () => {
      setOpen(true);
      setExpanded(true);
    };
    window.addEventListener(COPILOT_OPEN_EVENT, openCopilot);
    return () => window.removeEventListener(COPILOT_OPEN_EVENT, openCopilot);
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;
      const userMsg: Message = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      const assistantId = `a-${Date.now()}`;
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
      setMessages((m) => [
        ...m,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      try {
        const { response } = await sendCopilotMessage(text, cycleData?.active?.id, {
          stream: true,
          onToken: (chunk) => {
            setMessages((m) =>
              m.map((msg) =>
                msg.id === assistantId
                  ? { ...msg, content: msg.content + chunk }
                  : msg
              )
            );
          },
        });
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: response.summary, response }
              : msg
          )
        );
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
        });
      } catch {
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? {
                  ...msg,
                  content:
                    "Unable to synthesize operational intelligence at this moment. Please retry.",
                }
              : msg
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [loading, cycleData?.active?.id]
  );

  if (!show) return null;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-cyan-500 text-white shadow-2xl shadow-brand-500/30 hover:scale-105 transition-transform"
            aria-label={`Open ${PRODUCT.copilotName}`}
            onClick={() => setOpen(true)}
          >
            <Sparkles className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={cn(
              "fixed z-50 flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl",
              expanded
                ? "bottom-6 right-6 h-[min(640px,calc(100dvh-3rem))] w-[min(420px,calc(100vw-2rem))]"
                : "bottom-6 right-6 h-14 w-[min(420px,calc(100vw-2rem))]"
            )}
          >
            <header className="flex items-center justify-between border-b bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">{PRODUCT.copilotName}</p>
                  <p className="text-[10px] text-white/80">Executive strategy advisor</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  aria-label={expanded ? "Minimize" : "Expand"}
                  onClick={() => setExpanded((e) => !e)}
                >
                  {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  aria-label="Close copilot"
                  onClick={() => setOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {expanded && (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Strategic advisor for organizational execution — risks, alignment,
                        escalations, and leadership interventions. Powered by live cycle intelligence.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SUGGESTED_PROMPTS.slice(0, 5).map((p) => (
                          <button
                            key={p}
                            type="button"
                            className="rounded-full border bg-muted/50 px-3 py-1.5 text-left text-xs hover:border-brand-300 hover:bg-brand-50"
                            onClick={() => void send(p)}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[90%] rounded-2xl px-3 py-2 text-sm",
                          msg.role === "user" ? "bg-brand-600 text-white" : "bg-muted border"
                        )}
                      >
                        <p className="leading-relaxed">{msg.content}</p>
                        {msg.response && <CopilotResponseDetail response={msg.response} />}
                      </div>
                    </div>
                  ))}

                  {loading &&
                    !messages.some(
                      (m) => m.role === "assistant" && m.content.length > 0
                    ) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="animate-pulse">Synthesizing operational intelligence…</span>
                    </div>
                  )}
                </div>

                <form
                  className="border-t p-3 flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    void send(input);
                  }}
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask your strategic advisor…"
                    disabled={loading}
                    className="flex-1"
                    aria-label="Copilot message"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={loading || !input.trim()}
                    className="bg-brand-600 hover:bg-brand-700"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function CopilotResponseDetail({ response }: { response: CopilotResponse }) {
  return (
    <div className="mt-3 space-y-2 border-t border-border/50 pt-2 text-xs">
      <div className="flex flex-wrap gap-1">
        <Badge variant="outline" className="text-[10px] capitalize">
          {response.urgency} urgency
        </Badge>
        <Badge variant="secondary" className="text-[10px]">
          {response.confidence}% confidence
        </Badge>
      </div>
      {response.metrics.length > 0 && (
        <div className="grid grid-cols-2 gap-1">
          {response.metrics.slice(0, 4).map((m) => (
            <div key={m.label} className="rounded bg-background/80 px-2 py-1">
              <span className="text-muted-foreground">{m.label}: </span>
              <span className="font-medium">{m.value}</span>
            </div>
          ))}
        </div>
      )}
      {response.reasoning.length > 0 && (
        <div>
          <p className="font-semibold text-muted-foreground mb-0.5">Reasoning</p>
          <ul className="space-y-0.5 text-muted-foreground">
            {response.reasoning.slice(0, 3).map((r, i) => (
              <li key={i}>• {r}</li>
            ))}
          </ul>
        </div>
      )}
      {response.recommendations.length > 0 && (
        <div className="flex items-start gap-1 text-brand-700">
          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
          <span>Leadership action → {response.recommendations[0]}</span>
        </div>
      )}
    </div>
  );
}
