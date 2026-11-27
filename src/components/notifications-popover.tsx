"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import Link from "next/link";
import { BackgroundPushPanel } from "@/components/background-push-panel";
import {Bell,BellRing,CheckSquare,Gavel,ShieldCheck,X} from "lucide-react";
import type {Hearing,LegalTask,NavigationTab} from "@/types/legal";
import {revalidateWorkspaceReminder} from "@/lib/notification-reminders-client";
import {collectWorkspaceReminders} from "@/lib/notification-reminders";
import {getNotificationPermissionStatus,requestBrowserNotificationPermission,sendPublicWorkspaceNotification,type NotificationPermissionStatus} from "@/lib/browser-notifications";

interface NotificationsPopoverProps {
  tasks:LegalTask[];hearings:Hearing[];onNavigate:(tab:NavigationTab)=>void;
  onToggleTaskStatus?:(taskId:string)=>void;dataReady:boolean;dataError:boolean;scope?:string;
}
export function NotificationsPopover({tasks,hearings,onNavigate,onToggleTaskStatus,dataReady,dataError,scope}:NotificationsPopoverProps) {
  const [open,setOpen]=useState(false),[segment,setSegment]=useState<"hearings"|"tasks">("tasks");
  const [permission,setPermission]=useState<NotificationPermissionStatus>("default");
  const [enabledScope,setEnabledScope]=useState<string|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
  const [now,setNow]=useState(()=>Date.now()),dialog=useRef<HTMLDialogElement>(null),notified=useRef(new Set<string>());
  const enabled=Boolean(scope)&&enabledScope===scope;
  const reminders=useMemo(()=>dataReady&&!dataError?collectWorkspaceReminders(tasks,hearings,now):[],[tasks,hearings,dataReady,dataError,now]);
  useEffect(()=>{
    const sync=()=>{setPermission(getNotificationPermissionStatus());setNow(Date.now());};
    queueMicrotask(sync);const timer=setInterval(sync,30000);
    const openFromTask=()=>setOpen(true);
    document.addEventListener("visibilitychange",sync);window.addEventListener("axia:open-notifications",openFromTask);
    return()=>{clearInterval(timer);document.removeEventListener("visibilitychange",sync);window.removeEventListener("axia:open-notifications",openFromTask);};
  },[]);
  useEffect(()=>{
    const modal=dialog.current;if(!modal)return;
    if(open&&!modal.open)modal.showModal();else if(!open&&modal.open)modal.close();
  },[open]);
  useEffect(()=>{
    if(!enabled||!scope||permission!=="granted"||!dataReady||dataError||document.visibilityState!=="visible")return;
    const next=reminders.find(r=>r.nativeDue&&!notified.current.has(`${scope}:${r.key}`));if(!next)return;
    let live=true;const controller=new AbortController(),key=`${scope}:${next.key}`;notified.current.add(key);
    void (async()=>{
      const allowed=await revalidateWorkspaceReminder(scope,next,controller.signal);
      const sent=allowed&&await sendPublicWorkspaceNotification({shouldDisplay:()=>live&&document.visibilityState==="visible"});
      if(!sent)notified.current.delete(key);
    })();
    return()=>{live=false;controller.abort();};
  },[enabled,scope,permission,dataReady,dataError,reminders]);
  async function toggleReminders() {
    if(enabled){setEnabledScope(null);setMessage("تم إيقاف التذكيرات لهذه الجلسة.");return;}
    if(!scope)return;
    setBusy(true);
    const result=await requestBrowserNotificationPermission();setPermission(result);setBusy(false);
    setEnabledScope(result==="granted"?scope:null);
    setMessage(result==="granted"?"تم السماح بالتذكيرات أثناء فتح التطبيق على هذا الجهاز. التذكير التلقائي بعد الإغلاق غير مفعّل.":result==="denied"?"الإشعارات محظورة لهذا الموقع. يمكن تغييرها من إعدادات المتصفح باختيارك.":"لم تُفعّل الإشعارات. يمكنك استخدام قائمة التذكيرات داخل AXIA.");
  }
  async function testNotification() {
    setBusy(true);const ok=await sendPublicWorkspaceNotification({test:true});setBusy(false);
    setMessage(ok?"تم طلب عرض الإشعار التجريبي على هذا الجهاز؛ قد تخفيه إعدادات النظام أو التركيز.":"تعذر عرض الإشعار الآن. تأكد من السماح بالإشعارات وجاهزية التطبيق، ثم حاول مجددًا.");
  }
  const visible=reminders.filter(r=>r.kind===segment);
  return <>
    <button type="button" aria-label="الإشعارات" title="الإشعارات والتذكيرات" aria-haspopup="dialog" aria-expanded={open} onClick={()=>setOpen(true)} className="axia-icon-action relative">
      <Bell size={20} aria-hidden="true"/>{reminders.length>0?<span aria-hidden="true" className="axia-notification-count">{reminders.length>99?"99+":reminders.length}</span>:null}
    </button>
    <dialog ref={dialog} aria-labelledby="axia-notifications-title" className="axia-notifications-dialog" onClose={()=>setOpen(false)} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
      <header className="flex items-center justify-between gap-3 border-b border-[var(--border)] p-5">
        <div><p className="text-sm text-[var(--axia-gold-light)]">مساحة المكتب</p><h2 id="axia-notifications-title" className="mt-1 text-xl font-bold">الإشعارات والتذكيرات</h2></div>
        <button type="button" aria-label="إغلاق الإشعارات" className="axia-icon-action" onClick={()=>setOpen(false)}><X size={20} aria-hidden="true"/></button>
      </header>
      <div className="axia-notifications-body">
        <div role="group" aria-label="نوع التذكيرات" className="axia-segmented-control">
          <button type="button" aria-pressed={segment==="tasks"} onClick={()=>setSegment("tasks")}><CheckSquare size={18} aria-hidden="true"/>المهام ({reminders.filter(r=>r.kind==="tasks").length})</button>
          <button type="button" aria-pressed={segment==="hearings"} onClick={()=>setSegment("hearings")}><Gavel size={18} aria-hidden="true"/>الجلسات ({reminders.filter(r=>r.kind==="hearings").length})</button>
        </div>
        <p className="my-3 text-sm leading-6 text-[var(--text-muted)]">حسب آخر بيانات محمّلة ومواعيد القاهرة. راجع السجل الأصلي قبل أي إجراء.</p>
        {dataError?<p role="status" className="axia-notification-empty">تعذر تحميل بيانات التذكيرات. افتح سجل المهام أو الجلسات للمراجعة وإعادة المحاولة.</p>:!dataReady?<p role="status" className="axia-notification-empty">جارٍ تحميل بيانات المكتب المصرّح بها…</p>:visible.length===0?<p className="axia-notification-empty">لا توجد تذكيرات في هذه القائمة من البيانات المحمّلة.</p>:<ul className="space-y-2" aria-label="التذكيرات المحفوظة">{visible.slice(0,50).map(row=><li key={row.key} className="axia-reminder-row">
          <div className="min-w-0"><p className="font-semibold leading-7 break-words">{row.title}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{row.detail} · <bdi>{row.date}</bdi></p></div>
          <button type="button" className="axia-text-action" onClick={()=>{setOpen(false);onNavigate(row.kind);}}>عرض</button>
          {row.kind==="tasks"&&onToggleTaskStatus?<button type="button" className="axia-icon-action" aria-label={`تمييز المهمة ${row.title} كمكتملة`} onClick={()=>{const task=tasks.find(t=>row.key===`task:${t.id}:${t.deadline}`);if(task)onToggleTaskStatus(task.id);}}><CheckSquare size={18} aria-hidden="true"/></button>:null}
        </li>)}</ul>}
        <button type="button" className="axia-text-action my-3" onClick={()=>{setOpen(false);onNavigate(segment);}}>فتح السجل الكامل</button>
        <section aria-label="إعدادات إشعارات الجهاز" className="axia-notification-settings">
          <div className="flex items-center gap-2"><BellRing size={20} aria-hidden="true"/><h3 className="font-bold">إشعارات هذا الجهاز</h3></div>
          <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">التذكيرات متاحة أثناء فتح AXIA. على آيفون، ثبّته وافتحه من الشاشة الرئيسية أولًا. دعم الإشعارات يختلف حسب النظام والمتصفح.</p>
          <p className="mt-2 text-sm leading-7"><strong>التذكير التلقائي بعد إغلاق التطبيق: غير مفعّل بعد.</strong> يحتاج خدمة Push وإعدادات خادم معتمدة.</p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-7 text-[var(--text-muted)]"><ShieldCheck size={18} className="mt-1 shrink-0" aria-hidden="true"/>الإشعار الخارجي عام؛ لا يعرض أسماء موكلين أو أرقام قضايا.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="axia-primary-action" disabled={busy||(!enabled&&(!dataReady||dataError||permission==="unsupported"||permission==="restricted"||permission==="denied"))} onClick={()=>void toggleReminders()}>{enabled?"إيقاف التذكيرات لهذه الجلسة":"السماح بتذكيرات الجهاز"}</button>
            <button type="button" className="axia-text-action" disabled={busy||permission!=="granted"} onClick={()=>void testNotification()}>إرسال إشعار تجريبي</button>
            <Link href="/install" prefetch={false} className="axia-text-action">دليل تثبيت التطبيق</Link>
          </div>
          {permission==="unsupported"||permission==="restricted"?<p role="status" className="mt-3 text-sm leading-7">إشعارات النظام غير متاحة في وضع المتصفح الحالي. التذكيرات داخل AXIA تظل متاحة.</p>:null}
          {permission==="denied"?<p role="status" className="mt-3 text-sm leading-7">الإذن محظور لهذا الموقع؛ لن نكرر طلبه تلقائيًا.</p>:null}
          {message?<p role="status" className="mt-3 text-sm leading-7">{message}</p>:null}
          <BackgroundPushPanel key={scope} scope={scope}/>
        </section>
      </div>
    </dialog>
  </>;
}
