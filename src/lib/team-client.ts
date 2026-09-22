import { readJsonResponse } from "@/lib/api/client-response";
export type TeamRole =
  | "owner"
  | "admin"
  | "lawyer"
  | "staff"
  | "trainee"
  | "viewer";

export type TeamMatterItem = {
  id: string;
  caseNumber: string;
  title: string;
  court: string;
  accessLevel: string;
};

export type TeamTaskItem = {
  id: string;
  title: string;
  matterId: string | null;
  deadline: string;
  priority: string;
  status: string;
  courtOrOffice: string;
};

export type TeamMemberRecord = {
  id: string;
  name: string;
  role: TeamRole;
  roleLabel: string;
  joinedAt: string;
  assignedMatters: TeamMatterItem[];
  assignedTasks: TeamTaskItem[];
};

export async function loadPersistentTeam(): Promise<TeamMemberRecord[]> {
  const response = await fetch("/api/team", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const payload = await readJsonResponse<{ members: TeamMemberRecord[] }>(
    response,
    "تعذر تحميل بيانات فريق العمل.",
  );
  return payload.members;
}
