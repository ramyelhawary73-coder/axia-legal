import { getPlatformControlConfig, readPlatformBody } from "@/lib/platform-control";
import { parseControlRequest } from "@/lib/control-center";
import { platformError, platformJson, resolvePlatformContext } from "@/lib/api/platform";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const config = getPlatformControlConfig();
  if (process.env.AXIA_CONTROL_CENTER_ENABLED !== "1" || !config) return platformJson({ code: "CONTROL_DISABLED", error: "مركز التحكم قيد التجهيز ولم يُفعّل في هذه البيئة." }, 503);
  if (request.headers.get("origin") !== config.origin || new URL(request.url).origin !== config.origin) return platformError("PLATFORM_FORBIDDEN");
  const raw = await readPlatformBody(request);
  const body = raw && parseControlRequest(raw);
  if (!body) return platformError("VALIDATION_ERROR");
  const context = await resolvePlatformContext();
  if (!context.ok) return platformError(context.code);
  try {
    const { data, error } = await context.supabase.rpc("axia_control", { p_action: body.action, p_office: body.officeId, p_input: body.input });
    if (error) {
      const conflict = ["40001", "23505"].includes(error.code);
      const unavailable = ["PGRST202", "42883"].includes(error.code);
      const large = error.message === "CONTROL_EXPORT_TOO_LARGE";
      return platformJson({ code: conflict ? "CONTROL_CONFLICT" : unavailable ? "CONTROL_UNAVAILABLE" : large ? "CONTROL_EXPORT_TOO_LARGE" : "CONTROL_REJECTED", error: conflict ? "البيانات اتغيرت أو موجودة بالفعل. حدّث العرض وراجعها قبل إعادة الحفظ." : unavailable ? "الـMigration الجديدة لم تُفعّل بعد. لا يمكن تنفيذ العملية." : large ? "المكتب تجاوز حد التصدير الحالي. يلزم مسار تصدير مجزأ قبل إنشاء نسخة كاملة." : "تعذر تنفيذ العملية. راجع السبب والصلاحيات وآخر مالك وحدود المكتب واكتمال الملفات." }, conflict ? 409 : unavailable ? 503 : large ? 413 : 403);
    }
    if (body.action === "file") {
      if (data?.path !== body.input.path) return platformError("PLATFORM_UNAVAILABLE");
      const { data: signed, error: signError } = await context.supabase.storage.from("legal-documents").createSignedUrl(data.path, 30);
      const publicConfig = getSupabasePublicConfig();
      if (signError || !signed?.signedUrl || !publicConfig || new URL(signed.signedUrl).origin !== new URL(publicConfig.url).origin) return platformError("PLATFORM_UNAVAILABLE");
      return platformJson({ url: signed.signedUrl });
    }
    return platformJson({ data });
  } catch { return platformError("PLATFORM_UNAVAILABLE"); }
}
