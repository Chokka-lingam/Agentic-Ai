import OpenAI from "openai";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildTravelChatPrompt, TRAVEL_CHAT_SYSTEM_PROMPT } from "@/lib/prompts";
import { TravelChatRequestSchema } from "@/lib/validation";
import type { TravelChatRequest } from "@/lib/types";

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey ? new OpenAI({ apiKey }) : null;

const REQUEST_TIMEOUT_MS = 25_000;
const MAX_LLM_ATTEMPTS = 2;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("LLM request timed out")), timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch((error: unknown) => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

async function generateWithRetry(
  payload: OpenAI.Chat.Completions.ChatCompletionCreateParams,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_LLM_ATTEMPTS; attempt += 1) {
    try {
      return (await withTimeout(
        client!.chat.completions.create(payload),
        REQUEST_TIMEOUT_MS,
      )) as OpenAI.Chat.Completions.ChatCompletion;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}

function validateInput(body: unknown): { ok: true; value: TravelChatRequest } | { ok: false; error: unknown } {
  const parsed = TravelChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.flatten(),
    };
  }

  return { ok: true, value: parsed.data };
}

export async function POST(request: Request) {
  const requestId = randomUUID();

  try {
    if (!client) {
      return NextResponse.json(
        {
          error: "Server is missing OPENAI_API_KEY. Add it in your environment variables.",
          requestId,
        },
        { status: 500 },
      );
    }

    const body = await request.json();
    const input = validateInput(body);

    if (!input.ok) {
      return NextResponse.json(
        {
          error: "Invalid request payload.",
          issues: input.error,
          requestId,
        },
        { status: 400 },
      );
    }

    const completion = await generateWithRetry({
      model,
      stream: false,
      temperature: 0.4,
      messages: [
        { role: "system", content: TRAVEL_CHAT_SYSTEM_PROMPT },
        ...(input.value.history ?? []).map((message) => ({
          role: message.role,
          content: message.text,
        })),
        { role: "user", content: buildTravelChatPrompt(input.value.message) },
      ],
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        {
          error: "No travel response generated. Please try again.",
          requestId,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      { answer },
      {
        status: 200,
        headers: { "x-request-id": requestId },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: `Failed to answer travel chat request: ${message}`, requestId },
      { status: 500 },
    );
  }
}
