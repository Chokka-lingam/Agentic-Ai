"use client";

import { useState } from "react";
import TravelChat from "@/components/TravelChat";
import TravelForm from "@/components/TravelForm";

type TabKey = "form" | "chat";

export default function TravelTabs() {
  const [activeTab, setActiveTab] = useState<TabKey>("form");

  return (
    <section>
      <div className="mb-5 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-card">
        <button
          type="button"
          onClick={() => setActiveTab("form")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "form"
              ? "bg-brand-500 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Create Itenary
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("chat")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            activeTab === "chat"
              ? "bg-brand-500 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Travel Agent Chat
        </button>
      </div>

      {activeTab === "form" ? <TravelForm /> : <TravelChat />}
    </section>
  );
}
