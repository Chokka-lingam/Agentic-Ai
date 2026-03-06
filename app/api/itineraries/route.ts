import { NextResponse } from "next/server";
import { listItineraries } from "@/lib/itinerary-store";
import { logError, newRequestId } from "@/lib/observability";

export async function GET() {
  const requestId = newRequestId();
  try {
    const itineraries = await listItineraries();
    const response = NextResponse.json({ itineraries, request_id: requestId });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    logError("list_itineraries_failed", { requestId, error: message });
    const response = NextResponse.json(
      { error: `Failed to load itineraries: ${message}`, request_id: requestId },
      { status: 500 },
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
