"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Archive, History, Inbox, Plus, RotateCcw } from "lucide-react";
import type { Client, Matter } from "@/types/legal";
import { REQUEST_STATUSES, type ClientRequest, type ClientRequestEvent, type ClientRequestInput, type RequestAssignee, type RequestStatus } from "@/lib/client-requests";

type RequestPage = { enabled: true; officeId: string; canWrite: boolean; rows: ClientRequest[]; hasMore: boolean; assignees: RequestAssignee[] };
type Form = { id?: string; revision?: number; input: ClientRequestInput };
const base = "/api/client-requests";
const field = "min-h-11 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm text-[var(--text)] focus-visible:outline-2 focus-visible:outline-[var(--axia-gold)]";
const secondary = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border-strong)] bg-[var(--panel)] px-3 py-2 text-sm font-medium hover:bg-[var(--accent)] disabled:opacity-50";
const primary = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--axia-gold)] px-4 py-2 text-sm font-bold text-slate-950 hover:brightness-110 disabled:opacity-50";
const panel = "rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 sm:p-6";
const blank: ClientRequestInput = { title: "", summary: "", client_id: "", matter_id: null, assigned_to: null, status: "new", follow_up_on: null };
const day = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeZone: "UTC" });
const moment = new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Cairo" });
const actionLabels: Record<string, string> = { "client_request.created": "تسجيل الطلب", "client_request.updated": "تعديل الطلب", "client_request.archived": "أرشفة الطلب", "client_request.restored": "استرجاع الطلب" };
const fieldLabels: Record<string, string> = { title: "العنوان", summary: "التفاصيل", client_id: "الموكل", matter_id: "القضية", assigned_to: "المسؤول", status: "الحالة", follow_up_on: "موعد المتابعة", archived: "الأرشفة" };
const followUpLabel = (value: string | null) => value ? day.format(new Date(value + "T00:00:00Z")) : "غير محدد";

function RequestHistory({ row, onClose }: { row: ClientRequest; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{ page: number; events: ClientRequestEvent[]; hasMore: boolean; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${base}?history=${row.id}&page=${page}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok || !Array.isArray(data.events)) throw new Error(data.error || "تعذر تحميل السجل.");
        setResult({ page, events: data.events, hasMore: data.hasMore });
      })
      .catch(error => {
        if (!controller.signal.aborted) setResult({ page, events: [], hasMore: false, error: error.message || "تعذر تحميل السجل." });
      });
    return () => controller.abort();
  }, [row.id, page]);
  const current = result?.page === page ? result : null;
  return <section className={panel} aria-label="سجل التغييرات">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-lg font-bold">سجل التغييرات</h3><p className="break-words text-sm text-[var(--text-muted)]">{row.title}</p></div>
      <button type="button" className={secondary} onClick={onClose}>إغلاق السجل</button>
    </div>
    {!current ? <p role="status">جارٍ تحميل السجل…</p> : current.error ? <p role="alert">{current.error}</p> :
      current.events.length === 0 ? <p className="text-sm text-[var(--text-muted)]">لا توجد تغييرات مسجّلة.</p> :
        <ol className="divide-y divide-[var(--border)]">
          {current.events.map(event => <li key={event.id} className="py-3 text-sm">
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              <strong>{actionLabels[event.action] ?? "إجراء مسجّل"}</strong>
              <span className="text-[var(--text-muted)]">{event.actor ?? "إجراء من النظام"}</span>
              <time dateTime={event.created_at} className="text-[var(--text-muted)]">{moment.format(new Date(event.created_at))}</time>
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">الإصدار {event.metadata.revision}{event.metadata.changed_fields.length ? ` · ${event.metadata.changed_fields.map(key => fieldLabels[key] ?? key).join("، ")}` : ""}</p>
          </li>)}
        </ol>}
    {(page > 0 || current?.hasMore) && <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" className={secondary} disabled={page === 0} onClick={() => setPage(n => n - 1)}>السجل الأحدث</button>
      <button type="button" className={secondary} disabled={!current?.hasMore} onClick={() => setPage(n => n + 1)}>السجل الأقدم</button>
    </div>}
  </section>;
}

