import type { Metadata } from "next";
import TravelForm from "@/components/TravelForm";

export const metadata: Metadata = {
  title: "Create Itenary | Tripnova",
};

export default function TravelFormPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-slate-200 bg-white px-6 py-7 shadow-card sm:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-sky-600">Create your own itenary</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Build a complete itinerary</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Enter your destination, dates, budget, and interests to generate a multi-day travel plan with map-ready places and estimated costs.
        </p>
      </section>

      <TravelForm />
    </div>
  );
}
