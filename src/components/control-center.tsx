"use client";
import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Building2, Users, Scale, FileText, Settings2, ShieldCheck, LifeBuoy, Archive, History, Plus, Search } from "lucide-react";
import styles from "@/components/platform-workspace.module.css";
import { SubscriptionExpiry } from "@/components/subscription-expiry";
import { formatControlDate } from "@/lib/control-presentation";
import { useControlQuery, type ControlRequest } from "@/components/use-control-query";
import { ControlQueryNotice } from "@/components/control-query-notice";
import { OfficeBackupPanel } from "@/components/office-backup-panel";
import { CONTROL_DATASETS, type ControlDataset, type ControlMember, type ControlOffice, type ControlPage, type OfficeOverview } from "@/lib/control-center";

export async function controlRequest<T>(action: string, officeId: string | null, input: Record<string, unknown> = {}, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/platform/control", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, officeId, input }), signal });
  let body: { code?: string; error?: string; data?: T };
  try { body = await response.json(); }
  catch (error) { if (signal?.aborted) throw error; throw new Error("تعذر قراءة استجابة الخادم. أعد المحاولة عند استقرار الاتصال."); }
  if (!body || typeof body !== "object") throw new Error("استجابة الخادم غير مكتملة. أعد المحاولة.");
  if (!response.ok) throw new Error(body.code === "PLATFORM_MFA_REQUIRED" ? "MFA_REQUIRED" : body.code === "CONTROL_DISABLED" ? "CONTROL_DISABLED" : typeof body.error === "string" ? body.error : "تعذر تنفيذ العملية.");
  if (!Object.hasOwn(body, "data")) throw new Error("استجابة الخادم غير مكتملة. أعد المحاولة.");
  return body.data as T;
}
const directoryRequest: ControlRequest = (action, input, signal) => controlRequest(action, null, input, signal);

const field = styles.field;
const button = styles.button;
const roles = { owner: "مالك المكتب", admin: "مدير", lawyer: "محامٍ", staff: "موظف", trainee: "متدرب", viewer: "مشاهد" };
const datasetNames: Record<ControlDataset, string> = { clients: "العملاء", matters: "القضايا", tasks: "المهام", hearings: "الجلسات", financial_records: "الحسابات", documents: "المستندات", legal_drafts: "المسودات والمراجعات" };
type Tab = "overview" | "members" | "support" | "backup" | "audit";

