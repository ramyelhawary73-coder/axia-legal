"use server";

import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";

// Keep the token in page memory during login; never place it in a login redirect/query.
export async function invitationLogin(formData: FormData) {
  if (!getSupabasePublicConfig())
    return { error: "تسجيل الدخول غير مهيأ في هذه البيئة." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "أدخل البريد وكلمة المرور." };
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error
    ? { error: "تعذر الدخول. راجع بيانات الحساب وتأكيد البريد." }
    : { error: null };
}

export async function invitationLogout() {
  if (!getSupabasePublicConfig()) return;
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: "local" });
}
