import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { confirmationCredential, getStaffRegistrationConfig } from "@/lib/staff-registration";

const headers = { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow" };
export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = getStaffRegistrationConfig();
  const finish = (status: string) => {
    const target = new URL("/invitations/accept", config?.origin ?? url.origin);
    target.searchParams.set("confirmation", status);
    return NextResponse.redirect(target, { status: 303, headers });
  };
  if (!config || !getSupabasePublicConfig()) return finish("unavailable");
  const credential = confirmationCredential(url);
  const publicHost = request.headers.get("host") ?? url.host;
  if (!credential || publicHost !== new URL(config.origin).host) return finish("failed");
  try {
    const supabase = await createClient();
    const current = await supabase.auth.getUser();
    if (current.data.user) return finish("account_conflict");
    if (current.error && current.error.name !== "AuthSessionMissingError") return finish("failed");
    const result = "code" in credential
      ? await supabase.auth.exchangeCodeForSession(credential.code)
      : await supabase.auth.verifyOtp(credential);
    if (result.error || !result.data.session) return finish("failed");
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user?.email_confirmed_at || data.user.is_anonymous) {
      await supabase.auth.signOut({ scope: "local" });
      return finish("failed");
    }
    // Confirmation proves identity only. The original invitation/RPC grants membership.
    return finish("success");
  } catch { return finish("failed"); }
}

// Next.js otherwise uses GET for HEAD, which could consume a one-time credential.
export function HEAD() { return new Response(null, { status: 405, headers: { ...headers, Allow: "GET" } }); }
