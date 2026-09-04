import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FoundationDashboard } from "@/components/foundation-dashboard";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = getSupabasePublicConfig();

  if (!config) {
    return (
      <AppShell>
        <FoundationDashboard />
      </AppShell>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) redirect("/login");

  return (
    <AppShell>
      <div className="border-b border-emerald-300/15 bg-emerald-300/5 px-5 py-2 text-xs text-emerald-100 sm:px-8 lg:px-10">
        Authenticated workspace · Phase 1B security foundation
      </div>
      <FoundationDashboard />
    </AppShell>
  );
}
