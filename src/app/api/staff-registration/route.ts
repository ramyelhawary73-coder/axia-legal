import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { getStaffRegistrationConfig, registrationCredentials } from "@/lib/staff-registration";
import { staffJson } from "@/lib/api/staff-foundation";

const unavailable = () => staffJson({ error: "إنشاء الحسابات الجديدة غير متاح حاليًا. تواصل مع إدارة المكتب." }, 503);
const checkEmail = () => staffJson({ status: "check_email" }, 202);

export async function POST(request: Request) {
  const config = getStaffRegistrationConfig();
  if (!config || !getSupabasePublicConfig()) return unavailable();
  // Compare with the reviewed public origin, not Next.js's internal binding URL.
  if (request.headers.get("origin") !== config.origin)
    return staffJson({ error: "مصدر الطلب غير مسموح." }, 403);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
    return staffJson({ error: "صيغة الطلب غير صالحة." }, 415);

  // Bound the stream as well as Content-Length; do not buffer arbitrary bodies.
  if (Number(request.headers.get("content-length")) > 4096)
    return staffJson({ error: "حجم الطلب غير مسموح." }, 413);
  const reader = request.body?.getReader();
  if (!reader) return staffJson({ error: "بيانات التسجيل غير مكتملة." }, 400);
  const decoder = new TextDecoder();
  let text = "", size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 4096) {
        await reader.cancel();
        return staffJson({ error: "حجم الطلب غير مسموح." }, 413);
      }
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
  } catch { return staffJson({ error: "تعذر قراءة الطلب." }, 400); }
  finally { reader.releaseLock(); }
  let body: Record<string, unknown> | null = null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
      body = parsed as Record<string, unknown>;
  } catch { /* Validation below gives one safe response. */ }
  const credentials = registrationCredentials(body);
  if (!credentials) return staffJson({ error: "أدخل بريدًا صحيحًا وكلمة مرور من ١٢ إلى ١٢٨ حرفًا، وأعد كتابتها بنفس القيمة." }, 400);

  try {
    const supabase = await createClient();
    const current = await supabase.auth.getUser();
    if (current.data.user) return staffJson({ error: "استخدم حسابك الحالي أو سجّل الخروج قبل إنشاء حساب آخر." }, 409);
    if (current.error && current.error.name !== "AuthSessionMissingError") return unavailable();
    const { data, error } = await supabase.auth.signUp({
      ...credentials,
      options: { emailRedirectTo: `${config.origin}/auth/confirm` },
    });
    // Auto-confirm must never silently replace the required confirmed-email flow.
    if (data.session) {
      await supabase.auth.signOut({ scope: "local" });
      return unavailable();
    }
    if (error?.status === 429) return staffJson({ error: "تم بلوغ حد الطلبات. انتظر ثم أعد المحاولة." }, 429);
    if (error && (!error.status || error.status >= 500)) return unavailable();
    // Existing email and eligible new email share the same response. No delivery claim.
    return checkEmail();
  } catch { return unavailable(); }
}
