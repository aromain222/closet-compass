import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string
  ) {
    super(message);
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

export function jsonOk<T>(payload: T, status = 200): NextResponse<T> {
  return NextResponse.json(payload, { status });
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "The request payload is invalid.",
          details: error.flatten()
        }
      },
      { status: 400 }
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }

  console.error("[api_error]", error);
  return NextResponse.json(
    {
      error: {
        code: "internal_error",
        message: "Something went wrong. Please try again."
      }
    },
    { status: 500 }
  );
}
