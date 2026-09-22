import { readJsonResponse } from "@/lib/api/client-response";
export type AdministrationWorkspace = {
  organization: {
    name: string;
    slug: string;
    createdAt: string;
  };
  currentUser: {
    label: string;
    role: "owner" | "admin" | "lawyer" | "staff" | "trainee" | "viewer";
    roleLabel: string;
  };
  membersCount: number;
  roleCounts: {
    owner: number;
    admin: number;
    lawyer: number;
    staff: number;
    trainee: number;
    viewer: number;
  };
  security: {
    enforcedBy: string;
    editableFromThisScreen: boolean;
    invitationFlowEnabled: boolean;
  };
};

export async function loadAdministrationWorkspace(): Promise<AdministrationWorkspace> {
  const response = await fetch("/api/administration", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return readJsonResponse<AdministrationWorkspace>(response, "تعذر تحميل بيانات الإدارة.");
}
