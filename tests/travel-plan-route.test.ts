import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn(),
}));

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: mockCreate,
        },
      };
    }
  };
});

describe("POST /api/travel-plan", () => {
  let originalCwd = process.cwd();
  let tempDir = "";

  beforeEach(async () => {
    vi.resetModules();
    mockCreate.mockReset();
    originalCwd = process.cwd();
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "travel-plan-route-test-"));
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_MAX_RETRIES;
    delete process.env.OPENAI_TIMEOUT_MS;
  });

  it("returns 400 when request payload is invalid", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const { POST } = await import("@/app/api/travel-plan/route");

    const request = new Request("http://localhost/api/travel-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: "A" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload.");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when OPENAI_API_KEY is missing", async () => {
    const { POST } = await import("@/app/api/travel-plan/route");

    const request = new Request("http://localhost/api/travel-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRequest()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/missing OPENAI_API_KEY/i);
  });

  it("returns an itinerary and request header when planning and synthesis succeed", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(validPlanner()) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(validPlan()) } }],
      });
    const { POST } = await import("@/app/api/travel-plan/route");

    const request = new Request("http://localhost/api/travel-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRequest()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.summary).toBe("2-day sample itinerary");
    expect(body.map_locations).toEqual(validPlan().map_locations);
    expect(response.headers.get("x-request-id")).toBeTypeOf("string");
    expect(mockCreate).toHaveBeenCalledTimes(2);

    expect(mockCreate).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        response_format: { type: "json_object" },
        temperature: 0.2,
      }),
    );
    expect(mockCreate).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    );
  });

  it("returns 502 when model output day count violates server date-span checks", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockCreate
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify(validPlanner()) } }],
      })
      .mockResolvedValueOnce({
        choices: [{ message: { content: JSON.stringify({ ...validPlan(), daily_plan: [validPlan().daily_plan[0]] }) } }],
      });
    const { POST } = await import("@/app/api/travel-plan/route");

    const request = new Request("http://localhost/api/travel-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRequest()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toContain("AI response consistency check failed");
  });
});

function validRequest() {
  return {
    destination: "Kyoto, Japan",
    startDate: "2026-04-10",
    endDate: "2026-04-11",
    budgetRange: "$1800-$2500",
    travelType: "couple",
    interests: ["food", "history", "nature"],
  };
}

function validPlan() {
  return {
    summary: "2-day sample itinerary",
    map_locations: [
      "Kiyomizu-dera, Kyoto, Japan",
      "Gion, Kyoto, Japan",
      "Arashiyama Bamboo Grove, Kyoto, Japan",
    ],
    daily_plan: [
      {
        day: 1,
        date: "2026-04-10",
        activities: ["Kiyomizu-dera", "Gion walk"],
        food: ["Nishiki Market lunch"],
        transport: "Subway + walking",
        estimated_cost: "$180",
      },
      {
        day: 2,
        date: "2026-04-11",
        activities: ["Arashiyama bamboo grove", "Fushimi Inari evening"],
        food: ["Local ramen dinner"],
        transport: "JR + bus",
        estimated_cost: "$170",
      },
    ],
    hotel_recommendations: ["Gion district business hotel"],
    local_food_spots: ["Nishiki Market"],
    transportation_overview: ["ICOCA card for transit"],
    cost_breakdown: {
      accommodation: "$500",
      food: "$300",
      transport: "$140",
      activities: "$220",
      misc: "$100",
    },
    total_estimated_budget: "$1260",
    packing_list: ["Comfortable walking shoes", "Portable umbrella", "Transit card holder"],
    travel_tips: [
      "Book major attractions in advance.",
      "Start early for popular shrines.",
      "Carry cash for smaller food stalls.",
    ],
    safety_notes: ["Keep emergency contact details accessible.", "Watch for bike traffic on narrow streets."],
  };
}

function validPlanner() {
  return {
    tasks: [
      { id: "task-1", type: "transport", priority: "high", status: "pending", notes: "Use ICOCA for transit." },
      { id: "task-2", type: "stay", priority: "high", status: "pending", notes: "Stay near Gion or Kyoto Station." },
      { id: "task-3", type: "activities", priority: "medium", status: "pending", notes: "Balance temples and food stops." },
      { id: "task-4", type: "budget", priority: "medium", status: "pending", notes: "Keep daily spend under plan." },
    ],
  };
}
