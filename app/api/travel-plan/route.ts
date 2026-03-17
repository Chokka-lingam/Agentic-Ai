import OpenAI from "openai";
import { NextResponse } from "next/server";
import { buildTravelUserPrompt, TRAVEL_SYSTEM_PROMPT } from "@/lib/prompts";
import { TravelRequestSchema, TravelResponseSchema } from "@/lib/validation";

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey ? new OpenAI({ apiKey }) : null;

export async function POST(request: Request) {
  try {
    if (!client) {
      return NextResponse.json(
        {
          error:
            "Server is missing OPENAI_API_KEY. Add it in your environment variables.",
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const parsedInput = TravelRequestSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          issues: parsedInput.error.flatten(),
        },
        { status: 400 },
      );
    }

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TRAVEL_SYSTEM_PROMPT },
        { role: "user", content: buildTravelUserPrompt(parsedInput.data) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "No itinerary generated. Please try again." },
        { status: 502 },
      );
    }

    const rawJson = JSON.parse(content);
    const parsedOutput = TravelResponseSchema.safeParse(rawJson);

    if (!parsedOutput.success) {
      return NextResponse.json(
        {
          error: "AI response format validation failed.",
          issues: parsedOutput.error.flatten(),
        },
        { status: 502 },
      );
    }

    return NextResponse.json(parsedOutput.data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: `Failed to generate itinerary: ${message}` },
      { status: 500 },
    );
  }
}
