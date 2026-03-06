"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type {
  ItineraryListItem,
  TravelPlanApiResponse,
  TravelRequest,
  TravelResponse,
  TravelType,
} from "@/lib/types";

const interestOptions = ["adventure", "food", "history", "nightlife", "nature", "culture", "shopping"];

const initialForm: TravelRequest = {
  destination: "",
  startDate: "",
  endDate: "",
  budgetRange: "",
  travelType: "solo",
  interests: [],
};

type FormErrors = Partial<Record<keyof TravelRequest, string>>;

function validate(form: TravelRequest): FormErrors {
  const errors: FormErrors = {};
  if (form.destination.trim().length < 2) errors.destination = "Destination must be at least 2 characters.";
  if (!form.startDate) errors.startDate = "Start date is required.";
  if (!form.endDate) errors.endDate = "End date is required.";
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    errors.endDate = "End date must be after start date.";
  }
  if (form.budgetRange.trim().length < 2) errors.budgetRange = "Budget range is required.";
  if (form.interests.length === 0) errors.interests = "Select at least one interest.";
  return errors;
}

export default function TravelForm() {
  const [form, setForm] = useState<TravelRequest>(initialForm);
  const [result, setResult] = useState<TravelPlanApiResponse | null>(null);
  const [history, setHistory] = useState<ItineraryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isSavingEdits, setIsSavingEdits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [editSummary, setEditSummary] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const canSubmit = useMemo(() => !isLoading, [isLoading]);

  useEffect(() => {
    void loadHistory();
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formErrors = validate(form);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/travel-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as TravelPlanApiResponse | { error?: string };
      if (!response.ok) {
        throw new Error((payload as { error?: string }).error || "Request failed");
      }

      const nextResult = payload as TravelPlanApiResponse;
      setResult(nextResult);
      setEditSummary(nextResult.summary);
      setEditBudget(nextResult.total_estimated_budget);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  function toggleInterest(value: string) {
    setForm((current) => ({
      ...current,
      interests: current.interests.includes(value)
        ? current.interests.filter((interest) => interest !== value)
        : [...current.interests, value],
    }));
  }

  async function loadHistory() {
    setIsHistoryLoading(true);
    try {
      const response = await fetch("/api/itineraries", { cache: "no-store" });
      const payload = (await response.json()) as { itineraries?: ItineraryListItem[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error || "Failed to load history");
      }
      setHistory(payload.itineraries ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load history");
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function loadItineraryById(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/itineraries/${id}`, { cache: "no-store" });
      const payload = (await response.json()) as {
        itinerary?: { id: string; input: TravelRequest; plan: TravelResponse };
        error?: string;
      };
      if (!response.ok || !payload.itinerary) {
        throw new Error(payload.error || "Failed to load itinerary");
      }

      const nextResult: TravelPlanApiResponse = {
        ...payload.itinerary.plan,
        itinerary_id: payload.itinerary.id,
        request_id: "history-load",
      };
      setResult(nextResult);
      setForm(payload.itinerary.input);
      setEditSummary(nextResult.summary);
      setEditBudget(nextResult.total_estimated_budget);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load itinerary");
    }
  }

  async function saveEdits() {
    if (!result?.itinerary_id) return;

    setIsSavingEdits(true);
    setError(null);
    try {
      const planPayload: TravelResponse = {
        ...result,
        summary: editSummary,
        total_estimated_budget: editBudget,
      };

      const response = await fetch(`/api/itineraries/${result.itinerary_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planPayload }),
      });
      const payload = (await response.json()) as {
        itinerary?: { id: string; plan: TravelResponse };
        error?: string;
      };
      if (!response.ok || !payload.itinerary) {
        throw new Error(payload.error || "Failed to save edits");
      }

      const updatedResult: TravelPlanApiResponse = {
        ...payload.itinerary.plan,
        itinerary_id: payload.itinerary.id,
        request_id: result.request_id,
      };
      setResult(updatedResult);
      await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save edits");
    } finally {
      setIsSavingEdits(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[440px,1fr]">
      <form className="card h-fit" onSubmit={onSubmit}>
        <h2 className="mb-4 text-lg font-semibold">Plan your trip</h2>

        <label className="label" htmlFor="destination">Destination</label>
        <input
          id="destination"
          className="input mb-1"
          value={form.destination}
          onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
          placeholder="e.g. Tokyo, Japan"
        />
        {errors.destination && <p className="mb-3 text-xs text-red-600">{errors.destination}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="startDate">Start date</label>
            <input
              id="startDate"
              type="date"
              className="input mb-1"
              value={form.startDate}
              onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            />
            {errors.startDate && <p className="text-xs text-red-600">{errors.startDate}</p>}
          </div>
          <div>
            <label className="label" htmlFor="endDate">End date</label>
            <input
              id="endDate"
              type="date"
              className="input mb-1"
              value={form.endDate}
              onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            />
            {errors.endDate && <p className="text-xs text-red-600">{errors.endDate}</p>}
          </div>
        </div>

        <label className="label mt-3" htmlFor="budgetRange">Budget range</label>
        <input
          id="budgetRange"
          className="input mb-1"
          value={form.budgetRange}
          onChange={(e) => setForm((f) => ({ ...f, budgetRange: e.target.value }))}
          placeholder="e.g. $1500 - $2500"
        />
        {errors.budgetRange && <p className="mb-3 text-xs text-red-600">{errors.budgetRange}</p>}

        <label className="label mt-3" htmlFor="travelType">Travel type</label>
        <select
          id="travelType"
          className="input"
          value={form.travelType}
          onChange={(e) => setForm((f) => ({ ...f, travelType: e.target.value as TravelType }))}
        >
          <option value="solo">Solo</option>
          <option value="couple">Couple</option>
          <option value="family">Family</option>
          <option value="friends">Friends</option>
        </select>

        <p className="label mt-3">Interests</p>
        <div className="mb-1 flex flex-wrap gap-2">
          {interestOptions.map((option) => {
            const selected = form.interests.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleInterest(option)}
                className={`rounded-full border px-3 py-1.5 text-sm transition ${
                  selected
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                }`}
              >
                {option}
              </button>
            );
          })}
        </div>
        {errors.interests && <p className="mb-3 text-xs text-red-600">{errors.interests}</p>}

        <button
          disabled={!canSubmit}
          type="submit"
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Generating itinerary..." : "Generate travel plan"}
        </button>

        {error && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="mt-6 border-t border-slate-200 pt-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Saved itineraries</h3>
            <button
              type="button"
              onClick={() => void loadHistory()}
              className="text-xs font-medium text-brand-700 underline"
            >
              Refresh
            </button>
          </div>
          <div className="max-h-56 space-y-2 overflow-auto">
            {isHistoryLoading && <p className="text-xs text-slate-500">Loading history...</p>}
            {!isHistoryLoading && history.length === 0 && (
              <p className="text-xs text-slate-500">No itineraries saved yet.</p>
            )}
            {history.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`w-full rounded-md border p-2 text-left text-xs ${
                  result?.itinerary_id === item.id ? "border-brand-500 bg-brand-50" : "border-slate-200"
                }`}
                onClick={() => void loadItineraryById(item.id)}
              >
                <p className="font-semibold">{item.destination}</p>
                <p className="text-slate-600">{item.startDate} to {item.endDate}</p>
                <p className="text-slate-600">{item.totalEstimatedBudget}</p>
              </button>
            ))}
          </div>
        </div>
      </form>

      <section className="card min-h-[420px]">
        {!result ? (
          <div className="flex h-full items-center justify-center text-center text-slate-500">
            {isLoading ? "AI is crafting your itinerary..." : "Your generated itinerary will appear here."}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold">Trip Summary</h3>
              <p className="mt-2 text-sm text-slate-700">{result.summary}</p>
            </div>

            <div>
              <h4 className="text-lg font-semibold">Day-by-day plan</h4>
              <div className="mt-3 space-y-3">
                {result.daily_plan.map((day) => (
                  <div key={`${day.day}-${day.date}`} className="rounded-xl border border-slate-200 p-4">
                    <p className="font-semibold">Day {day.day} - {day.date}</p>
                    <p className="mt-2 text-sm"><strong>Activities:</strong> {day.activities.join(", ")}</p>
                    <p className="mt-1 text-sm"><strong>Food:</strong> {day.food.join(", ")}</p>
                    <p className="mt-1 text-sm"><strong>Transport:</strong> {day.transport}</p>
                    <p className="mt-1 text-sm"><strong>Estimated cost:</strong> {day.estimated_cost}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoList title="Hotel recommendations" items={result.hotel_recommendations} />
              <InfoList title="Local food spots" items={result.local_food_spots} />
              <InfoList title="Transportation overview" items={result.transportation_overview} />
              <InfoList title="Packing list" items={result.packing_list} />
              <InfoList title="Travel tips" items={result.travel_tips} />
              <InfoList title="Safety notes" items={result.safety_notes} />
            </div>

            <div>
              <h4 className="text-lg font-semibold">Cost breakdown</h4>
              <ul className="mt-2 grid gap-1 text-sm text-slate-700">
                <li>Accommodation: {result.cost_breakdown.accommodation}</li>
                <li>Food: {result.cost_breakdown.food}</li>
                <li>Transport: {result.cost_breakdown.transport}</li>
                <li>Activities: {result.cost_breakdown.activities}</li>
                <li>Misc: {result.cost_breakdown.misc}</li>
              </ul>
              <p className="mt-2 font-semibold">Total Estimated Budget: {result.total_estimated_budget}</p>
            </div>

            {result.itinerary_id && (
              <div className="rounded-xl border border-slate-200 p-4">
                <h4 className="text-lg font-semibold">Edit saved itinerary</h4>
                <label className="label mt-3" htmlFor="editSummary">Summary</label>
                <textarea
                  id="editSummary"
                  className="input min-h-28"
                  value={editSummary}
                  onChange={(event) => setEditSummary(event.target.value)}
                />
                <label className="label mt-3" htmlFor="editBudget">Total budget</label>
                <input
                  id="editBudget"
                  className="input"
                  value={editBudget}
                  onChange={(event) => setEditBudget(event.target.value)}
                />
                <button
                  type="button"
                  className="mt-3 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-70"
                  onClick={() => void saveEdits()}
                  disabled={isSavingEdits}
                >
                  {isSavingEdits ? "Saving..." : "Save edits"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h5 className="font-semibold">{title}</h5>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
