import { getTripDaysInclusive } from "@/lib/date";
import type { PlannerTask, TravelRequest } from "@/lib/types";

export const TRAVEL_CHAT_SYSTEM_PROMPT = `You are TravelGuidePro Chat, a practical travel assistant.
You answer general travel-related questions, including destinations, visas at a high level, budgets, packing, transport, safety, seasons, neighborhoods, food, cultural etiquette, and itinerary ideas.

Rules:
1) Answer in plain text, not JSON.
2) Be helpful for both quick Q&A and more detailed travel planning.
3) If the user asks for an itinerary but important details are missing, make reasonable assumptions and state them briefly.
4) If the question depends on official rules, availability, pricing, or schedules that may change, clearly say the user should verify with official sources before booking or traveling.
5) Do not answer unrelated non-travel questions. Briefly redirect back to travel topics.
6) Keep answers concise but specific and actionable.
7) Do not use markdown formatting such as **bold**, headings, code blocks, or tables.`;

export const TRAVEL_SYSTEM_PROMPT = `You are TravelGuidePro, a senior AI travel planner.
Your output must be practical, realistic, and safety-conscious.

Hard rules:
1) Return ONLY valid JSON. No markdown, no comments, no extra keys.
2) Follow the exact schema from the user prompt.
3) Do not invent impossible or fictional venues.
4) Keep itineraries logistically feasible and avoid impossible same-day transfers.
5) Cost estimates must be realistic for destination + duration + budget.
6) Keep recommendations family-safe if travelType is family.
7) Include concise safety notes with concrete actions.
8) If uncertain about venue names, use "popular local option" phrasing.
`;

export const PLANNER_SYSTEM_PROMPT = `You are TravelGuidePro Planner.
You must create machine-readable planning tasks before itinerary synthesis.
Return ONLY valid JSON with no markdown, no comments, and no extra keys.
`;

export function buildPlanningPrompt(input: TravelRequest): string {
  const totalDays = getTripDaysInclusive(input.startDate, input.endDate);

  return `Create planning tasks for this trip.

Trip details:
- Destination: ${input.destination}
- Start date: ${input.startDate}
- End date: ${input.endDate}
- Duration: ${totalDays} day(s)
- Budget range: ${input.budgetRange}
- Travel type: ${input.travelType}
- Interests: ${input.interests.join(", ")}

Rules:
- Return at least one task for each type: transport, stay, activities, budget.
- Use realistic task notes tied to destination and traveler profile.
- Set status as pending unless there is a strong reason to mark failed.

Return strict JSON in this exact shape:
{
  "tasks": [
    {
      "id": "task-1",
      "type": "transport",
      "priority": "high",
      "status": "pending",
      "notes": ""
    }
  ]
}`;
}

function serializePlannerTasks(tasks: PlannerTask[]): string {
  return tasks
    .map(
      (task) =>
        `- [${task.id}] type=${task.type}; priority=${task.priority}; status=${task.status}; notes=${task.notes || ""}`,
    )
    .join("\n");
}

export function buildTravelUserPrompt(input: TravelRequest, tasks: PlannerTask[]): string {
  const totalDays = getTripDaysInclusive(input.startDate, input.endDate);

  return `Create a ${totalDays}-day travel itinerary.

Trip details:
- Destination: ${input.destination}
- Start date: ${input.startDate}
- End date: ${input.endDate}
- Budget range: ${input.budgetRange}
- Travel type: ${input.travelType}
- Interests: ${input.interests.join(", ")}

Planning constraints (must follow):
${serializePlannerTasks(tasks)}

Output requirements:
- daily_plan length MUST be exactly ${totalDays}
- daily_plan.day MUST be sequential starting from 1
- daily_plan.date MUST match each day from ${input.startDate} to ${input.endDate}
- Keep activities balanced (2-4 activity items/day)
- Include transportation that is commonly available locally
- Include map_locations as 5-10 map-search-ready queries in this format:
  "Exact Place Name, Area/City, Country"
- map_locations MUST be specific enough for map lookup (avoid generic phrases)

Return strict JSON in this exact shape:
{
  "summary": "",
  "map_locations": [""],
  "daily_plan": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "activities": [""],
      "food": [""],
      "transport": "",
      "estimated_cost": ""
    }
  ],
  "hotel_recommendations": [""],
  "local_food_spots": [""],
  "transportation_overview": [""],
  "cost_breakdown": {
    "accommodation": "",
    "food": "",
    "transport": "",
    "activities": "",
    "misc": ""
  },
  "total_estimated_budget": "",
  "packing_list": [""],
  "travel_tips": [""],
  "safety_notes": [""]
}`;
} 

export function buildTravelChatPrompt(message: string): string {
  return `User travel question:
${message}

Provide a helpful travel-focused reply.`;
}
