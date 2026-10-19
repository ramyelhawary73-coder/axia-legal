"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { OfficeBackupPanel } from "@/components/office-backup-panel";
import { CONTROL_DATASETS, type ControlDataset, type ControlMember, type ControlOffice, type ControlPage, type OfficeOverview } from "@/lib/control-center";

export async function controlRequest<T>(action: string, officeId: string | null, input: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/platform/control", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, officeId, input }), signal });
  const body = await response.json();
  if (!response.ok) throw new Error(body.code === "PLATFORM_MFA_REQUIRED" ? "MFA_REQUIRED" : body.code === "CONTROL_DISABLED" ? "CONTROL_DISABLED" : body.error || "تعذر تنفيذ العملية.");
  return body.data as T;
}
const field = "block w-full rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm";
const button = "rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-bold disabled:opacity-50";
const roles = { owner: "مالك المكتب", admin: "مدير", lawyer: "محامٍ", staff: "موظف", trainee: "متدرب", viewer: "مشاهد" };
const datasetNames: Record<ControlDataset, string> = { clients: "العملاء", matters: "القضايا", tasks: "المهام", hearings: "الجلسات", financial_records: "الحسابات", documents: "المستندات", legal_drafts: "المسودات والمراجعات" };
type Tab = "overview" | "members" | "support" | "backup" | "audit";

export function ControlCenter({ onMfaRequired }: { onMfaRequired: () => void }) {
  const [offices, setOffices] = useState<ControlPage<ControlOffice>>({ items: [], nextCursor: null });
  const [now] = useState(() => Date.now());
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<ControlOffice | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [reason, setReason] = useState("");
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void controlRequest<ControlPage<ControlOffice>>("list", null, { limit: 20, after: cursor }, controller.signal)
      .then(data => { if (!controller.signal.aborted) { setOffices(data); setError(""); } })
      .catch(e => { if (!controller.signal.aborted) { if (e.message === "MFA_REQUIRED") onMfaRequired(); else setError(e.message); } });
    return () => controller.abort();
  }, [cursor, revision, onMfaRequired]);
  const request = useCallback(<T,>(action: string, input: Record<string, unknown> = {}) => controlRequest<T>(action, selected?.id ?? null, input).catch(e => { if (e.message === "MFA_REQUIRED") onMfaRequired(); throw e; }), [selected?.id, onMfaRequired]);
  return <section className="space-y-5" aria-label="AXIA Control Center">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-[var(--axia-gold)]">AXIA CONTROL CENTER</p><h2 className="mt-2 text-2xl font-bold">إدارة المكاتب والاشتراكات</h2><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">تحكم مركزي، دخول دعم محدد المدة، ونسخ خاصة بكل مكتب. العمليات الحساسة محفوظة باسم حساب المطوّر.</p></div><button type="button" onClick={() => setCreating(v => !v)} className={button}>إضافة مكتب</button></div>
    {creating ? <CreateOffice onCreated={() => { setCreating(false); setRevision(n => n + 1); }} /> : null}
    {error ? <p role="alert" className="rounded-xl border border-red-500/40 p-4 text-sm">{error}</p> : null}
    <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.3fr)_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" aria-label="اختيار المكتب">
        <h3 className="font-bold">المكاتب المشتركة</h3>
        {offices.items.map(office => <button type="button" key={office.id} aria-pressed={selected?.id === office.id} onClick={() => { setSelected(office); setReason(""); setTab("overview"); }} className={`block w-full min-w-0 rounded-xl border p-4 text-right ${selected?.id === office.id ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : "border-[var(--border)]"}`}><span className="block break-words font-bold">{office.name}</span><span className="mt-2 block text-xs text-[var(--text-muted)]">{office.status === "suspended" ? "معلّق" : office.expiresAt && Date.parse(office.expiresAt) < now ? "انتهت المدة" : "نشط"} · {office.plan === "unconfigured" ? "لم تحدد باقته" : office.plan}</span></button>)}
        {!offices.items.length ? <p className="text-sm text-[var(--text-muted)]">لا توجد مكاتب في هذه الصفحة.</p> : null}
        <div className="flex flex-wrap gap-2">{cursor ? <button type="button" onClick={() => setCursor(null)} className={button}>أول صفحة</button> : null}{offices.nextCursor ? <button type="button" onClick={() => setCursor(offices.nextCursor)} className={button}>المزيد</button> : null}</div>
      </aside>
      <div className="min-w-0 space-y-4">
        {selected ? <>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5"><h3 className="text-xl font-bold break-words">{selected.name}</h3><p dir="ltr" className="mt-2 break-all text-right text-xs text-[var(--text-muted)]">{selected.slug}</p><label className="mt-4 block space-y-2"><span className="text-sm font-bold">سبب الإجراء أو المتابعة — مطلوب للتغيير والدعم والتصدير</span><input value={reason} onChange={e => setReason(e.target.value)} maxLength={500} placeholder="مثال: مراجعة مشكلة أبلغ عنها مالك المكتب" className={field} /></label></div>
          <div role="group" aria-label="أقسام المكتب" className="flex flex-wrap gap-2">{([["overview", "المكتب والاشتراك"], ["members", "الأعضاء والصلاحيات"], ["support", "متابعة العمل"], ["backup", "النسخ والتحقق"], ["audit", "سجل الإدارة"]] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className={`${button} ${tab === value ? "border-[var(--axia-gold)] bg-[var(--axia-gold-dim)]" : ""}`}>{label}</button>)}</div>
          <div key={selected.id + tab} className="min-h-96 min-w-0">
            {tab === "overview" ? <OfficeSettings request={request} reason={reason} onChanged={() => setRevision(n => n + 1)} /> : null}
            {tab === "members" ? <OfficeMembers request={request} reason={reason} /> : null}
            {tab === "support" ? <OfficeSupport request={request} reason={reason} /> : null}
            {tab === "backup" ? <OfficeBackupPanel officeId={selected.id} reason={reason} request={request} /> : null}
            {tab === "audit" ? <ControlAudit request={request} /> : null}
          </div>
        </> : <div className="grid min-h-96 place-items-center rounded-2xl border border-dashed border-[var(--border)] p-6 text-center text-[var(--text-muted)]">اختار مكتبًا لعرض اشتراكه وموظفيه وأدوات المتابعة والنسخ.</div>}
      </div>
    </div>
  </section>;
}

