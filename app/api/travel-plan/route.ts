import OpenAI from "openai";
import { NextResponse } from "next/server";
import { createItinerary } from "@/lib/itinerary-store";
import { logError, logInfo, newRequestId } from "@/lib/observability";
import { generateTravelPlanWithLLM } from "@/lib/travel-plan-service";
import { TravelRequestSchema } from "@/lib/validation";

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const apiKey = process.env.OPENAI_API_KEY;
const timeoutMs = Number(process.env.OPENAI_TIMEOUT_MS || 20000);
const maxRetries = Number(process.env.OPENAI_MAX_RETRIES || 2);

const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(request: Request) {
  const requestId = newRequestId();
  const start = Date.now();

  try {
    if (!client) {
      logError("travel_plan_missing_api_key", { requestId });
      const response = NextResponse.json(
        { error: "Server is missing OPENAI_API_KEY. Add it in your environment variables." },
        { status: 500 },
      );
      response.headers.set("x-request-id", requestId);
      return response;
    }

    const body = await request.json();
    const parsedInput = TravelRequestSchema.safeParse(body);

    if (!parsedInput.success) {
      logInfo("travel_plan_invalid_request", {
        requestId,
        issues: parsedInput.error.flatten(),
      });
      const response = NextResponse.json(
        { error: "Invalid request payload.", issues: parsedInput.error.flatten() },
        { status: 400 },
      );
      response.headers.set("x-request-id", requestId);
      return response;
    }

    logInfo("travel_plan_request_started", {
      requestId,
      model,
      destination: parsedInput.data.destination,
      startDate: parsedInput.data.startDate,
      endDate: parsedInput.data.endDate,
      travelType: parsedInput.data.travelType,
      interestsCount: parsedInput.data.interests.length,
    });

    const generated = await generateTravelPlanWithLLM(client, parsedInput.data, {
      model,
      retries: maxRetries,
      timeoutMs,
    });
    const saved = await createItinerary(parsedInput.data, generated.plan);
    const durationMs = Date.now() - start;

    logInfo("travel_plan_request_succeeded", {
      requestId,
      itineraryId: saved.id,
      durationMs,
      attempts: generated.attempts,
      usage: generated.usage,
    });

    const response = NextResponse.json({
      ...generated.plan,
      itinerary_id: saved.id,
      request_id: requestId,
    });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    logError("travel_plan_request_failed", {
      requestId,
      durationMs: Date.now() - start,
      error: message,
    });
    const response = NextResponse.json(
      { error: `Failed to generate itinerary: ${message}`, request_id: requestId },
      { status: 500 },
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
