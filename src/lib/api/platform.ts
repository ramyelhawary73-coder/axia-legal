import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getPlatformControlConfig, platformPagination, PLATFORM_UUID, type PlatformState } from "@/lib/platform-control";

const failures = {
  PLATFORM_DISABLED: [503, "إدارة المنصة غير مفعلة في هذه البيئة."],
  SESSION_EXPIRED: [401, "سجّل الدخول بحسابك أولًا."],
  PLATFORM_FORBIDDEN: [403, "هذا الحساب لا يملك صلاحية إدارة المنصة."],
  PLATFORM_MFA_REQUIRED: [403, "أكمل التحقق بخطوتين أولًا."],
  PLATFORM_UNAVAILABLE: [503, "تعذر التحقق من صلاحية إدارة المنصة."],
  VALIDATION_ERROR: [400, "بيانات الطلب غير صالحة."],
  RATE_LIMIT: [429, "طلبات كثيرة. انتظر ثم حاول مرة أخرى."],
  MFA_UNAVAILABLE: [503, "تعذر إكمال المصادقة. أعد المحاولة أو راجع المشغّل."],
  MFA_PENDING: [409, "يوجد ربط مصادقة بالفعل. أكمل التحقق أو راجع المشغّل."],
} as const;
export type PlatformError = keyof typeof failures;
export const platformJson = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: {
  "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow",
  "X-Frame-Options": "DENY", "Vary": "Cookie",
} });
export function platformError(code: PlatformError) {
  const [status, error] = failures[code];
  // Denied SQL transactions roll back their audit inserts. Record only a fixed code here.
  if (status === 401 || status === 403) console.warn("[AXIA platform access]", { code });
  return platformJson({ code, error }, status);
}
type PlatformContext = { ok: true; userId: string; state: PlatformState; supabase: Awaited<ReturnType<typeof createClient>> } | { ok: false; code: PlatformError };

export async function resolvePlatformContext(allowMfa = false): Promise<PlatformContext> {
  if (!getPlatformControlConfig() || !getSupabasePublicConfig()) return { ok: false, code: "PLATFORM_DISABLED" };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    const user = data?.user;
    if (error || !user) return { ok: false, code: error && error.name !== "AuthSessionMissingError" ? "PLATFORM_UNAVAILABLE" : "SESSION_EXPIRED" };
    if (!user.email_confirmed_at || user.is_anonymous) return { ok: false, code: "PLATFORM_FORBIDDEN" };
    const result = await supabase.rpc("axia_platform_context");
    if (result.error || result.data?.version !== 1) return { ok: false, code: "PLATFORM_UNAVAILABLE" };
    const state = result.data.state;
    if (state !== "ready" && state !== "mfa_required") return { ok: false, code: "PLATFORM_FORBIDDEN" };
    if (result.data.userId !== user.id) return { ok: false, code: "PLATFORM_FORBIDDEN" };
    if (state === "mfa_required" && !allowMfa) return { ok: false, code: "PLATFORM_MFA_REQUIRED" };
    return { ok: true, userId: user.id, state, supabase };
  } catch { return { ok: false, code: "PLATFORM_UNAVAILABLE" }; }
}

export async function platformRead(request: Request, kind: "offices" | "audit") {
  const context = await resolvePlatformContext();
  if (!context.ok) return platformError(context.code);
  const args = platformPagination(request.url);
  if (!args) return platformError("VALIDATION_ERROR");
  try {
    const { data, error } = await context.supabase.rpc(`axia_platform_${kind}`, args);
    if (error?.code === "42501") return platformError("PLATFORM_FORBIDDEN");
    if (error?.code === "22023") return platformError("VALIDATION_ERROR");
    if (error?.message === "PLATFORM_RATE_LIMIT") return platformError("RATE_LIMIT");
    if (error || !Array.isArray(data?.items) || data.items.length > args.p_limit || (data.nextCursor !== null && (typeof data.nextCursor !== "string" || !PLATFORM_UUID.test(data.nextCursor)))) return platformError("PLATFORM_UNAVAILABLE");
    const items = [];
    for (const item of data.items) {
      if (!item || typeof item.id !== "string" || !PLATFORM_UUID.test(item.id) || typeof item.createdAt !== "string" || !Number.isFinite(Date.parse(item.createdAt))) return platformError("PLATFORM_UNAVAILABLE");
      if (kind === "offices") {
        if (typeof item.name !== "string" || typeof item.slug !== "string") return platformError("PLATFORM_UNAVAILABLE");
        items.push({ id: item.id, name: item.name, slug: item.slug, createdAt: item.createdAt });
      } else {
        if (typeof item.action !== "string" || !["user", "operator"].includes(item.actorType) || (item.actorId !== null && (typeof item.actorId !== "string" || !PLATFORM_UUID.test(item.actorId))) || (item.subjectId !== null && (typeof item.subjectId !== "string" || !PLATFORM_UUID.test(item.subjectId)))) return platformError("PLATFORM_UNAVAILABLE");
        items.push({ id: item.id, action: item.action, actorId: item.actorId, actorType: item.actorType, subjectId: item.subjectId, createdAt: item.createdAt });
      }
    }
    return platformJson({ items, nextCursor: data.nextCursor });
  } catch { return platformError("PLATFORM_UNAVAILABLE"); }
}
