"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/supabase/auth-navigation";

export async function login(formData: FormData) {
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const email = typeof emailValue === "string" ? emailValue.trim() : "";
  const password = typeof passwordValue === "string" ? passwordValue : "";
  const next = safeNextPath(formData.get("next"));
  let errorCode: string | null = null;

  if (!email || !password) {
    errorCode = "missing_credentials";
  } else if (email.length > 320 || password.length > 4096) {
    errorCode = "invalid_credentials";
  } else {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        errorCode =
          error.status === 429
            ? "rate_limited"
            : error.status && error.status >= 500
              ? "auth_unavailable"
              : "invalid_credentials";
      } else if (!data.user?.id || !data.session) {
        errorCode = "invalid_credentials";
      }
    } catch {
      errorCode = "auth_unavailable";
    }
  }

  // Keep Next.js redirect outside the catch: it deliberately throws to complete the action.
  if (errorCode)
    redirect(`/login?error=${errorCode}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) redirect("/login?error=auth_unavailable");
  redirect("/login");
}
