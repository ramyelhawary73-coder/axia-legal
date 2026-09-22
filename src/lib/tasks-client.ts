import { readJsonResponse } from "@/lib/api/client-response";
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

export async function loadTaskWorkspace(): Promise<TaskWorkspace> {
  const response = await fetch("/api/tasks", {
    method: "GET",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  return readJsonResponse<TaskWorkspace>(response, "تعذر الاتصال بخدمة المهام.");
}

export async function createPersistentTask(task: LegalTask): Promise<LegalTask> {
  const response = await fetch("/api/tasks", {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ task }),
  });

  const payload = await readJsonResponse<{ task: LegalTask }>(response, "تعذر الاتصال بخدمة المهام.");
  return payload.task;
}

export async function updatePersistentTaskDeadline(
  taskId: string,
  deadline: string,
): Promise<void> {
  const response = await fetch("/api/tasks", {
    method: "PATCH",
    cache: "no-store",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ taskIds: [taskId], deadline }),
  });

  const payload = await readJsonResponse<{ updatedIds: string[] }>(response, "تعذر الاتصال بخدمة المهام.");
  if (!payload.updatedIds.includes(taskId)) {
    throw new Error("لم يتم تأكيد تحديث موعد المهمة.");
  }
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

  await readJsonResponse<{ updatedIds: string[] }>(response, "تعذر الاتصال بخدمة المهام.");
}