type RequestProps = { request: <T>(action: string, input?: Record<string, unknown>) => Promise<T>; reason: string };
function OfficeSettings({ request, reason, onChanged }: RequestProps & { onChanged: () => void }) {
  const [overview, setOverview] = useState<OfficeOverview | null>(null);
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0);
  useEffect(() => { let current = true; void request<OfficeOverview>("overview").then(v => { if (current) setOverview(v); }).catch(e => { if (current) setMessage(e.message); }); return () => { current = false; }; }, [request, revision]);
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!overview) return;
    const form = new FormData(event.currentTarget);
    if (!confirm(`تأكيد تحديث إعدادات مكتب «${overview.office.name}»؟ التعليق أو انتهاء المدة يوقف وصول أعضاء المكتب مع الاحتفاظ بالبيانات.`)) return;
    setBusy(true);
    try { await request("configure", { revision: overview.control?.revision ?? 0, status: form.get("status"), plan: form.get("plan"), expiresAt: form.get("expires") ? new Date(String(form.get("expires"))).toISOString() : null, seatLimit: Number(form.get("seats")), storageLimitMb: Number(form.get("storage")), rajihEnabled: form.get("rajih") === "on", reason }); setMessage("تم حفظ الإعدادات وتسجيل العملية."); setRevision(n => n + 1); onChanged(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذر الحفظ."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4">{message ? <p role="status" className="text-sm leading-7">{message}</p> : null}{overview ? <>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[["الأعضاء", overview.members], ["العملاء", overview.clients], ["القضايا", overview.matters], ["المسودات", overview.drafts]].map(([label, count]) => <div key={label} className="rounded-xl border border-[var(--border)] p-4"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-2 text-2xl font-bold">{count}</p></div>)}</div>
    <p className="text-sm text-[var(--text-muted)]">المساحة المسجلة: {(overview.storageBytes / 1048576).toFixed(2)} MB. إعدادات المكاتب القديمة تظل كما هي حتى أول حفظ صريح.</p>
    <form key={overview.control?.revision ?? 0} onSubmit={event => void save(event)} className="rounded-2xl border border-[var(--border)] p-5"><fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
      <label className="space-y-2"><span>حالة المكتب</span><select name="status" defaultValue={overview.control?.status ?? "active"} className={field}><option value="active">نشط</option><option value="suspended">معلّق — البيانات محفوظة</option></select></label>
      <label className="space-y-2"><span>اسم الباقة اليدوية</span><input name="plan" required maxLength={80} defaultValue={overview.control?.plan ?? "manual"} className={field} /></label>
      <label className="space-y-2"><span>انتهاء المدة — بتوقيت جهازك، فارغ للمدة المفتوحة</span><input type="datetime-local" name="expires" defaultValue={overview.control?.expires_at ? new Date(Date.parse(overview.control.expires_at) - new Date(overview.control.expires_at).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ""} className={field} /></label>
      <label className="space-y-2"><span>الحد الأقصى للعضويات</span><input name="seats" type="number" min={1} max={10000} required defaultValue={overview.control?.seat_limit ?? 10} className={field} /></label>
      <label className="space-y-2"><span>حد التخزين بالـMB</span><input name="storage" type="number" min={1} max={1048576} required defaultValue={overview.control?.storage_limit_mb ?? 1024} className={field} /></label>
      <label className="flex items-center gap-3"><input type="checkbox" name="rajih" defaultChecked={overview.control?.rajih_enabled ?? true} /><span>تفعيل RAJIH للمكتب</span></label>
      <button disabled={reason.trim().length < 8} className={button}>حفظ إعدادات المكتب</button>
    </fieldset></form>
  </> : <p role="status">جارٍ تحميل بيانات المكتب…</p>}</section>;
}

function OfficeMembers({ request, reason }: RequestProps) {
  const [page, setPage] = useState<ControlPage<ControlMember>>({ items: [], nextCursor: null }); const [after, setAfter] = useState<string | null>(null); const [revision, setRevision] = useState(0); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { let current = true; void request<ControlPage<ControlMember>>("members", { limit: 20, after }).then(v => { if (current) setPage(v); }).catch(e => { if (current) setMessage(e.message); }); return () => { current = false; }; }, [request, after, revision]);
  async function save(event: FormEvent<HTMLFormElement>, member: ControlMember) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (!confirm(`تأكيد تغيير صلاحية أو وصول «${member.email}» داخل هذا المكتب؟`)) return;
    setBusy(true); try { await request("member", { userId: member.id, role: data.get("role"), blocked: data.get("blocked") === "on", reason }); setMessage("تم تحديث العضوية وتسجيل العملية."); setRevision(n => n + 1); } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر التحديث."); } finally { setBusy(false); }
  }
  return <section className="space-y-3"><p className="text-sm leading-7 text-[var(--text-muted)]">تعليق العضو يوقف وصوله لهذا المكتب. حساب المطوّر وآخر مالك صالح محميان؛ لا يتم حذف حسابات أو إرسال دعوات من هنا.</p>{message ? <p role="status">{message}</p> : null}{page.items.map(member => <form key={member.id + member.role + member.blocked} onSubmit={e => void save(e, member)} className="rounded-xl border border-[var(--border)] p-4"><fieldset disabled={busy || member.protected} className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><p className="font-bold break-words">{member.name || "عضو المكتب"}</p><p dir="ltr" className="break-all text-right text-sm text-[var(--text-muted)]">{member.email}</p>{member.protected ? <p className="mt-2 text-xs text-[var(--axia-gold)]">حساب منصة محمي</p> : null}</div><label><span className="sr-only">دور {member.email}</span><select name="role" defaultValue={member.role} className={field}>{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input name="blocked" type="checkbox" defaultChecked={member.blocked} />تعليق الوصول</label><button disabled={reason.trim().length < 8} className={button}>حفظ العضوية</button></fieldset></form>)}<div className="flex gap-2">{after ? <button type="button" onClick={() => setAfter(null)} className={button}>أول صفحة</button> : null}{page.nextCursor ? <button type="button" onClick={() => setAfter(page.nextCursor)} className={button}>المزيد</button> : null}</div></section>;
}

function OfficeSupport({ request, reason }: RequestProps) {
  const [expires, setExpires] = useState(""); const [dataset, setDataset] = useState<ControlDataset>("clients"); const [page, setPage] = useState<ControlPage<Record<string, unknown>>>({ items: [], nextCursor: null }); const [after, setAfter] = useState<string | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!expires) return; const timer = setTimeout(() => { setExpires(""); setPage({ items: [], nextCursor: null }); setMessage("انتهت مدة المتابعة. ابدأ جلسة جديدة عند الحاجة."); }, Math.max(0, Date.parse(expires) - Date.now())); return () => clearTimeout(timer); }, [expires]);
  useEffect(() => { if (!expires) return; let current = true; void request<ControlPage<Record<string, unknown>>>("records", { dataset, limit: 20, after }).then(v => { if (current) { setPage(v); setMessage(""); } }).catch(e => { if (current) { setPage({ items: [], nextCursor: null }); setMessage(e.message); } }); return () => { current = false; }; }, [request, dataset, after, expires]);
  async function begin() { setBusy(true); try { const grant = await request<{ expiresAt: string }>("support", { reason }); setExpires(grant.expiresAt); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر بدء المتابعة."); } finally { setBusy(false); } }
  async function end() { setBusy(true); try { await request("end_support"); setExpires(""); setPage({ items: [], nextCursor: null }); setMessage("انتهى وصول الدعم لهذا المكتب."); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر الإنهاء."); } finally { setBusy(false); } }
  return <section className="space-y-4 rounded-2xl border border-[var(--border)] p-5"><h3 className="text-lg font-bold">متابعة بيانات المكتب</h3><p className="text-sm leading-7 text-[var(--text-muted)]">تبدأ جلسة متابعة لمدة 15 دقيقة، مرتبطة بحسابك وجلسة الدخول والمكتب المحدد. يتم تسجيل سبب المتابعة والأقسام التي قرأتها.</p>{!expires ? <button type="button" disabled={busy || reason.trim().length < 8} onClick={() => void begin()} className={button}>بدء متابعة المكتب</button> : <><div className="flex flex-wrap items-center gap-3"><span className="text-sm">تنتهي الجلسة: {new Date(expires).toLocaleTimeString("ar-EG")}</span><button type="button" disabled={busy} onClick={() => void end()} className={button}>إنهاء المتابعة</button></div><label className="block space-y-2"><span>قسم العمل</span><select value={dataset} onChange={e => { setDataset(e.target.value as ControlDataset); setAfter(null); setPage({ items: [], nextCursor: null }); }} className={field}>{CONTROL_DATASETS.map(d => <option key={d} value={d}>{datasetNames[d]}</option>)}</select></label><div className="space-y-3">{page.items.map(row => <details key={String(row.id)} className="min-w-0 rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer font-bold break-words">{String(row.title || row.name || (row.payload as Record<string, unknown> | undefined)?.title || row.id)}</summary><pre dir="ltr" className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs leading-6">{JSON.stringify(row, null, 2)}</pre></details>)}</div>{!page.items.length && !message ? <p className="text-sm text-[var(--text-muted)]">لا توجد سجلات في هذه الصفحة.</p> : null}<div className="flex gap-2">{after ? <button type="button" onClick={() => setAfter(null)} className={button}>أول صفحة</button> : null}{page.nextCursor ? <button type="button" onClick={() => setAfter(page.nextCursor)} className={button}>المزيد</button> : null}</div></>}{message ? <p role="status" className="text-sm leading-7">{message}</p> : null}</section>;
}

function ControlAudit({ request }: Pick<RequestProps, "request">) {
  const [page, setPage] = useState<ControlPage<Record<string, unknown>>>({ items: [], nextCursor: null }); const [after, setAfter] = useState<string | null>(null); const [error, setError] = useState("");
  useEffect(() => { let current = true; void request<ControlPage<Record<string, unknown>>>("audit", { limit: 20, after }).then(v => { if (current) setPage(v); }).catch(e => { if (current) setError(e.message); }); return () => { current = false; }; }, [request, after]);
  return <section className="space-y-3">{error ? <p role="alert">{error}</p> : null}{page.items.map(row => <details key={String(row.id)} className="rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer"><span dir="ltr">{String(row.action)}</span> · {new Date(String(row.created_at)).toLocaleString("ar-EG")}</summary><p className="mt-3 text-sm leading-7">{String(row.reason)}</p><pre dir="ltr" className="mt-3 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(row.detail, null, 2)}</pre></details>)}<div className="flex gap-2">{after ? <button type="button" onClick={() => setAfter(null)} className={button}>أول صفحة</button> : null}{page.nextCursor ? <button type="button" onClick={() => setAfter(page.nextCursor)} className={button}>المزيد</button> : null}</div></section>;
}

function CreateOffice({ onCreated }: { onCreated: () => void }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (!confirm("إنشاء مكتب وربطه بالحساب الموثق المحدد كمالك؟")) return;
    setBusy(true); try { await controlRequest("create", null, { name: data.get("name"), slug: data.get("slug"), ownerEmail: data.get("owner"), reason: data.get("reason") }); onCreated(); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر إنشاء المكتب."); } finally { setBusy(false); }
  }
  return <form onSubmit={e => void create(e)} className="rounded-2xl border border-[var(--border)] p-5 space-y-4"><h3 className="font-bold">إضافة مكتب لمالك لديه حساب موثّق</h3><p className="text-sm leading-7 text-[var(--text-muted)]">الحساب يجب أن يكون موثّق البريد وغير مرتبط بمكتب آخر. إنشاء حسابات جديدة وإرسال البريد مرحلة منفصلة.</p><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><label className="space-y-2"><span>اسم المكتب</span><input name="name" required minLength={2} maxLength={120} className={field} /></label><label className="space-y-2"><span>المعرّف المختصر بالإنجليزية</span><input name="slug" dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={2} maxLength={64} required className={field} /></label><label className="space-y-2"><span>بريد حساب المالك الموثّق</span><input name="owner" type="email" maxLength={254} dir="ltr" required className={field} /></label><label className="space-y-2"><span>سبب الإنشاء</span><input name="reason" required minLength={8} maxLength={500} className={field} /></label><button className={button}>إنشاء المكتب</button></fieldset>{message ? <p role="status">{message}</p> : null}</form>;
}
