import { NextResponse } from "next/server";

type NominatimResult = {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { place?: string };
    const place = body.place?.trim();

    if (!place || place.length < 2) {
      return NextResponse.json({ error: "Place name must be at least 2 characters." }, { status: 400 });
    }

    const endpoint = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
    const response = await fetch(endpoint, {
      headers: {
        "User-Agent": process.env.GEOCODING_USER_AGENT || "ai-travel-guide-agent/1.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch location coordinates." }, { status: 502 });
    }

    const results = (await response.json()) as NominatimResult[];
    const first = results[0];

    if (!first) {
      return NextResponse.json({ error: "Location not found." }, { status: 404 });
    }

    const latitude = Number.parseFloat(first.lat);
    const longitude = Number.parseFloat(first.lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return NextResponse.json({ error: "Invalid coordinates returned by geocoding provider." }, { status: 502 });
    }

    return NextResponse.json({
      location: {
        name: first.name || place,
        latitude,
        longitude,
        description: first.display_name,
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to geocode destination." }, { status: 500 });
  }
}