export function ClientRequestsView({ clients, matters }: { clients: Client[]; matters: Matter[] }) {
  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState<RequestStatus | "">("");
  const [page, setPage] = useState(0);
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{ key: string; data?: RequestPage; error?: string; disabled?: boolean }>();
  const [form, setForm] = useState<Form | null>(null);
  const [history, setHistory] = useState<ClientRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notice, setNotice] = useState("");
  const submitting = useRef(false);
  const params = new URLSearchParams({ archived: archived ? "1" : "0", page: String(page), ...(status ? { status } : {}) }).toString();
  const key = `${params}:${reload}`;
  const current = result?.key === key ? result : null;
  const data = current?.data;

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${base}?${params}`, { cache: "no-store", signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (controller.signal.aborted) return;
        if (payload.code === "CLIENT_REQUESTS_DISABLED") setResult({ key, disabled: true });
        else if (!response.ok || payload.enabled !== true || !Array.isArray(payload.rows) || !Array.isArray(payload.assignees)) {
          setResult({ key, error: payload.error || "تعذر تحميل الطلبات." });
        } else setResult({ key, data: payload });
      })
      .catch(() => { if (!controller.signal.aborted) setResult({ key, error: "تعذر الاتصال. حدّث القائمة للمحاولة مرة أخرى." }); });
    return () => controller.abort();
  }, [key, params]);

  function updateInput(values: Partial<ClientRequestInput>) {
    setForm(previous => previous ? { ...previous, input: { ...previous.input, ...values } } : null);
  }

  async function mutate(action: "create" | "update" | "archive" | "restore", row?: ClientRequest) {
    if (!data?.canWrite || submitting.current) return;
    if ((action === "create" || action === "update") && !form) return;
    const selected = row ?? form;
    const payload = {
      action, officeId: data.officeId,
      ...(action === "create" ? {} : { id: selected?.id, revision: selected?.revision }),
      ...(action === "create" || action === "update" ? { input: form?.input } : {}),
    };
    submitting.current = true; setBusy(true); setSaveError(""); setNotice("");
    try {
      const response = await fetch(base, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const saved = await response.json();
      if (!response.ok || !saved.row?.id) throw new Error(saved.error || "لم يتم تأكيد الحفظ.");
      if (action === "create" || action === "update") setForm(null);
      setHistory(null);
      setNotice(action === "archive" ? "تمت الأرشفة. الطلب متاح في الأرشيف." : action === "restore" ? "تم استرجاع الطلب إلى القائمة الحالية." : "تم حفظ الطلب.");
      setReload(n => n + 1);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "لم يتم تأكيد الحفظ. راجع القائمة قبل إعادة المحاولة.");
    } finally { submitting.current = false; setBusy(false); }
  }

  function edit(row: ClientRequest) {
    const { title, summary, client_id, matter_id, assigned_to, status, follow_up_on } = row;
    setSaveError("");
    setForm({ id: row.id, revision: row.revision, input: { title, summary, client_id, matter_id, assigned_to, status, follow_up_on } });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void mutate(form?.id ? "update" : "create");
  }

  const clientLabels = new Map(clients.map(item => [item.id, item.name]));
  const matterLabels = new Map(matters.map(item => [item.id, item.title]));
  const assigneeLabels = new Map(data?.assignees.map(item => [item.id, item.name]));
  const linkedMatters = form ? matters.filter(item => item.clientId === form.input.client_id) : [];

  return <section className="space-y-4" aria-labelledby="client-requests-heading">
    <header className={`${panel} flex flex-wrap items-center justify-between gap-4`}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--axia-gold-dim)] text-[var(--axia-gold)]"><Inbox size={22} aria-hidden="true" /></span>
        <div><h2 id="client-requests-heading" className="text-xl font-bold leading-8 sm:text-2xl">طلبات الموكلين والمتابعات</h2><p className="text-sm leading-6 text-[var(--text-muted)]">سجّل طلب الموكل وحدّد المسؤول وموعد الرد، حتى لو القضية لسه ما اتفتحتش.</p></div>
      </div>
      {data?.canWrite && !form && <button type="button" className={primary} disabled={busy || clients.length === 0} onClick={() => { setSaveError(""); setForm({ input: { ...blank } }); }}><Plus size={18} aria-hidden="true" />طلب جديد</button>}
    </header>
    {notice && <p role="status" className="rounded-lg bg-[var(--axia-gold-dim)] px-4 py-3 text-sm">{notice}</p>}
    {saveError && <p role="alert" className="rounded-lg border border-red-500/40 px-4 py-3 text-sm">{saveError}</p>}
    {current?.disabled ? <div className={panel}><h3 className="font-bold">القسم جاهز للمراجعة</h3><p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">الحفظ وعرض الطلبات غير مفعّلين على هذه النسخة.</p></div> :
      current?.error ? <div className={panel}><p role="alert">{current.error}</p><button type="button" className={`${secondary} mt-3`} onClick={() => setReload(n => n + 1)}>إعادة التحميل</button></div> : null}
    {form && data?.canWrite && <form onSubmit={submit} className={`${panel} space-y-4`} aria-label={form.id ? "تعديل الطلب" : "تسجيل طلب جديد"}>
      <h3 className="text-lg font-bold">{form.id ? "تعديل الطلب" : "تسجيل طلب جديد"}</h3>
      <fieldset disabled={busy} className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm md:col-span-2"><span id="request-field-title">عنوان الطلب</span><input aria-labelledby="request-field-title" className={field} required minLength={2} maxLength={140} value={form.input.title} onChange={event => updateInput({ title: event.target.value })} /></label>
        <label className="space-y-1 text-sm"><span id="request-field-client">الموكل</span><select aria-labelledby="request-field-client" className={field} required value={form.input.client_id} onChange={event => updateInput({ client_id: event.target.value, matter_id: null })}><option value="">اختَر الموكل</option>{clients.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span id="request-field-matter">القضية المرتبطة</span><select aria-labelledby="request-field-matter" className={field} disabled={!form.input.client_id} value={form.input.matter_id ?? ""} onChange={event => updateInput({ matter_id: event.target.value || null })}><option value="">بدون قضية</option>{linkedMatters.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span id="request-field-assignee">المسؤول عن المتابعة</span><select aria-labelledby="request-field-assignee" className={field} value={form.input.assigned_to ?? ""} onChange={event => updateInput({ assigned_to: event.target.value || null })}><option value="">بدون إسناد</option>{form.input.assigned_to && !assigneeLabels.has(form.input.assigned_to) && <option value={form.input.assigned_to}>المسؤول الحالي</option>}{data.assignees.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label className="space-y-1 text-sm"><span id="request-field-follow-up">موعد المتابعة</span><input aria-labelledby="request-field-follow-up" type="date" min="2000-01-01" max="2100-12-31" className={field} value={form.input.follow_up_on ?? ""} onChange={event => updateInput({ follow_up_on: event.target.value || null })} /></label>
        <label className="space-y-1 text-sm"><span id="request-field-status">حالة الطلب</span><select aria-labelledby="request-field-status" className={field} value={form.input.status} onChange={event => updateInput({ status: event.target.value as RequestStatus })}>{Object.entries(REQUEST_STATUSES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
        <label className="space-y-1 text-sm md:col-span-2"><span id="request-field-summary">تفاصيل المتابعة</span><textarea aria-labelledby="request-field-summary" className={field} rows={3} maxLength={600} value={form.input.summary} onChange={event => updateInput({ summary: event.target.value })} /></label>
      </fieldset>
      <div className="flex flex-wrap gap-2"><button type="submit" className={primary} disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ الطلب"}</button><button type="button" className={secondary} disabled={busy} onClick={() => { setForm(null); setSaveError(""); }}>إلغاء</button></div>
    </form>}
    {history && <RequestHistory key={history.id} row={history} onClose={() => setHistory(null)} />}
    {!current?.disabled && !current?.error && <div className={`${panel} space-y-4`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-2" aria-label="قوائم الطلبات">
          <button type="button" className={secondary} aria-pressed={!archived} onClick={() => { setArchived(false); setPage(0); }}>الطلبات الحالية</button>
          <button type="button" className={secondary} aria-pressed={archived} onClick={() => { setArchived(true); setPage(0); }}>الأرشيف</button>
        </div>
        <label className="text-sm"><span id="request-filter-status" className="mb-1 block">تصفية حسب الحالة</span><select aria-labelledby="request-filter-status" className={field} value={status} onChange={event => { setStatus(event.target.value as RequestStatus | ""); setPage(0); }}><option value="">كل الحالات</option>{Object.entries(REQUEST_STATUSES).map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>
      </div>
      {!data ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">جارٍ تحميل الطلبات…</p> :
        data.rows.length === 0 ? <div className="rounded-xl border border-dashed border-[var(--border-strong)] p-6 text-sm leading-7 text-[var(--text-muted)]">{archived ? "لا توجد طلبات مؤرشفة مطابقة." : data.canWrite && clients.length === 0 ? "أضف موكلًا في قسم الموكلين قبل تسجيل أول طلب." : "لا توجد طلبات مطابقة في هذه القائمة."}</div> :
        <ul className="divide-y divide-[var(--border)]">
          {data.rows.map(row => <li key={row.id} className="grid min-w-0 gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2"><h3 className="min-w-0 break-words font-bold">{row.title}</h3><span className="rounded-md bg-[var(--accent-hover)] px-2 py-1 text-xs font-semibold">{REQUEST_STATUSES[row.status]}</span></div>
              <p className="mt-2 break-words text-sm leading-6 text-[var(--text-muted)]">{clientLabels.get(row.client_id) ?? "موكل مرتبط"}{row.matter_id ? ` · ${matterLabels.get(row.matter_id) ?? "قضية مرتبطة"}` : ""} · المسؤول: {row.assigned_to ? assigneeLabels.get(row.assigned_to) ?? (data.canWrite ? "عضو بالمكتب" : "مسند إليك") : "غير محدد"} · المتابعة: {followUpLabel(row.follow_up_on)}</p>
              {row.summary && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{row.summary}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondary} onClick={() => setHistory(row)}><History size={16} aria-hidden="true" />السجل</button>
              {data.canWrite && !row.archived && <button type="button" className={secondary} disabled={busy || !!form} onClick={() => edit(row)}>تعديل</button>}
              {data.canWrite && <button type="button" className={secondary} disabled={busy || !!form} onClick={() => void mutate(row.archived ? "restore" : "archive", row)}>
                {row.archived ? <RotateCcw size={16} aria-hidden="true" /> : <Archive size={16} aria-hidden="true" />}{row.archived ? "استرجاع" : "أرشفة"}
              </button>}
            </div>
          </li>)}
        </ul>}
      {(page > 0 || data?.hasMore) && <div className="flex flex-wrap gap-2"><button type="button" className={secondary} disabled={page === 0} onClick={() => setPage(n => n - 1)}>الصفحة السابقة</button><button type="button" className={secondary} disabled={!data?.hasMore} onClick={() => setPage(n => n + 1)}>الصفحة التالية</button></div>}
    </div>}
  </section>;
}
