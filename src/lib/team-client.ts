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

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "تعذر تحميل بيانات فريق العمل.");
  }

  return payload as T;
}

export async function loadPersistentTeam(): Promise<TeamMemberRecord[]> {
  const response = await fetch("/api/team", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  const payload = await readJsonResponse<{ members: TeamMemberRecord[] }>(
    response,
  );
  return payload.members;
}
