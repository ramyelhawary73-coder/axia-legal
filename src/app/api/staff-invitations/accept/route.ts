import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { readJsonObject } from "@/lib/api/validation";
import { isInvitationToken } from "@/lib/staff-invitations";
import { getStaffRegistrationConfig } from "@/lib/staff-registration";
import {
  isSameOrigin,
  staffJson,
  staffRpcError,
} from "@/lib/api/staff-foundation";

export async function GET() {
  if (!getSupabasePublicConfig()) return staffRpcError({ code: "PGRST202" });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  const registrationEnabled = Boolean(getStaffRegistrationConfig());
  if (error || !data.user) return staffJson({ authenticated: false, registrationEnabled }, 401);
  return staffJson({
    authenticated: true,
    email: data.user.email ?? "",
    confirmed: Boolean(data.user.email_confirmed_at),
    registrationEnabled,
  });
}
export async function POST(request: Request) {
  if (!isSameOrigin(request))
    return staffJson({ error: "مصدر الطلب غير مسموح." }, 403);
  if (!getSupabasePublicConfig()) return staffRpcError({ code: "PGRST202" });
  const body = await readJsonObject(request);
  if (!isInvitationToken(body?.token))
    return staffJson({ error: "رابط الدعوة غير صالح." }, 400);
  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user)
    return staffJson(
      { error: "سجّل الدخول بالبريد المدعو أولًا.", code: "SESSION_EXPIRED" },
      401,
    );
  const { data, error } = await supabase.rpc("axia_staff_accept", {
    p_token: body.token,
  });
  if (error || !data) return staffRpcError(error);
  return staffJson({ organizationId: data.organizationId, accepted: true });
}
