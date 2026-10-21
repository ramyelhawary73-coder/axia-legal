import { getPlatformControlConfig, readPlatformBody } from "@/lib/platform-control";
import { platformError, platformJson, resolvePlatformContext } from "@/lib/api/platform";

function passwordError(error?: { code?: string; status?: number } | null) {
  if (error?.status === 429) return platformError("RATE_LIMIT");
  if (["reauthentication_needed", "reauth_nonce_missing", "reauthentication_not_valid"].includes(error?.code ?? ""))
    return platformJson({ code: "PASSWORD_REAUTH_REQUIRED", error: "يلزم رمز تأكيد من بريدك. اطلب الرمز ثم أدخله مع كلمة المرور الجديدة." }, 409);
  if (["current_password_required", "current_password_invalid", "invalid_current_password"].includes(error?.code ?? ""))
    return platformJson({ code: "PASSWORD_CURRENT_REQUIRED", error: "سياسة الحساب تتطلب كلمة المرور الحالية الصحيحة. إذا كنت لا تعرفها يلزم استرداد الحساب." }, 409);
  if (error?.code === "same_password")
    return platformJson({ code: "PASSWORD_UNCHANGED", error: "اختر كلمة مرور جديدة تختلف عن الحالية." }, 400);
  if (error?.code === "weak_password")
    return platformJson({ code: "PASSWORD_WEAK", error: "اختر كلمة مرور أطول وفريدة تستوفي متطلبات أمان الحساب." }, 400);
  return platformJson({ code: "PASSWORD_UNAVAILABLE", error: "تعذر تأكيد تغيير كلمة المرور. لا تكرر الطلب تلقائيًا؛ احتفظ بالجلسة الحالية واختبر الدخول في نافذة أخرى." }, 503);
}

export async function POST(request: Request) {
  const config = getPlatformControlConfig();
  if (!config) return platformError("PLATFORM_DISABLED");
  if (request.headers.get("origin") !== config.origin) return platformError("PLATFORM_FORBIDDEN");
  const body = await readPlatformBody(request);
  if (!body || typeof body.action !== "string" || !["update", "reauthenticate"].includes(body.action)) return platformError("VALIDATION_ERROR");
  if (body.action === "reauthenticate") {
    if (Object.keys(body).length !== 1) return platformError("VALIDATION_ERROR");
  } else {
    if (Object.keys(body).some(k => !["action", "password", "passwordConfirmation", "currentPassword", "nonce"].includes(k)) ||
      typeof body.password !== "string" || body.password.length < 12 || body.password.length > 128 || !body.password.trim() || body.password !== body.passwordConfirmation ||
      (body.currentPassword !== undefined && (typeof body.currentPassword !== "string" || body.currentPassword.length < 1 || body.currentPassword.length > 128)) ||
      (body.nonce !== undefined && (typeof body.nonce !== "string" || !/^[A-Za-z0-9._~-]{1,128}$/.test(body.nonce)))) return platformError("VALIDATION_ERROR");
  }
  // Same authenticated identity only. No admin client, target user, email or role input.
  const context = await resolvePlatformContext();
  if (!context.ok) return platformError(context.code);
  try {
    if (body.action === "reauthenticate") {
      // Explicit button only: never send a nonce during render, failure or retry.
      const { error } = await context.supabase.auth.reauthenticate();
      return error ? passwordError(error) : platformJson({ status: "code_requested" });
    }
    const { data, error } = await context.supabase.auth.updateUser({
      password: String(body.password),
      ...(body.currentPassword !== undefined ? { current_password: String(body.currentPassword) } : {}),
      ...(body.nonce !== undefined ? { nonce: String(body.nonce) } : {}),
    });
    if (error) return passwordError(error);
    if (data.user?.id !== context.userId) return passwordError();
    return platformJson({ status: "password_updated" });
  } catch { return passwordError(); }
}
