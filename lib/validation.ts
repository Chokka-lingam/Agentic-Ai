import { z } from "zod";
import { getTripDaysInclusive, isIsoDateString, parseIsoDate } from "@/lib/date";

const MAX_TRIP_DAYS = 14;

const DateSchema = z.string().refine((value) => isIsoDateString(value), {
  message: "Invalid date format. Use YYYY-MM-DD.",
});

export const TravelRequestSchema = z
  .object({
    destination: z.string().trim().min(2).max(120),
    startDate: DateSchema,
    endDate: DateSchema,
    budgetRange: z.string().trim().min(2).max(120),
    travelType: z.enum(["solo", "couple", "family", "friends"]),
    interests: z.array(z.string().trim().min(2).max(50)).min(1).max(10),
  })
  .superRefine((data, ctx) => {
    const start = parseIsoDate(data.startDate);
    const end = parseIsoDate(data.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Invalid travel dates.",
        path: ["startDate"],
      });
      return;
    }

    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "End date must be on or after the start date.",
        path: ["endDate"],
      });
    }

    const days = getTripDaysInclusive(data.startDate, data.endDate);
    if (days > MAX_TRIP_DAYS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Trip length cannot exceed ${MAX_TRIP_DAYS} days in a single request.`,
        path: ["endDate"],
      });
    }
  });

const PlannerTaskSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["transport", "stay", "activities", "budget"]),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["pending", "complete", "failed"]),
  notes: z.string().min(2).optional(),
});

export const PlannerResponseSchema = z
  .object({
    tasks: z.array(PlannerTaskSchema).min(4),
  })
  .superRefine((data, ctx) => {
    const covered = new Set(data.tasks.map((task) => task.type));
    for (const requiredType of ["transport", "stay", "activities", "budget"] as const) {
      if (!covered.has(requiredType)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Planner tasks must include at least one ${requiredType} task.`,
          path: ["tasks"],
        });
      }
    }
  });

export const TravelResponseSchema = z
  .object({
    summary: z.string().min(20),
    map_locations: z.array(z.string().trim().min(3)).min(3).max(12),
    daily_plan: z
      .array(
        z.object({
          day: z.number().int().positive(),
          date: DateSchema,
          activities: z.array(z.string().min(2)).min(1),
          food: z.array(z.string().min(2)).min(1),
          transport: z.string().min(3),
          estimated_cost: z.string().min(2),
        }),
      )
      .min(1),
    hotel_recommendations: z.array(z.string().min(2)).min(1),
    local_food_spots: z.array(z.string().min(2)).min(1),
    transportation_overview: z.array(z.string().min(2)).min(1),
    cost_breakdown: z.object({
      accommodation: z.string().min(2),
      food: z.string().min(2),
      transport: z.string().min(2),
      activities: z.string().min(2),
      misc: z.string().min(2),
    }),
    total_estimated_budget: z.string().min(2),
    packing_list: z.array(z.string().min(2)).min(3),
    travel_tips: z.array(z.string().min(2)).min(3),
    safety_notes: z.array(z.string().min(2)).min(2),
  })
  .superRefine((data, ctx) => {
    const expectedDay = data.daily_plan.length;
    const seenDates = new Set<string>();

    for (let index = 0; index < data.daily_plan.length; index += 1) {
      const current = data.daily_plan[index];
      const expectedIndexDay = index + 1;

      if (current.day !== expectedIndexDay) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Daily plan day numbering must be sequential starting from 1.",
          path: ["daily_plan", index, "day"],
        });
      }

      if (seenDates.has(current.date)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Daily plan dates must be unique.",
          path: ["daily_plan", index, "date"],
        });
      }
      seenDates.add(current.date);
    }

    if (expectedDay !== seenDates.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Daily plan dates are inconsistent.",
        path: ["daily_plan"],
      });
    }
  });
