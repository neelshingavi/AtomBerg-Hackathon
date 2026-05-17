import type { CopilotResponse } from "@/lib/intelligence/types";

export async function enhanceWithOpenAI(params: {
  userMessage: string;
  context: string;
  structured: CopilotResponse;
}): Promise<CopilotResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          {
            role: "system",
            content: `You are Atom AI Copilot, an executive decision-support assistant for organizational performance. 
Use ONLY the provided data context. Be concise, actionable, and executive-friendly.
Return JSON matching: { "summary": string, "reasoning": string[], "recommendations": string[] }
Do not invent metrics not in context.`,
          },
          {
            role: "user",
            content: `Context:\n${params.context}\n\nStructured analysis:\n${JSON.stringify(params.structured)}\n\nExecutive question: ${params.userMessage}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) return null;
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as {
      summary?: string;
      reasoning?: string[];
      recommendations?: string[];
    };

    return {
      ...params.structured,
      summary: parsed.summary ?? params.structured.summary,
      reasoning: parsed.reasoning?.length ? parsed.reasoning : params.structured.reasoning,
      recommendations: parsed.recommendations?.length
        ? parsed.recommendations
        : params.structured.recommendations,
    };
  } catch {
    return null;
  }
}

export async function* streamOpenAIText(
  userMessage: string,
  context: string
): AsyncGenerator<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0.3,
      stream: true,
      messages: [
        {
          role: "system",
          content:
            "You are Atom AI Copilot. Answer using only the provided organizational data. Be executive-brief.",
        },
        { role: "user", content: `Data:\n${context}\n\nQuestion: ${userMessage}` },
      ],
    }),
  });

  if (!res.ok || !res.body) return;

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        /* skip */
      }
    }
  }
}
