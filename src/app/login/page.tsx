import type { Metadata } from "next";
import { LoginExperience } from "@/components/login-experience";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import {
  loginErrorMessage,
  safeNextPath,
} from "@/lib/supabase/auth-navigation";

export const metadata: Metadata = { title: "تسجيل الدخول | AXIA Legal" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <LoginExperience
      nextPath={safeNextPath(params.next)}
      errorMessage={loginErrorMessage(params.error)}
      authConfigured={Boolean(getSupabasePublicConfig())}
    />
  );
}
