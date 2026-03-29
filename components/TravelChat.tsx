"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ApiErrorResponse, TravelChatResponse } from "@/lib/types";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Math.random().toString(36).slice(2, 10)}`;
}

function renderFormattedText(text: string): ReactNode[] {
  const lines = text.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const currentLine = lines[index].trim();

    if (!currentLine) {
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(currentLine)) {
      const items: string[] = [];

      while (index < lines.length) {
        const line = lines[index].trim();
        if (!/^[-*]\s+/.test(line)) break;
        items.push(line.replace(/^[-*]\s+/, "").trim());
        index += 1;
      }

      blocks.push(
        <ul key={`ul-${index}`} className="list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`ul-item-${index}-${itemIndex}`}>{item}</li>
          ))}
        </ul>,
      );
      continue;
    }

    if (/^\d+\.\s+/.test(currentLine)) {
      const items: string[] = [];

      while (index < lines.length) {
        const line = lines[index].trim();
        if (!/^\d+\.\s+/.test(line)) break;
        items.push(line.replace(/^\d+\.\s+/, "").trim());
        index += 1;
      }

      blocks.push(
        <ol key={`ol-${index}`} className="list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={`ol-item-${index}-${itemIndex}`}>{item}</li>
          ))}
        </ol>,
      );
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length) {
      const line = lines[index].trim();
      if (!line || /^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
        break;
      }
      paragraphLines.push(line);
      index += 1;
    }

    blocks.push(
      <p key={`p-${index}`} className="whitespace-pre-wrap">
        {paragraphLines.join(" ")}
      </p>,
    );
  }

  return blocks;
}

export default function TravelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-welcome",
      role: "assistant",
      text:
        "Ask me anything about travel: destinations, budgets, transport, safety, visas, best time to visit, packing, or full trip ideas.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const canSend = useMemo(() => !isLoading && input.trim().length > 0, [isLoading, input]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isLoading) return;

    setInput("");

    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: "user",
        text: message,
      },
    ]);

    setIsLoading(true);

    try {
      const history = [
        ...messages.map((entry) => ({
          role: entry.role,
          text: entry.text,
        })),
        {
          role: "user" as const,
          text: message,
        },
      ];

      const response = await fetch("/api/travel-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          history,
        }),
      });

      const payload = (await response.json()) as TravelChatResponse | ApiErrorResponse;
      if (!response.ok) {
        const errorPayload = payload as ApiErrorResponse;
        throw new Error(errorPayload.error || "Request failed");
      }

      const chatResponse = payload as TravelChatResponse;
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          text: chatResponse.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          text: error instanceof Error ? error.message : "Unable to generate itinerary right now.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="card min-h-[560px] p-0 sm:min-h-[620px]">
      <header className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Travel Agent Chat</h2>
      </header>

      <div className="flex h-[500px] flex-col sm:h-[560px]">
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex min-w-0 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <article
                className={`max-w-[85%] min-w-0 break-words rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[75%] ${
                  message.role === "user"
                    ? "bg-sky-900 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                <div className="space-y-3">{renderFormattedText(message.text)}</div>
              </article>
            </div>
          ))}

          {isLoading && (
            <div className="flex min-w-0 justify-start">
              <article className="max-w-[75%] min-w-0 break-words rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
                AI is thinking through your travel question...
              </article>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-200 px-5 py-4">
          <form className="flex min-w-0 items-center gap-3" onSubmit={onSubmit}>
            <input
              className="input h-12 min-w-0 flex-1 rounded-xl text-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Is May a good time for Bali? How much for 7 days in Japan?..."
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!canSend}
              className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-400 text-white transition hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-70"
              aria-label="Send message"
            >
              <span className="text-base">&gt;</span>
            </button>
          </form>
        </footer>
      </div>
    </section>
  );
}