export function ControlCenter({ onMfaRequired }: { onMfaRequired: () => void }) {
  const [now] = useState(() => Date.now());
  const [cursor, setCursor] = useState<string | null>(null);
  const [selected, setSelected] = useState<ControlOffice | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [reason, setReason] = useState("");
  const [revision, setRevision] = useState(0);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const directory = useControlQuery<ControlPage<ControlOffice>>(directoryRequest, "list", { after: cursor, revision });
  const offices = directory.data ?? { items: [], nextCursor: null };
  const displayed = offices.items.filter(office => `${office.name} ${office.slug}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));
  const currentOffice = offices.items.find(office => office.id === selected?.id) ?? selected;
  const request = useCallback(<T,>(action: string, input: Record<string, unknown> = {}, signal?: AbortSignal) => controlRequest<T>(action, selected?.id ?? null, input, signal).catch(e => { if (e.message === "MFA_REQUIRED") onMfaRequired(); throw e; }), [selected?.id, onMfaRequired]);
  useEffect(() => { if (directory.error === "MFA_REQUIRED") onMfaRequired(); }, [directory.error, onMfaRequired]);
  return <section className="space-y-5" aria-label="AXIA Control Center">
    <div className={styles.intro}>
      <div><h2>إدارة المكاتب والاشتراكات</h2><p className={styles.muted}>إدارة الاشتراكات والفريق، ومتابعة العمل والنسخ المشفرة من مكان واحد.</p></div>
      <button type="button" aria-expanded={creating} onClick={() => setCreating(v => !v)} className={`${button} ${styles.primary}`}><Plus size={18} aria-hidden="true" />{creating ? "إغلاق إضافة المكتب" : "إضافة مكتب"}</button>
    </div>
    {creating ? <CreateOffice onCreated={() => { setCreating(false); setRevision(n => n + 1); }} /> : null}
    <div className={styles.workspace}>
      <aside className={styles.sidebar} aria-label="اختيار المكتب" aria-busy={directory.loading}>
        <h3 className={styles.sidebarTitle}><Building2 size={18} aria-hidden="true" />المكاتب المشتركة</h3>
        <label className={styles.label}><span className="sr-only">البحث في المكاتب المعروضة</span><span className="relative block"><Search size={16} aria-hidden="true" className="pointer-events-none absolute end-3 top-4 text-[var(--text-muted)]" /><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="اسم المكتب أو معرّفه" className={`${field} pe-10`} /></span></label>
        <p className={styles.hint}>البحث داخل القائمة الحالية · {offices.items.length} مكتب</p>
        <div className={styles.officeList}>
          {displayed.map(office => <button type="button" key={office.id} aria-pressed={selected?.id === office.id} onClick={() => { setSelected(office); setReason(""); setTab("overview"); }} className={styles.office}><span className={styles.officeName}><bdi>{office.name}</bdi></span><span className={styles.officeMeta}><OfficeStatus office={office} now={now} /><span>{office.plan === "unconfigured" ? "بدون باقة مخصصة" : <bdi>{office.plan}</bdi>}</span></span></button>)}
        </div>
        <ControlQueryNotice {...directory} label="المكاتب" />
        {!directory.loading && !directory.error && !displayed.length ? <p className={styles.muted}>{search ? "لا توجد نتائج في القائمة الحالية." : "لا توجد مكاتب في هذه الصفحة."}</p> : null}
        <div className="mt-4 flex flex-wrap gap-2">{cursor ? <button type="button" disabled={directory.loading} onClick={() => setCursor(null)} className={button}>أول صفحة</button> : null}{offices.nextCursor ? <button type="button" disabled={directory.loading} onClick={() => setCursor(offices.nextCursor)} className={button}>المزيد</button> : null}</div>
      </aside>
      <div className="min-w-0 space-y-4">
        {selected ? <>
          <div className={styles.selected}>
            <div className={styles.selectedHeading}><div><h3><bdi>{currentOffice?.name}</bdi></h3><p className={styles.hint}><bdi dir="ltr">{currentOffice?.slug}</bdi></p></div>{currentOffice ? <OfficeStatus office={currentOffice} now={now} /> : null}</div>
            <label className={styles.label}><span>سبب الإجراء أو المتابعة</span><input value={reason} onChange={e => setReason(e.target.value)} maxLength={500} aria-describedby="control-reason-help" placeholder="مثال: مراجعة مشكلة أبلغ عنها مالك المكتب" className={field} /></label>
            <p id="control-reason-help" className={styles.hint}><ShieldCheck size={14} className="me-1 inline" aria-hidden="true" />اكتب 8 أحرف على الأقل للتغيير أو الدعم أو التصدير. السبب يُحفظ في سجل الإدارة.</p>
          </div>
          <div role="group" aria-label="أقسام المكتب" className={styles.tabs}>{([["overview", "المكتب والاشتراك", Settings2], ["members", "الأعضاء والصلاحيات", Users], ["support", "متابعة العمل", LifeBuoy], ["backup", "النسخ والتحقق", Archive], ["audit", "سجل الإدارة", History]] as const).map(([value, label, Icon]) => <button type="button" key={value} aria-pressed={tab === value} onClick={() => setTab(value)} className={styles.tab}><Icon size={17} aria-hidden="true" />{label}</button>)}</div>
          <div key={selected.id + tab} className={styles.content}>
            {tab === "overview" ? <OfficeSettings request={request} reason={reason} onChanged={() => setRevision(n => n + 1)} /> : null}
            {tab === "members" ? <OfficeMembers request={request} reason={reason} /> : null}
            {tab === "support" ? <OfficeSupport request={request} reason={reason} /> : null}
            {tab === "backup" ? <OfficeBackupPanel officeId={selected.id} reason={reason} request={request} /> : null}
            {tab === "audit" ? <ControlAudit request={request} /> : null}
          </div>
        </> : <div className={styles.empty}><Building2 size={42} className="text-[var(--axia-gold)]" aria-hidden="true" /><h3 className="text-xl font-bold">اختر المكتب الذي تريد إدارته</h3><p className={styles.muted}>تظهر هنا حالة الاشتراك والفريق وأدوات متابعة العمل والنسخ.</p></div>}
      </div>
    </div>
  </section>;
}

function OfficeStatus({ office, now }: { office: ControlOffice; now: number }) {
  const status = office.status === "suspended" ? "معلّق" : office.expiresAt && Date.parse(office.expiresAt) < now ? "انتهت المدة" : "نشط";
  return <span className={styles.badge} data-tone={status === "نشط" ? "active" : "inactive"}>{status}</span>;
}

type RequestProps = { request: ControlRequest; reason: string };
function OfficeSettings({ request, reason, onChanged }: RequestProps & { onChanged: () => void }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [revision, setRevision] = useState(0);
  const read = useControlQuery<OfficeOverview>(request, "overview", { revision });
  const overview = read.data;
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!overview) return;
    const form = new FormData(event.currentTarget);
    if (!confirm(`تأكيد تحديث إعدادات مكتب «${overview.office.name}»؟ التعليق أو انتهاء المدة يوقف وصول أعضاء المكتب مع الاحتفاظ بالبيانات.`)) return;
    setBusy(true);
    try { await request("configure", { revision: overview.control?.revision ?? 0, status: form.get("status"), plan: form.get("plan"), expiresAt: form.get("expiresDate") ? new Date(`${form.get("expiresDate")}T${form.get("expiresTime")}`).toISOString() : null, seatLimit: Number(form.get("seats")), storageLimitMb: Number(form.get("storage")), rajihEnabled: form.get("rajih") === "on", reason }); setMessage("تم حفظ الإعدادات وتسجيل العملية."); setRevision(n => n + 1); onChanged(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "تعذر الحفظ."); }
    finally { setBusy(false); }
  }
  return <section className="space-y-4" aria-busy={read.loading}><ControlQueryNotice {...read} label="بيانات المكتب" />{message ? <p role="status" className={styles.notice}>{message}</p> : null}{overview ? <>
    <dl className={styles.stats}>{([["الأعضاء", overview.members, Users], ["العملاء", overview.clients, Building2], ["القضايا", overview.matters, Scale], ["المسودات", overview.drafts, FileText]] as const).map(([label, count, Icon]) => <div key={label} className={styles.stat}><dt><Icon size={15} aria-hidden="true" />{label}</dt><dd>{new Intl.NumberFormat("ar-EG").format(count)}</dd></div>)}</dl>
    <form key={overview.control?.revision ?? 0} onSubmit={event => void save(event)} className={styles.surface}>
      <h3 className={styles.sectionHeading}><Settings2 size={20} aria-hidden="true" />الاشتراك وحدود الاستخدام</h3>
      <p className={styles.muted}>{overview.control ? "راجع الحالة والمدة والحدود قبل حفظ التغييرات." : "لم تُخصص إعدادات لهذا المكتب بعد. القيم المقترحة لا تُطبّق إلا عند الحفظ."}</p>
      <fieldset disabled={busy} className={styles.formGrid}>
        <label className={styles.label}><span>حالة المكتب</span><select name="status" defaultValue={overview.control?.status ?? "active"} className={field}><option value="active">نشط</option><option value="suspended">معلّق — البيانات محفوظة</option></select></label>
        <label className={styles.label}><span>اسم الباقة اليدوية</span><input name="plan" required maxLength={80} defaultValue={overview.control?.plan ?? "manual"} className={field} /></label>
        <SubscriptionExpiry value={overview.control?.expires_at ?? null} />
        <label className={styles.label}><span>الحد الأقصى للعضويات</span><input name="seats" type="number" min={1} max={10000} required defaultValue={overview.control?.seat_limit ?? 10} className={field} /></label>
        <label className={styles.label}><span>حد التخزين بالـMB</span><input name="storage" type="number" min={1} max={1048576} required defaultValue={overview.control?.storage_limit_mb ?? 1024} className={field} /><span className={styles.hint}>المساحة المسجلة: <bdi dir="ltr">{(overview.storageBytes / 1048576).toFixed(2)} MB</bdi></span></label>
        <label className="flex items-center gap-3 text-sm"><input type="checkbox" name="rajih" defaultChecked={overview.control?.rajih_enabled ?? true} /><span>تفعيل RAJIH للمكتب</span></label>
        <div className={styles.footer}><p className={styles.hint}>{reason.trim().length < 8 ? "أضف سبب الإجراء أعلى الصفحة لتفعيل الحفظ." : "تُسجّل التغييرات باسم حسابك."}</p><button disabled={reason.trim().length < 8} className={`${button} ${styles.primary}`}>حفظ إعدادات المكتب</button></div>
      </fieldset>
    </form>
  </> : null}</section>;
}

function OfficeMembers({ request, reason }: RequestProps) {
  const [after, setAfter] = useState<string | null>(null); const [revision, setRevision] = useState(0); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const read = useControlQuery<ControlPage<ControlMember>>(request, "members", { after, revision });
  const page = read.data ?? { items: [], nextCursor: null };
  async function save(event: FormEvent<HTMLFormElement>, member: ControlMember) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (!confirm(`تأكيد تغيير صلاحية أو وصول «${member.email}» داخل هذا المكتب؟`)) return;
    setBusy(true); try { await request("member", { userId: member.id, role: data.get("role"), blocked: data.get("blocked") === "on", reason }); setMessage("تم تحديث العضوية وتسجيل العملية."); setRevision(n => n + 1); } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر التحديث."); } finally { setBusy(false); }
  }
  return <section className="space-y-3" aria-busy={read.loading}><ControlQueryNotice {...read} label="الأعضاء" /><p className="text-sm leading-7 text-[var(--text-muted)]">تعليق العضو يوقف وصوله لهذا المكتب. حساب المطوّر وآخر مالك صالح محميان؛ لا يتم حذف حسابات أو إرسال دعوات من هنا.</p>{message ? <p role="status">{message}</p> : null}{page.items.map(member => <form key={member.id + member.role + member.blocked} onSubmit={e => void save(e, member)} className="rounded-xl border border-[var(--border)] p-4"><fieldset disabled={busy || member.protected} className="flex flex-wrap items-center gap-3"><div className="min-w-0 flex-1"><p className="font-bold break-words">{member.name || "عضو المكتب"}</p><p dir="ltr" className="break-all text-right text-sm text-[var(--text-muted)]">{member.email}</p>{member.protected ? <p className="mt-2 text-xs text-[var(--axia-gold)]">حساب منصة محمي</p> : null}</div><label><span className="sr-only">دور {member.email}</span><select name="role" defaultValue={member.role} className={field}>{Object.entries(roles).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input name="blocked" type="checkbox" defaultChecked={member.blocked} />تعليق الوصول</label><button disabled={reason.trim().length < 8} className={button}>حفظ العضوية</button></fieldset></form>)}{!read.loading && !read.error && !page.items.length ? <p className={styles.muted}>لا توجد عضويات في هذه الصفحة.</p> : null}<div className="flex gap-2">{after ? <button type="button" disabled={read.loading || busy} onClick={() => setAfter(null)} className={button}>أول صفحة</button> : null}{page.nextCursor ? <button type="button" disabled={read.loading || busy} onClick={() => setAfter(page.nextCursor)} className={button}>المزيد</button> : null}</div></section>;
}

function OfficeSupport({ request, reason }: RequestProps) {
  const datasetLabelId = useId();
  const [expires, setExpires] = useState(""); const [dataset, setDataset] = useState<ControlDataset>("clients"); const [after, setAfter] = useState<string | null>(null); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!expires) return; const timer = setTimeout(() => { setExpires(""); setMessage("انتهت مدة المتابعة. ابدأ جلسة جديدة عند الحاجة."); }, Math.max(0, Date.parse(expires) - Date.now())); return () => clearTimeout(timer); }, [expires]);
  const read = useControlQuery<ControlPage<Record<string, unknown>>>(request, "records", { after, dataset, revision: expires, enabled: Boolean(expires) });
  const page = read.data ?? { items: [], nextCursor: null };
  async function begin() { setBusy(true); try { const grant = await request<{ expiresAt: string }>("support", { reason }); setExpires(grant.expiresAt); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر بدء المتابعة."); } finally { setBusy(false); } }
  async function end() { setBusy(true); try { await request("end_support"); setExpires(""); setMessage("انتهى وصول الدعم لهذا المكتب."); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر الإنهاء."); } finally { setBusy(false); } }
  return <section className={`${styles.surface} space-y-4`}><h3 className={styles.sectionHeading}><LifeBuoy size={20} aria-hidden="true" />متابعة بيانات المكتب</h3><p className="text-sm leading-7 text-[var(--text-muted)]">تبدأ جلسة متابعة لمدة 15 دقيقة، مرتبطة بحسابك وجلسة الدخول والمكتب المحدد. يتم تسجيل سبب المتابعة والأقسام التي قرأتها.</p>{!expires ? <button type="button" disabled={busy || reason.trim().length < 8} onClick={() => void begin()} className={button}>بدء متابعة المكتب</button> : <><div className="flex flex-wrap items-center gap-3"><span className="text-sm">تنتهي الجلسة: <bdi>{formatControlDate(expires)}</bdi></span><button type="button" disabled={busy} onClick={() => void end()} className={button}>إنهاء المتابعة</button></div><label className="block space-y-2"><span id={datasetLabelId}>قسم العمل</span><select aria-labelledby={datasetLabelId} value={dataset} onChange={e => { setDataset(e.target.value as ControlDataset); setAfter(null); }} className={field}>{CONTROL_DATASETS.map(d => <option key={d} value={d}>{datasetNames[d]}</option>)}</select></label><ControlQueryNotice {...read} label="سجلات المتابعة" /><div className="space-y-3">{page.items.map(row => <details key={String(row.id)} className="min-w-0 rounded-xl border border-[var(--border)] p-4"><summary className="cursor-pointer font-bold break-words">{String(row.title || row.name || (row.payload as Record<string, unknown> | undefined)?.title || row.id)}</summary><pre dir="ltr" className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-all text-xs leading-6">{JSON.stringify(row, null, 2)}</pre></details>)}</div>{!read.loading && !read.error && !page.items.length && !message ? <p className="text-sm text-[var(--text-muted)]">لا توجد سجلات في هذه الصفحة.</p> : null}<div className="flex gap-2">{after ? <button type="button" disabled={read.loading || busy} onClick={() => setAfter(null)} className={button}>أول صفحة</button> : null}{page.nextCursor ? <button type="button" disabled={read.loading || busy} onClick={() => setAfter(page.nextCursor)} className={button}>المزيد</button> : null}</div></>}{message ? <p role="status" className="text-sm leading-7">{message}</p> : null}</section>;
}

function ControlAudit({ request }: Pick<RequestProps, "request">) {
  const [after, setAfter] = useState<string | null>(null);
  const read = useControlQuery<ControlPage<Record<string, unknown>>>(request, "audit", { after });
  const page = read.data ?? { items: [], nextCursor: null };
  return <section className="space-y-3"><h3 className={styles.sectionHeading}><History size={20} aria-hidden="true" />سجل إجراءات المكتب</h3><p className={styles.muted}>توقيتات السجل معروضة حسب توقيت جهازك. افتح الإجراء لعرض سببه وتفاصيله.</p><ControlQueryNotice {...read} label="سجل الإدارة" />{page.items.map(row => <details key={String(row.id)} className={styles.auditItem}><summary className={styles.auditSummary}><bdi dir="ltr">{String(row.action)}</bdi><time dateTime={String(row.created_at)}><bdi>{formatControlDate(String(row.created_at))}</bdi></time></summary><p className="mt-3 text-sm leading-7">{String(row.reason)}</p><pre dir="ltr" className="mt-3 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(row.detail, null, 2)}</pre></details>)}{!read.loading && !read.error && !page.items.length ? <p className={styles.muted}>لا توجد إجراءات في هذه الصفحة.</p> : null}<div className="flex gap-2">{after ? <button type="button" disabled={read.loading} onClick={() => setAfter(null)} className={button}>أول صفحة</button> : null}{page.nextCursor ? <button type="button" disabled={read.loading} onClick={() => setAfter(page.nextCursor)} className={button}>المزيد</button> : null}</div></section>;
}

function CreateOffice({ onCreated }: { onCreated: () => void }) {
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (!confirm("إنشاء مكتب وربطه بالحساب الموثق المحدد كمالك؟")) return;
    setBusy(true); try { await controlRequest("create", null, { name: data.get("name"), slug: data.get("slug"), ownerEmail: data.get("owner"), reason: data.get("reason") }); onCreated(); } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر إنشاء المكتب."); } finally { setBusy(false); }
  }
  return <form onSubmit={e => void create(e)} className={`${styles.surface} space-y-4`}><h3 className="font-bold">إضافة مكتب لمالك لديه حساب موثّق</h3><p className="text-sm leading-7 text-[var(--text-muted)]">الحساب يجب أن يكون موثّق البريد وغير مرتبط بمكتب آخر. إنشاء حسابات جديدة وإرسال البريد مرحلة منفصلة.</p><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-2"><label className="space-y-2"><span>اسم المكتب</span><input name="name" required minLength={2} maxLength={120} className={field} /></label><label className="space-y-2"><span>المعرّف المختصر بالإنجليزية</span><input name="slug" dir="ltr" pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={2} maxLength={64} required className={field} /></label><label className="space-y-2"><span>بريد حساب المالك الموثّق</span><input name="owner" type="email" maxLength={254} dir="ltr" required className={field} /></label><label className="space-y-2"><span>سبب الإنشاء</span><input name="reason" required minLength={8} maxLength={500} className={field} /></label><button className={button}>إنشاء المكتب</button></fieldset>{message ? <p role="status">{message}</p> : null}</form>;
}
