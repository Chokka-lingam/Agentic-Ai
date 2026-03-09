import OpenAI from "openai";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  buildPlanningPrompt,
  buildTravelUserPrompt,
  PLANNER_SYSTEM_PROMPT,
  TRAVEL_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { getTripDaysInclusive } from "@/lib/date";
import { PlannerResponseSchema, TravelRequestSchema, TravelResponseSchema } from "@/lib/validation";
import type { PlannerResponse, TravelRequest, TravelResponse } from "@/lib/types";

const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const apiKey = process.env.OPENAI_API_KEY;

const client = apiKey ? new OpenAI({ apiKey }) : null;

const REQUEST_TIMEOUT_MS = 25_000;
const MAX_LLM_ATTEMPTS = 2;

type ApiFailure = {
  status: number;
  error: string;
  issues?: unknown;
};

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

function validateBusinessRules(startDate: string, endDate: string, planLength: number): string | null {
  const expectedDays = getTripDaysInclusive(startDate, endDate);
  if (planLength !== expectedDays) {
    return `daily_plan length must be ${expectedDays} based on provided dates.`;
  }

  return null;
}

function validate_input(body: unknown): { ok: true; value: TravelRequest } | { ok: false; failure: ApiFailure } {
  const parsedInput = TravelRequestSchema.safeParse(body);

  if (!parsedInput.success) {
    return {
      ok: false,
      failure: {
        status: 400,
        error: "Invalid request payload.",
        issues: parsedInput.error.flatten(),
      },
    };
  }

  return { ok: true, value: parsedInput.data };
}

async function plan_tasks(input: TravelRequest): Promise<{ ok: true; value: PlannerResponse } | { ok: false; failure: ApiFailure }> {
  try {
    const completion = await generateWithRetry({
      model,
      stream: false,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: PLANNER_SYSTEM_PROMPT },
        { role: "user", content: buildPlanningPrompt(input) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        failure: {
          status: 502,
          error: "Planning phase failed: empty planner output.",
        },
      };
    }

    let rawPlannerJson: unknown;
    try {
      rawPlannerJson = JSON.parse(content);
    } catch {
      return {
        ok: false,
        failure: {
          status: 502,
          error: "Planning phase failed: invalid task output.",
        },
      };
    }

    const plannerValidation = PlannerResponseSchema.safeParse(rawPlannerJson);
    if (!plannerValidation.success) {
      return {
        ok: false,
        failure: {
          status: 502,
          error: "Planning phase failed: task schema validation failed.",
          issues: plannerValidation.error.flatten(),
        },
      };
    }

    return { ok: true, value: plannerValidation.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown planner error";
    return {
      ok: false,
      failure: {
        status: 502,
        error: `Planning phase failed: ${message}`,
      },
    };
  }
}

async function synthesize_itinerary(
  input: TravelRequest,
  planner: PlannerResponse,
): Promise<{ ok: true; value: unknown } | { ok: false; failure: ApiFailure }> {
  try {
    const completion = await generateWithRetry({
      model,
      stream: false,
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TRAVEL_SYSTEM_PROMPT },
        { role: "user", content: buildTravelUserPrompt(input, planner.tasks) },
      ],
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return {
        ok: false,
        failure: {
          status: 502,
          error: "No itinerary generated. Please try again.",
        },
      };
    }

    try {
      return { ok: true, value: JSON.parse(content) };
    } catch {
      return {
        ok: false,
        failure: {
          status: 502,
          error: "AI returned invalid JSON. Please retry.",
        },
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown synthesis error";
    return {
      ok: false,
      failure: {
        status: 502,
        error: `Itinerary synthesis failed: ${message}`,
      },
    };
  }
}

function validate_output(
  input: TravelRequest,
  rawJson: unknown,
): { ok: true; value: TravelResponse } | { ok: false; failure: ApiFailure } {
  const parsedOutput = TravelResponseSchema.safeParse(rawJson);
  if (!parsedOutput.success) {
    return {
      ok: false,
      failure: {
        status: 502,
        error: "AI response format validation failed.",
        issues: parsedOutput.error.flatten(),
      },
    };
  }

  const businessRuleIssue = validateBusinessRules(input.startDate, input.endDate, parsedOutput.data.daily_plan.length);
  if (businessRuleIssue) {
    return {
      ok: false,
      failure: {
        status: 502,
        error: `AI response consistency check failed: ${businessRuleIssue}`,
      },
    };
  }

  return { ok: true, value: parsedOutput.data };
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

    const inputPhase = validate_input(body);
    if (!inputPhase.ok) {
      return NextResponse.json({ ...inputPhase.failure, requestId }, { status: inputPhase.failure.status });
    }

    const planningPhase = await plan_tasks(inputPhase.value);
    if (!planningPhase.ok) {
      return NextResponse.json({ ...planningPhase.failure, requestId }, { status: planningPhase.failure.status });
    }

    const synthesisPhase = await synthesize_itinerary(inputPhase.value, planningPhase.value);
    if (!synthesisPhase.ok) {
      return NextResponse.json({ ...synthesisPhase.failure, requestId }, { status: synthesisPhase.failure.status });
    }

    const outputPhase = validate_output(inputPhase.value, synthesisPhase.value);
    if (!outputPhase.ok) {
      return NextResponse.json({ ...outputPhase.failure, requestId }, { status: outputPhase.failure.status });
    }

    return NextResponse.json(outputPhase.value, {
      status: 200,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json(
      { error: `Failed to generate itinerary: ${message}`, requestId },
      { status: 500 },
    );
  }
}
