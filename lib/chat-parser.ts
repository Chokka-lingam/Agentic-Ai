import type { TravelRequest, TravelType } from "@/lib/types";

const MAX_TRIP_DAYS = 14;
const DEFAULT_TRIP_DAYS = 3;
const DEFAULT_INTERESTS = ["culture", "food"];

const KNOWN_INTERESTS = [
  "adventure",
  "food",
  "history",
  "nightlife",
  "nature",
  "culture",
  "shopping",
] as const;

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function toIsoDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function extractDurationDays(message: string): number {
  const matches = message.match(/(\d{1,2})\s*[- ]?\s*day(s)?/i);
  if (!matches) return DEFAULT_TRIP_DAYS;
  const parsed = Number.parseInt(matches[1], 10);
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_TRIP_DAYS;
  return Math.min(parsed, MAX_TRIP_DAYS);
}

function extractTravelType(message: string): TravelType {
  const lower = message.toLowerCase();
  if (lower.includes("family")) return "family";
  if (lower.includes("couple")) return "couple";
  if (lower.includes("friends") || lower.includes("friend")) return "friends";
  return "solo";
}

function extractBudgetRange(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("luxury") || lower.includes("high budget")) return "high budget";
  if (lower.includes("mid budget") || lower.includes("moderate")) return "mid budget";
  if (lower.includes("low budget") || lower.includes("budget") || lower.includes("cheap")) return "low budget";
  return "mid budget";
}

function extractInterests(message: string): string[] {
  const lower = message.toLowerCase();
  const interests = KNOWN_INTERESTS.filter((interest) => lower.includes(interest));
  return interests.length > 0 ? [...interests] : DEFAULT_INTERESTS;
}

function normalizeDestination(raw: string): string {
  return raw
    .replace(/\b(plan|trip|itinerary)\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/[.,;:]+$/, "")
    .trim();
}

function extractDestination(message: string): string | null {
  const trimmed = message.trim();

  const withToIn = trimmed.match(
    /(?:to|in)\s+([a-zA-Z][a-zA-Z\s,.-]{1,80}?)(?:\s+(?:trip|plan|for|with|on)\b|$)/i,
  );
  if (withToIn?.[1]) {
    const destination = normalizeDestination(withToIn[1]);
    if (destination.length >= 2) return destination;
  }

  const beforeDays = trimmed.match(/^([a-zA-Z][a-zA-Z\s,.-]{1,80}?)\s+\d{1,2}\s*[- ]?\s*day/i);
  if (beforeDays?.[1]) {
    const destination = normalizeDestination(beforeDays[1]);
    if (destination.length >= 2) return destination;
  }

  const beforeTrip = trimmed.match(/([a-zA-Z][a-zA-Z\s,.-]{1,80}?)\s+trip/i);
  if (beforeTrip?.[1]) {
    const destination = normalizeDestination(beforeTrip[1]);
    if (destination.length >= 2) return destination;
  }

  return null;
}

function extractDates(message: string, days: number): { startDate: string; endDate: string } {
  const dateMatches = message.match(/\d{4}-\d{2}-\d{2}/g);
  if (dateMatches && dateMatches.length >= 2) {
    return { startDate: dateMatches[0], endDate: dateMatches[1] };
  }

  const today = new Date();
  const startDate = addDays(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())), 1);
  const endDate = addDays(startDate, days - 1);
  return { startDate: toIsoDate(startDate), endDate: toIsoDate(endDate) };
}

export function parseTravelRequestFromChat(message: string): { data?: TravelRequest; error?: string } {
  const destination = extractDestination(message);
  if (!destination) {
    return {
      error:
        "Please include a destination in your message. Example: Plan a 5-day trip to Japan on a mid budget with food and nightlife.",
    };
  }

  const days = extractDurationDays(message);
  const { startDate, endDate } = extractDates(message, days);

  return {
    data: {
      destination,
      startDate,
      endDate,
      budgetRange: extractBudgetRange(message),
      travelType: extractTravelType(message),
      interests: extractInterests(message),
    },
  };
}
