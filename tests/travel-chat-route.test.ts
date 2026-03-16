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
    },
  };
});

describe("POST /api/travel-chat", () => {
  beforeEach(() => {
    vi.resetModules();
    mockCreate.mockReset();
  });

  afterEach(() => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
  });

  it("returns 400 when request payload is invalid", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const { POST } = await import("@/app/api/travel-chat/route");

    const request = new Request("http://localhost/api/travel-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe("Invalid request payload.");
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 500 when OPENAI_API_KEY is missing", async () => {
    const { POST } = await import("@/app/api/travel-chat/route");

    const request = new Request("http://localhost/api/travel-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Best time to visit Japan?" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error).toMatch(/missing OPENAI_API_KEY/i);
  });

  it("returns a travel answer and request header when generation succeeds", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "October to November is one of the best periods for mild weather and autumn colors." } }],
    });

    const { POST } = await import("@/app/api/travel-chat/route");

    const request = new Request("http://localhost/api/travel-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Best time to visit Japan?",
        history: [{ role: "assistant", text: "Ask me anything about travel." }],
      }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.answer).toContain("October to November");
    expect(response.headers.get("x-request-id")).toBeTypeOf("string");
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 0.4,
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "assistant", content: "Ask me anything about travel." }),
          expect.objectContaining({ role: "user" }),
        ]),
      }),
    );
  });

  it("returns 502 when the model returns an empty message", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
    });

    const { POST } = await import("@/app/api/travel-chat/route");

    const request = new Request("http://localhost/api/travel-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "What should I pack for Iceland in winter?" }),
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).toBe("No travel response generated. Please try again.");
  });
});
