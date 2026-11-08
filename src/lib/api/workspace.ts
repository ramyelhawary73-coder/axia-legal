import { createClient } from "@/lib/supabase/server";

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "lawyer"
  | "staff"
  | "trainee"
  | "viewer";

export type WorkspaceErrorCode =
  | "SESSION_EXPIRED"
  | "WORKSPACE_UNAVAILABLE"
  | "WORKSPACE_MISSING"
  | "WORKSPACE_AMBIGUOUS"
  | "WORKSPACE_FORBIDDEN"
  | "WORKSPACE_SUSPENDED"
  | "WORKSPACE_EXPIRED"
  | "MEMBER_SUSPENDED";

export type WorkspaceContext =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      userId: string;
      organizationId: string;
      role: WorkspaceRole;
      userLabel: string;
    }
  | {
      ok: false;
      code: WorkspaceErrorCode;
    };

export async function resolveWorkspace(request?: Request): Promise<WorkspaceContext> {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    return { ok: false, code: "SESSION_EXPIRED" };
  }

  const stagedControls = typeof process !== "undefined" && process.env.AXIA_CONTROL_CENTER_ENABLED === "1";
  if (stagedControls) {
    const fresh = await supabase.auth.getUser();
    if (fresh.error || fresh.data.user?.id !== userId) return { ok: false, code: "SESSION_EXPIRED" };
    const access = await supabase.rpc("axia_workspace_access");
    if (access.error || !Array.isArray(access.data)) return { ok: false, code: "WORKSPACE_UNAVAILABLE" };
    const requested = request?.headers.get("x-axia-organization-id")?.trim();
    const own = requested ? access.data.find((m: { organization_id: string }) => m.organization_id === requested) : access.data.length === 1 ? access.data[0] : null;
    if (own && ["WORKSPACE_SUSPENDED", "WORKSPACE_EXPIRED", "MEMBER_SUSPENDED"].includes(own.access)) return { ok: false, code: own.access as WorkspaceErrorCode };
  }

  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id,role,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (membershipError) {
    return { ok: false, code: "WORKSPACE_UNAVAILABLE" };
  }

  if (!memberships?.length) {
    return { ok: false, code: "WORKSPACE_MISSING" };
  }

  const requestedOrganizationId =
    request?.headers.get("x-axia-organization-id")?.trim() || null;

  let membership = requestedOrganizationId
    ? memberships.find(
        (item: { organization_id: unknown }) => String(item.organization_id) === requestedOrganizationId,
      )
    : memberships.length === 1
      ? memberships[0]
      : null;

  if (requestedOrganizationId && !membership) {
    return { ok: false, code: "WORKSPACE_FORBIDDEN" };
  }

  if (!requestedOrganizationId && memberships.length > 1) {
    return { ok: false, code: "WORKSPACE_AMBIGUOUS" };
  }

  membership ??= memberships[0];

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return {
    ok: true,
    supabase,
    userId,
    organizationId: String(membership.organization_id),
    role: membership.role as WorkspaceRole,
    userLabel: profile?.full_name?.trim() || "المستخدم الحالي",
  };
}
