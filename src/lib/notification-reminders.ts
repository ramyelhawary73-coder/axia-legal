import type { Hearing, LegalTask } from "@/types/legal";

export type WorkspaceReminder = { key:string; kind:"tasks"|"hearings"; title:string; detail:string; date:string; dueAt:number|null; nativeDue:boolean };
const cairo = new Intl.DateTimeFormat("en-CA", {timeZone:"Africa/Cairo",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit",hourCycle:"h23"});
function parts(instant:number) {
  return Object.fromEntries(cairo.formatToParts(new Date(instant)).filter(p=>p.type!=="literal").map(p=>[p.type,Number(p.value)]));
}
export function cairoCalendarDate(instant:number):string {
  const p=parts(instant);return `${p.year}-${String(p.month).padStart(2,"0")}-${String(p.day).padStart(2,"0")}`;
}
function validDate(date:string):boolean {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
  const [y,m,d]=date.split("-").map(Number),v=new Date(Date.UTC(y,m-1,d));
  return y>=1900&&v.getUTCFullYear()===y&&v.getUTCMonth()===m-1&&v.getUTCDate()===d;
}
// Reject ambiguous/nonexistent Cairo local times rather than inventing a legal deadline.
export function cairoHearingInstant(date:string,time:string):number|null {
  if(!validDate(date))return null;
  const normalized=time.replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).trim();
  const match=/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(ص|م|am|pm)?$/i.exec(normalized);
  if(!match)return null;
  let h=Number(match[1]);const minute=Number(match[2]),second=Number(match[3]??0),period=match[4]?.toLowerCase();
  if(minute>59||second>59||h>23||(period&&(h<1||h>12)))return null;
  if(period)h=h%12+((period==="م"||period==="pm")?12:0);
  const [y,m,d]=date.split("-").map(Number),target=Date.UTC(y,m-1,d,h,minute,second),offsets=new Set<number>();
  for(const delta of [-36,-12,0,12,36]) {
    const probe=target+delta*3600000,p=parts(probe);
    offsets.add(Date.UTC(p.year,p.month-1,p.day,p.hour,p.minute,p.second)-probe);
  }
  const candidates=[...offsets].map(offset=>target-offset).filter(candidate=>{
    const p=parts(candidate);return p.year===y&&p.month===m&&p.day===d&&p.hour===h&&p.minute===minute&&p.second===second;
  });
  return candidates.length===1?candidates[0]:null;
}
export function collectWorkspaceReminders(tasks:LegalTask[],hearings:Hearing[],now=Date.now()):WorkspaceReminder[] {
  const today=cairoCalendarDate(now),lastDay=cairoCalendarDate(now+7*86400000),rows:WorkspaceReminder[]=[];
  for(const task of tasks) {
    if(task.status==="مكتملة"||!validDate(task.deadline.slice(0,10)))continue;
    const explicit=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(task.deadline);
    const timestamp=explicit?Date.parse(task.deadline):NaN;
    if(!explicit&&task.deadline.length!==10)continue;
    if(explicit&&!Number.isFinite(timestamp))continue;
    const day=explicit?cairoCalendarDate(timestamp):task.deadline;
    if(day>lastDay)continue;
    const nativeDue=explicit&&timestamp>now&&timestamp-now<=3600000&&(task.priority==="عاجلة"||task.priority.includes("حرجة"));
    rows.push({key:`task:${task.id}:${task.deadline}`,kind:"tasks",title:task.title,detail:day<today?"مهمة متأخرة":day===today?"موعد اليوم":"موعد قادم",date:day,dueAt:explicit?timestamp:null,nativeDue});
  }
  for(const hearing of hearings) {
    if(hearing.isArchived||hearing.status==="منتهية"||!validDate(hearing.hearingDate)||hearing.hearingDate<today||hearing.hearingDate>lastDay)continue;
    const dueAt=cairoHearingInstant(hearing.hearingDate,hearing.hearingTime);
    rows.push({key:`hearing:${hearing.id}:${hearing.hearingDate}:${hearing.hearingTime}`,kind:"hearings",title:hearing.court,detail:hearing.hearingDate===today?"جلسة اليوم":"جلسة قادمة",date:hearing.hearingDate,dueAt,nativeDue:dueAt!==null&&dueAt>now&&dueAt-now<=3600000});
  }
  return rows.sort((a,b)=>a.date.localeCompare(b.date)||(a.dueAt??Infinity)-(b.dueAt??Infinity));
}
