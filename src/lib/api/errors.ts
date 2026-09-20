import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "SESSION_EXPIRED"
  | "WORKSPACE_UNAVAILABLE"
  | "WORKSPACE_MISSING"
  | "WORKSPACE_AMBIGUOUS"
  | "WORKSPACE_FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "INVALID_REFERENCE"
  | "QUERY_FAILED";

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ error: message, code }, { status });
}

export function databaseErrorCode(
  error: { code?: string } | null | undefined,
): ApiErrorCode {
  switch (error?.code) {
    case "23505":
      return "CONFLICT";
    case "23503":
      return "INVALID_REFERENCE";
    case "42501":
      return "FORBIDDEN";
    default:
      return "QUERY_FAILED";
  }
}
