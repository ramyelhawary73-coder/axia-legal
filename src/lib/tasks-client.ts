import type { LegalTask } from "@/types/legal";

export type TaskMatterOption = {
  id: string;
  caseNumber: string;
  title: string;
  court?: string;
};

export type TaskWorkspace = {
  organizationId: string;
  userId: string;
  assigneeLabel: string;
  matters: TaskMatterOption[];
  tasks: LegalTask[];
};

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error || "تعذر الاتصال بخدمة المهام.");
  }

  return payload as T;
}

export async function loadTaskWorkspace(): Promise<TaskWorkspace> {
  const response = await fetch("/api/tasks", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return readJsonResponse<TaskWorkspace>(response);
}

export async function createPersistentTask(task: LegalTask): Promise<LegalTask> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ task }),
  });

  const payload = await readJsonResponse<{ task: LegalTask }>(response);
  return payload.task;
}

export async function updatePersistentTaskStatus(
  taskIds: string[],
  status: LegalTask["status"],
): Promise<void> {
  if (taskIds.length === 0) return;

  const response = await fetch("/api/tasks", {
    method: "PATCH",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ taskIds, status }),
  });

  await readJsonResponse<{ updatedIds: string[] }>(response);
}
