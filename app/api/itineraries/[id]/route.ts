import { NextResponse } from "next/server";
import { getItineraryById, updateItineraryPlan } from "@/lib/itinerary-store";
import { logError, newRequestId } from "@/lib/observability";
import { validateDailyPlanAgainstDates } from "@/lib/travel-plan-service";
import { TravelResponseSchema } from "@/lib/validation";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  try {
    const { id } = await context.params;
    const itinerary = await getItineraryById(id);
    if (!itinerary) {
      const notFound = NextResponse.json({ error: "Itinerary not found.", request_id: requestId }, { status: 404 });
      notFound.headers.set("x-request-id", requestId);
      return notFound;
    }

    const response = NextResponse.json({ itinerary, request_id: requestId });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    logError("get_itinerary_failed", { requestId, error: message });
    const response = NextResponse.json(
      { error: `Failed to load itinerary: ${message}`, request_id: requestId },
      { status: 500 },
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = newRequestId();
  try {
    const { id } = await context.params;
    const existing = await getItineraryById(id);
    if (!existing) {
      const notFound = NextResponse.json({ error: "Itinerary not found.", request_id: requestId }, { status: 404 });
      notFound.headers.set("x-request-id", requestId);
      return notFound;
    }

    const body = await request.json();
    const parsed = TravelResponseSchema.safeParse(body?.plan);
    if (!parsed.success) {
      const badRequest = NextResponse.json(
        { error: "Invalid itinerary payload.", issues: parsed.error.flatten(), request_id: requestId },
        { status: 400 },
      );
      badRequest.headers.set("x-request-id", requestId);
      return badRequest;
    }

    validateDailyPlanAgainstDates(existing.input, parsed.data);

    const updated = await updateItineraryPlan(id, parsed.data);
    if (!updated) {
      const notFound = NextResponse.json({ error: "Itinerary not found.", request_id: requestId }, { status: 404 });
      notFound.headers.set("x-request-id", requestId);
      return notFound;
    }

    const response = NextResponse.json({ itinerary: updated, request_id: requestId });
    response.headers.set("x-request-id", requestId);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    logError("update_itinerary_failed", { requestId, error: message });
    const response = NextResponse.json(
      { error: `Failed to update itinerary: ${message}`, request_id: requestId },
      { status: 500 },
    );
    response.headers.set("x-request-id", requestId);
    return response;
  }
}
