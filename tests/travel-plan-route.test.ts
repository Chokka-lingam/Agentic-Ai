import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockParse } = vi.hoisted(() => ({
  mockParse: vi.fn(),
}));

vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      beta = {
        chat: {
          completions: {
            parse: mockParse,
          },
        },
      };
    },
  };
});

describe("POST /api/travel-plan", () => {
  let originalCwd = process.cwd();
  let tempDir = "";

  beforeEach(async () => {
    vi.resetModules();
    mockParse.mockReset();
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
    expect(mockParse).not.toHaveBeenCalled();
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

  it("persists itinerary and returns response metadata", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: validPlan() } }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
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
    expect(body.itinerary_id).toBeTypeOf("string");
    expect(body.request_id).toBeTypeOf("string");

    const savedRaw = await fs.readFile(path.join(tempDir, "data", "itineraries.json"), "utf8");
    const saved = JSON.parse(savedRaw) as Array<{ id: string }>;
    expect(saved).toHaveLength(1);
    expect(saved[0].id).toBe(body.itinerary_id);
  });

  it("returns 500 when model output day count violates server date-span checks", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockParse.mockResolvedValue({
      choices: [{ message: { parsed: { ...validPlan(), daily_plan: [validPlan().daily_plan[0]] } } }],
      usage: { prompt_tokens: 100, completion_tokens: 200, total_tokens: 300 },
    });
    const { POST } = await import("@/app/api/travel-plan/route");

    const request = new Request("http://localhost/api/travel-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validRequest()),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toContain("Daily plan day count mismatch");
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
    packing_list: ["Comfortable walking shoes"],
    travel_tips: ["Book major attractions in advance."],
    safety_notes: ["Keep emergency contact details accessible."],
  };
}
