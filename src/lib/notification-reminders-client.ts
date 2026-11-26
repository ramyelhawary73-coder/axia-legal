import {collectWorkspaceReminders,cairoHearingInstant,type WorkspaceReminder} from "@/lib/notification-reminders";
import type {LegalTask} from "@/types/legal";
// Fresh ordinary SSR/RLS reads before an automatic foreground reminder; never privileged keys or writes.
export async function revalidateWorkspaceReminder(scope:string,reminder:WorkspaceReminder,signal?:AbortSignal):Promise<boolean> {
  try {
    const taskResponse=await fetch("/api/tasks",{cache:"no-store",headers:{Accept:"application/json"},signal});
    if(!taskResponse.ok)return false;
    const workspace=await taskResponse.json();
    if(typeof workspace.organizationId!=="string"||typeof workspace.userId!=="string"||`${workspace.organizationId}:${workspace.userId}`!==scope||!Array.isArray(workspace.tasks))return false;
    if(reminder.kind==="tasks")return collectWorkspaceReminders(workspace.tasks as LegalTask[],[],Date.now()).some(row=>row.key===reminder.key&&row.nativeDue);
    const response=await fetch("/api/hearings",{cache:"no-store",headers:{Accept:"application/json"},signal});
    if(!response.ok)return false;
    const payload=await response.json();if(!Array.isArray(payload.hearings))return false;
    return payload.hearings.some((row:{id:string;hearingDate:string;hearingTime?:string;isArchived:boolean;status:string})=>{
      if(row.isArchived||!["scheduled","postponed"].includes(row.status)||typeof row.hearingTime!=="string")return false;
      if(`hearing:${row.id}:${row.hearingDate}:${row.hearingTime}`!==reminder.key)return false;
      const instant=cairoHearingInstant(row.hearingDate,row.hearingTime),now=Date.now();
      return instant!==null&&instant>now&&instant-now<=3600000;
    });
  } catch { return false; }
}
