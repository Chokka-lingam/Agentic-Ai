import { promises as fs } from "node:fs";
import path from "node:path";
import type { ItineraryListItem, StoredItinerary, TravelRequest, TravelResponse } from "@/lib/types";

const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "ai-travel-guide-agent") : path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "itineraries.json");

export async function createItinerary(input: TravelRequest, plan: TravelResponse): Promise<StoredItinerary> {
  const store = await readStore();
  const now = new Date().toISOString();
  const record: StoredItinerary = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    input,
    plan,
  };

  store.unshift(record);
  await writeStore(store);
  return record;
}

export async function listItineraries(): Promise<ItineraryListItem[]> {
  const store = await readStore();
  return store.map((record) => ({
    id: record.id,
    destination: record.input.destination,
    startDate: record.input.startDate,
    endDate: record.input.endDate,
    travelType: record.input.travelType,
    totalEstimatedBudget: record.plan.total_estimated_budget,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));
}

export async function getItineraryById(id: string): Promise<StoredItinerary | null> {
  const store = await readStore();
  return store.find((record) => record.id === id) ?? null;
}

export async function updateItineraryPlan(
  id: string,
  plan: TravelResponse,
): Promise<StoredItinerary | null> {
  const store = await readStore();
  const index = store.findIndex((record) => record.id === id);
  if (index === -1) {
    return null;
  }

  const updated: StoredItinerary = {
    ...store[index],
    updatedAt: new Date().toISOString(),
    plan,
  };

  store[index] = updated;
  await writeStore(store);
  return updated;
}

async function readStore(): Promise<StoredItinerary[]> {
  await ensureStore();
  const raw = await fs.readFile(STORE_FILE, "utf8");
  if (!raw.trim()) {
    return [];
  }

  const parsed = JSON.parse(raw) as StoredItinerary[];
  return Array.isArray(parsed) ? parsed : [];
}

async function writeStore(store: StoredItinerary[]): Promise<void> {
  await ensureStore();
  const tempFile = `${STORE_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tempFile, STORE_FILE);
}

async function ensureStore(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(STORE_FILE);
  } catch {
    await fs.writeFile(STORE_FILE, "[]", "utf8");
  }
}
