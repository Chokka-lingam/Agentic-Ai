import { z } from "zod";

const MAX_TRIP_DAYS = 30;

export const TravelRequestSchema = z.object({
  destination: z.string().min(2).max(120),
  startDate: z.string().date(),
  endDate: z.string().date(),
  budgetRange: z.string().min(2).max(120),
  travelType: z.enum(["solo", "couple", "family", "friends"]),
  interests: z.array(z.string().min(2).max(50)).min(1).max(10),
}).superRefine((value, ctx) => {
  const start = new Date(`${value.startDate}T00:00:00.000Z`);
  const end = new Date(`${value.endDate}T00:00:00.000Z`);

  if (end < start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: "End date must be on or after the start date.",
    });
    return;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  const spanDays = Math.floor((end.getTime() - start.getTime()) / msPerDay) + 1;
  if (spanDays > MAX_TRIP_DAYS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: `Trip duration cannot exceed ${MAX_TRIP_DAYS} days.`,
    });
  }
});

export const TravelResponseSchema = z.object({
  summary: z.string(),
  daily_plan: z.array(
    z.object({
      day: z.number().int().positive(),
      date: z.string(),
      activities: z.array(z.string()),
      food: z.array(z.string()),
      transport: z.string(),
      estimated_cost: z.string(),
    }),
  ),
  hotel_recommendations: z.array(z.string()),
  local_food_spots: z.array(z.string()),
  transportation_overview: z.array(z.string()),
  cost_breakdown: z.object({
    accommodation: z.string(),
    food: z.string(),
    transport: z.string(),
    activities: z.string(),
    misc: z.string(),
  }),
  total_estimated_budget: z.string(),
  packing_list: z.array(z.string()),
  travel_tips: z.array(z.string()),
  safety_notes: z.array(z.string()),
});
