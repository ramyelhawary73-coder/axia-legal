import type { WorkspaceRole } from "@/lib/api/workspace";

export type StaffInviteRole = Exclude<WorkspaceRole, "owner">;
export const staffRoleLabels: Record<StaffInviteRole, string> = {
  admin: "مدير",
  lawyer: "محام",
  staff: "موظف",
  trainee: "متدرب",
  viewer: "قارئ",
};
export function canInviteRole(
  actor: WorkspaceRole,
  role: unknown,
): role is StaffInviteRole {
  return (
    typeof role === "string" &&
    Object.hasOwn(staffRoleLabels, role) &&
    (actor === "owner" || (actor === "admin" && role !== "admin"))
  );
}
export function normalizeStaffEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 254 &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(
      email,
    )
    ? email
    : null;
}
export const isInvitationToken = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9a-f]{64}$/.test(value);
export type StaffInvitation = {
  id: string;
  email_normalized: string;
  role: StaffInviteRole;
  status: "pending" | "accepted" | "revoked";
  expires_at: string;
  created_at: string;
};
export type StaffInvitationList = {
  enabled: boolean;
  canManage: boolean;
  canInviteAdmin: boolean;
  invitations: StaffInvitation[];
};
