"use client";

import { FormEvent, useMemo, useState } from "react";
import { parseTravelRequestFromChat } from "@/lib/chat-parser";
import type { ApiErrorResponse, TravelRequest, TravelResponse } from "@/lib/types";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  itinerary?: TravelResponse;
};

function createId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getTripDaysCount(payload: TravelRequest): number {
  const start = new Date(`${payload.startDate}T00:00:00.000Z`);
  const end = new Date(`${payload.endDate}T00:00:00.000Z`);
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

export default function TravelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: createId(),
      role: "assistant",
      text: "Tell me your travel goal and constraints. Example: Plan a 5-day Japan trip for 2 people on a mid budget with food and nightlife.",
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

    const parsed = parseTravelRequestFromChat(message);
    if (!parsed.data) {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          text: parsed.error || "I could not understand that request. Please try again.",
        },
      ]);
      return;
    }

    const travelRequest = parsed.data;
    setIsLoading(true);

    try {
      const response = await fetch("/api/travel-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(travelRequest),
      });

      const payload = (await response.json()) as TravelResponse | ApiErrorResponse;
      if (!response.ok) {
        const errorPayload = payload as ApiErrorResponse;
        throw new Error(errorPayload.error || "Request failed");
      }

      const itinerary = payload as TravelResponse;
      const days = getTripDaysCount(travelRequest);
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          text: `I built a ${days}-day plan for ${travelRequest.destination}.`,
          itinerary,
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
            <article
              key={message.id}
              className={`max-w-[96%] rounded-2xl px-4 py-3 text-sm leading-relaxed sm:max-w-[88%] ${
                message.role === "user"
                  ? "ml-auto bg-sky-900 text-white"
                  : "mr-auto bg-slate-100 text-slate-800"
              }`}
            >
              <p>{message.text}</p>
              {message.itinerary && (
                <div className="mt-4 space-y-3 rounded-xl bg-white/90 p-3 text-slate-900">
                  <p className="text-sm font-semibold">Trip Summary</p>
                  <p className="text-sm">{message.itinerary.summary}</p>
                  <p className="text-sm font-semibold">Day-by-day plan</p>
                  <ul className="space-y-2 text-sm">
                    {message.itinerary.daily_plan.map((day) => (
                      <li key={`${message.id}-${day.day}`}>
                        <span className="font-semibold">Day {day.day}:</span> {day.activities.join(", ")}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm font-semibold">
                    Total estimated budget: {message.itinerary.total_estimated_budget}
                  </p>
                </div>
              )}
            </article>
          ))}

          {isLoading && (
            <article className="mr-auto max-w-[88%] rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
              AI is crafting your itinerary...
            </article>
          )}
        </div>

        <footer className="border-t border-slate-200 px-5 py-4">
          <form className="flex items-center gap-3" onSubmit={onSubmit}>
            <input
              className="input h-12 flex-1 rounded-xl text-sm"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Plan a 5-day trip to Japan under $2500..."
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
