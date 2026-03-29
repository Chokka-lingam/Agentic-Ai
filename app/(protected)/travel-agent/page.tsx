import type { Metadata } from "next";
import TravelChat from "@/components/TravelChat";

export const metadata: Metadata = {
  title: "Travel Chat Agent | Tripnova AI",
};

export default function TravelAgentPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-card sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Travel Chat Agent</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Chat with your travel assistant</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Ask about destinations, best times to visit, transportation, budgets, visas, safety, or trip ideas in a dedicated AI chat.
        </p>
      </section>

      <TravelChat />
    </div>
  );
}
