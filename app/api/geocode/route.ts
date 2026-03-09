import { NextResponse } from "next/server";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

type GeocodeRequestBody = {
  place?: string;
  places?: string[];
  destinationContext?: string;
};

function sanitizePlaceForGeocode(place: string): string {
  const trimmed = place.trim();
  if (!trimmed) return trimmed;

  // If the value includes descriptive suffixes like "Place - details", geocode only the place name.
  if (trimmed.includes(" - ")) {
    return trimmed.split(" - ")[0].trim();
  }

  if (trimmed.includes("-")) {
    return trimmed.split("-")[0].trim();
  }

  return trimmed;
}

async function geocodeSinglePlace(place: string, destinationContext?: string) {
  const query =
    destinationContext && !place.toLowerCase().includes(destinationContext.toLowerCase())
      ? `${place}, ${destinationContext}`
      : place;

  const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": process.env.GEOCODING_USER_AGENT || "ai-travel-guide-agent/1.0",
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) return null;

  const results = (await response.json()) as NominatimResult[];
  const first = results[0];
  if (!first) return null;

  const latitude = Number.parseFloat(first.lat);
  const longitude = Number.parseFloat(first.lon);
  if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

  return {
    name: first.name || place,
    latitude,
    longitude,
    description: first.display_name,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GeocodeRequestBody;
    const placeList = body.places?.length ? body.places : body.place ? [body.place] : [];
    const normalizedPlaces = Array.from(
      new Set(placeList.map(sanitizePlaceForGeocode).filter((place) => place.length >= 2)),
    ).slice(0, 12);

    if (normalizedPlaces.length === 0) {
      console.warn("[geocode] No valid places in payload", { placeList });
      return NextResponse.json({ error: "At least one valid place is required." }, { status: 400 });
    }

    console.info("[geocode] Request received", {
      count: normalizedPlaces.length,
      places: normalizedPlaces,
      destinationContext: body.destinationContext,
    });

    const locations = (
      await Promise.all(normalizedPlaces.map((place) => geocodeSinglePlace(place, body.destinationContext)))
    ).filter((location): location is NonNullable<typeof location> => Boolean(location));

    console.info("[geocode] Resolved locations", {
      requested: normalizedPlaces.length,
      resolved: locations.length,
      names: locations.map((location) => location.name),
    });

    if (locations.length === 0) {
      return NextResponse.json({ error: "No matching coordinates found for the requested places." }, { status: 404 });
    }

    return NextResponse.json({
      locations,
    });
  } catch (error) {
    console.error("[geocode] Unexpected error", error);
    return NextResponse.json({ error: "Unable to geocode places." }, { status: 500 });
  }
}
