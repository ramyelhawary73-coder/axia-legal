import { NextResponse } from "next/server";
import type { WorkspaceErrorCode } from "@/lib/api/workspace";

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


export function workspaceErrorResponse(code: WorkspaceErrorCode) {
  switch (code) {
    case "SESSION_EXPIRED":
      return apiError(code, "انتهت جلسة الدخول. سجّل الدخول مرة أخرى.", 401);
    case "WORKSPACE_MISSING":
      return apiError(code, "لا توجد مؤسسة مرتبطة بهذا الحساب.", 409);
    case "WORKSPACE_AMBIGUOUS":
      return apiError(
        code,
        "الحساب مرتبط بأكثر من مؤسسة. يلزم تحديد مساحة العمل أولاً.",
        409,
      );
    case "WORKSPACE_FORBIDDEN":
      return apiError(code, "مساحة العمل المطلوبة غير متاحة لهذا الحساب.", 403);
    default:
      return apiError(code, "تعذر تحديد مساحة العمل الحالية.", 503);
  }
}
