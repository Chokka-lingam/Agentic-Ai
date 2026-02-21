import type { TravelRequest } from "@/lib/types";

export const TRAVEL_SYSTEM_PROMPT = `You are TravelGuidePro, a senior AI travel planner.
Your outputs must be practical, realistic, and safety-conscious.

Rules:
1) Return ONLY valid JSON with no markdown, no backticks, and no extra commentary.
2) Follow the exact output schema requested by the user.
3) Costs must be realistic for the destination, travel dates, and budget.
4) Do not invent impossible places or clearly fake venues; if uncertain, use "popular local option" wording.
5) Keep daily schedules feasible with travel time consideration.
6) Include concise but actionable safety notes.
7) Respect travel type preferences (solo/couple/family/friends).
8) Mention transportation options that are commonly available in that city/region.
`;

export function buildTravelUserPrompt(input: TravelRequest): string {
  const start = new Date(`${input.startDate}T00:00:00.000Z`);
  const end = new Date(`${input.endDate}T00:00:00.000Z`);
  const msPerDay = 24 * 60 * 60 * 1000;
  const tripLengthDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;

  return `Create a travel plan based on:
- Destination: ${input.destination}
- Start date: ${input.startDate}
- End date: ${input.endDate}
- Trip length in days: ${tripLengthDays}
- Budget range: ${input.budgetRange}
- Travel type: ${input.travelType}
- Interests: ${input.interests.join(", ")}

Hard constraints:
- "daily_plan" must include exactly ${tripLengthDays} day entries.
- Day numbers must be sequential starting at 1.
- "date" values must be sequential calendar dates from ${input.startDate} through ${input.endDate}.

Return strict JSON in this exact shape:
{
  "summary": "",
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
