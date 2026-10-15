"use client";

import { useState } from "react";
import type { LegalTask } from "@/types/legal";
import type { TaskAssigneeOption } from "@/lib/tasks-client";
import { readJsonResponse } from "@/lib/api/client-response";

export function TaskAssigneeEditor({
  task,
  options,
  onSaved,
}: {
  task: LegalTask;
  options: TaskAssigneeOption[];
  onSaved: (taskId: string, userId: string, name: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eligible = options.filter(
    (member) => !task.matterId || member.matterIds.includes(task.matterId),
  );
  async function assign(assigneeId: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id, assigneeId }),
      });
      const result = await readJsonResponse<{
        taskId: string;
        assignedToUserId: string;
        assignedTo: string;
      }>(response, "تعذر إسناد المهمة.");
      onSaved(result.taskId, result.assignedToUserId, result.assignedTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إسناد المهمة.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span className="inline-flex min-w-0 flex-col gap-1">
      <select
        aria-label={`المسؤول عن مهمة ${task.title}`}
        value={task.assignedToUserId ?? ""}
        disabled={busy}
        onClick={(event) => event.stopPropagation()}
        onContextMenu={(event) => event.stopPropagation()}
        onChange={(event) => void assign(event.target.value)}
        className="min-h-11 max-w-full rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 text-xs text-[var(--text)]"
      >
        {!eligible.some((member) => member.id === task.assignedToUserId) && (
          <option value={task.assignedToUserId ?? ""} disabled>
            {task.assignedTo}
          </option>
        )}
        {eligible.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      {busy && (
        <span role="status" className="text-xs">
          جارٍ الحفظ...
        </span>
      )}
      {error && (
        <span role="alert" className="text-xs">
          {error}
        </span>
      )}
    </span>
  );
}
