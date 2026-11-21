"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Client, Matter } from "@/types/legal";
import type { DocumentVersion, LegalDraft } from "@/types/legal-editor";
import { safeLegalHtml, validDraft, type StoredDraft } from "@/lib/legal-draft-persistence";

export type DraftWorkspaceProps = {
  editorEpoch: number;
  draft: LegalDraft;
  onUpdateDraft: (fields: Partial<LegalDraft>) => void;
  onAddVersion: (version: DocumentVersion) => void;
  onRestoreVersion: (version: DocumentVersion, html: string, words: number, chars: number) => void;
  onCommitToArchive: () => void;
  showToast: (message: string) => void;
  persistenceState: string;
  authorLabel: string;
};
export type DraftBootstrap = { organizationId: string; userId: string; userLabel: string; canWrite: boolean; drafts: StoredDraft[] };
type Entry = { draft: LegalDraft; revision: number; dirty: boolean; archived: boolean; legacyId?: string };
const clean = (d: LegalDraft): LegalDraft => ({ ...d, contentHtml: safeLegalHtml(d.contentHtml), versions: d.versions.map(v => ({ ...v, contentHtml: safeLegalHtml(v.contentHtml) })) });

export function PersistentLegalEditor({ bootstrap, clients, matters, onClose, renderEditor }: {
  bootstrap: DraftBootstrap; clients: Client[]; matters: Matter[]; onClose?: () => void; renderEditor: (props: DraftWorkspaceProps) => ReactNode;
}) {
  const [entries, setEntries] = useState<Entry[]>(() => bootstrap.drafts.filter(d => validDraft(d.payload)).map(d => ({ draft: clean({ ...d.payload, id: d.id, createdAt: d.created_at, updatedAt: d.updated_at }), revision: d.revision, dirty: false, archived: false })));
  const [activeId, setActiveId] = useState(bootstrap.drafts[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [failedIds, setFailedIds] = useState<string[]>([]);
  const [legacy, setLegacy] = useState<LegalDraft[]>([]);
  const [legacyId, setLegacyId] = useState("");
  const [history, setHistory] = useState<{ draftId: string; versions: { id: string; revision: number; payload: LegalDraft; actor_id: string; created_at: string }[]; nextBefore: number | null } | null>(null);
  const entriesRef = useRef(entries);
  const working = useRef(false);
  const failed = useRef(new Set<string>());
  const mounted = useRef(true);
  const change = useCallback((fn: (previous: Entry[]) => Entry[]) => setEntries(previous => { const next = fn(previous); entriesRef.current = next; return next; }), []);

  useEffect(() => {
    mounted.current = true;
    const warn = (event: BeforeUnloadEvent) => { if (entriesRef.current.some(e => e.dirty)) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    const timer = setInterval(() => {
      if (working.current || !bootstrap.canWrite) return;
      const item = entriesRef.current.find(e => e.dirty && !failed.current.has(e.draft.id));
      if (!item) return;
      working.current = true; setBusy(true);
      const sent = JSON.stringify({ draft: item.draft, archived: item.archived });
      void fetch("/api/drafts", { method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", body: JSON.stringify({ officeId: bootstrap.organizationId, id: item.draft.id, revision: item.revision, draft: item.draft, archived: item.archived, legacyId: item.legacyId }) })
        .then(async response => {
          const body = await response.json();
          if (!response.ok || !body.draft || body.draft.id !== item.draft.id || body.draft.revision !== item.revision + 1) throw new Error(body.error || "لم يتم تأكيد الحفظ.");
          if (!mounted.current) return;
          change(previous => previous.map(e => e.draft.id === item.draft.id ? { ...e, revision: body.draft.revision, dirty: JSON.stringify({ draft: e.draft, archived: e.archived }) !== sent } : e));
          setMessage("تم تأكيد الحفظ في المكتب.");
        }).catch(error => { failed.current.add(item.draft.id); if (mounted.current) { setFailedIds(ids => [...new Set([...ids, item.draft.id])]); setMessage(error instanceof Error ? error.message : "تعذر الحفظ؛ احتفظ بتعديلاتك."); } })
        .finally(() => { working.current = false; if (mounted.current) setBusy(false); });
    }, 1000);
    return () => { mounted.current = false; clearInterval(timer); window.removeEventListener("beforeunload", warn); };
  }, [bootstrap.canWrite, bootstrap.organizationId, change]);

  const visible = entries.filter(e => !e.archived || e.dirty);
  const entry = visible.find(e => e.draft.id === activeId) ?? visible[0];
  const entryId = entry ? String(entry.draft.id) : "";
  const update = useCallback((fields: Partial<LegalDraft>) => {
    if (!entryId || !bootstrap.canWrite) return;
    change(previous => previous.map(e => e.draft.id === entryId ? { ...e, draft: clean({ ...e.draft, ...fields, updatedAt: new Date().toISOString() }), dirty: true } : e));
  }, [entryId, bootstrap.canWrite, change]);
  const create = (source?: LegalDraft) => {
    if (!bootstrap.canWrite) return;
    const now = new Date().toISOString();
    const d = clean(source ? { ...source, id: crypto.randomUUID(), createdAt: now, updatedAt: now } : { id: crypto.randomUUID(), title: "مسودة جديدة", docType: "مذكرة دفاع", clientName: "بدون ربط", contentHtml: "<p>ابدأ الكتابة هنا…</p>", createdAt: now, updatedAt: now, currentVersionNumber: "v1.0", versions: [], status: "مسودة قيد التحرير" });
    if (source) { delete d.clientId; delete d.matterId; }
    change(previous => [{ draft: d, revision: 0, dirty: true, archived: false, legacyId: source?.id }, ...previous]);
    setActiveId(d.id); setMessage(source ? "تم تجهيز الاستيراد للمكتب الحالي. النسخة المحلية الأصلية محفوظة؛ راجع ربط العميل والقضية." : "جارٍ حفظ المسودة الجديدة بالمكتب.");
  };
  const loadLegacy = () => {
    try { const parsed = JSON.parse(localStorage.getItem("axia_legal_drafts_v1") ?? "[]"); setLegacy(Array.isArray(parsed) ? parsed.filter(validDraft) : []); }
    catch { setMessage("تعذر قراءة المسودات القديمة؛ لم تتغير النسخة المحلية."); }
  };
  const downloadUnsaved = () => {
    const bytes = new Blob([JSON.stringify(entries.filter(e => e.dirty), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(bytes); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "axia-unsaved-drafts-private.json"; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const loadHistory = async (before?: number) => {
    if (!entry || entry.revision === 0) return;
    try {
      const response = await fetch(`/api/drafts?history=${entry.draft.id}${before ? `&before=${before}` : ""}`, { cache: "no-store" });
      const body = await response.json();
      if (!response.ok || body.draftId !== entry.draft.id || !Array.isArray(body.versions)) throw new Error(body.error || "تعذر تحميل سجل الحفظ.");
      setHistory(body);
    } catch (error) { setMessage(error instanceof Error ? error.message : "تعذر تحميل سجل الحفظ."); }
  };
  return <div className="space-y-4">
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-bold">مسودات المكتب — حفظ دائم وسجل مراجعات</h2><span role="status" className="text-sm text-[var(--text-muted)]">{busy ? "جارٍ الحفظ في المكتب…" : entries.some(e => e.dirty) ? "توجد تعديلات لم يؤكد الخادم حفظها" : "كل التعديلات محفوظة في المكتب"}</span></div>
      <div className="flex flex-wrap gap-2">
        {onClose ? <button type="button" onClick={() => { if (!entries.some(e => e.dirty) || confirm("توجد تعديلات غير محفوظة. نزّل نسخة منها قبل الخروج. هل تريد الخروج؟")) onClose(); }} className="rounded-lg border border-[var(--border)] px-3 py-2">الأرشيف</button> : null}
        <button type="button" disabled={!bootstrap.canWrite} onClick={() => create()} className="rounded-lg bg-[var(--axia-gold)] px-4 py-2 font-bold text-slate-950 disabled:opacity-50">مسودة جديدة</button>
        <button type="button" disabled={!bootstrap.canWrite} onClick={loadLegacy} className="rounded-lg border border-[var(--border)] px-3 py-2">مراجعة المسودات المحلية القديمة</button>
        {entries.some(e => e.dirty) ? <button type="button" onClick={downloadUnsaved} className="rounded-lg border border-[var(--border)] px-3 py-2">تنزيل التعديلات غير المحفوظة</button> : null}
      </div>
      {message ? <p role="status" className="text-sm leading-7">{message}</p> : null}
      {legacy.length ? <div className="flex flex-wrap items-center gap-2"><label htmlFor="legacy-draft">اختار مسودة تخص المكتب الحالي:</label><select id="legacy-draft" value={legacyId} onChange={e => setLegacyId(e.target.value)} className="max-w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="">اختر المسودة</option>{legacy.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select><button type="button" disabled={!legacyId} onClick={() => { const source = legacy.find(d => d.id === legacyId); if (source && confirm("أكد أن هذه المسودة تخص المكتب الحالي. لن تتغير النسخة المحلية الأصلية.")) create(source); }} className="rounded-lg border border-[var(--border)] px-3 py-2">استيراد نسخة للمكتب الحالي</button></div> : null}
    </div>
    {entry ? <>
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] p-3">
        <label htmlFor="stored-draft">المسودة</label><select id="stored-draft" value={entry.draft.id} onChange={e => setActiveId(e.target.value)} className="max-w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2">{visible.map(e => <option key={e.draft.id} value={e.draft.id}>{e.draft.title}</option>)}</select>
        <label htmlFor="draft-client">العميل</label><select id="draft-client" disabled={!bootstrap.canWrite} value={entry.draft.clientId ?? ""} onChange={e => update({ clientId: e.target.value || undefined, clientName: clients.find(c => c.id === e.target.value)?.name ?? "بدون ربط", matterId: undefined, caseNumber: "" })} className="max-w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="">بدون ربط</option>{clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <label htmlFor="draft-matter">القضية</label><select id="draft-matter" disabled={!bootstrap.canWrite} value={entry.draft.matterId ?? ""} onChange={e => { const m = matters.find(m => m.id === e.target.value); update({ matterId: m?.id, caseNumber: m?.caseNumber ?? "", clientId: m?.clientId ?? entry.draft.clientId }); }} className="max-w-full rounded-lg border border-[var(--border)] bg-[var(--background)] p-2"><option value="">بدون قضية</option>{matters.filter(m => !entry.draft.clientId || m.clientId === entry.draft.clientId).map(m => <option key={m.id} value={m.id}>{m.caseNumber}</option>)}</select>
        <button type="button" disabled={!bootstrap.canWrite || busy} onClick={() => { if (confirm("أرشفة المسودة مع الاحتفاظ بها وبكل مراجعاتها؟")) change(prev => prev.map(e => e.draft.id === entry.draft.id ? { ...e, dirty: true, archived: true } : e)); }} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-50">أرشفة المسودة</button>
        <button type="button" disabled={!entry.revision} onClick={() => void loadHistory()} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-50">سجل الحفظ في المكتب</button>
        {failedIds.includes(entry.draft.id) ? <button type="button" onClick={() => { if (confirm("نزّل تعديلاتك غير المحفوظة أولًا. سيتم تحميل أحدث نسخة من المكتب دون فرض تعديل عليها.")) window.location.reload(); }} className="rounded-lg border border-[var(--border)] px-3 py-2">تحميل نسخة المكتب للمراجعة</button> : null}
      </div>
      {history?.draftId === entry.draft.id ? <section className="space-y-3 rounded-xl border border-[var(--border)] p-4"><h3 className="font-bold">سجل الحفظ المؤكد — مراجعات غير قابلة للتعديل</h3>{history.versions.map(v => <details key={v.id} className="rounded-lg border border-[var(--border)] p-3"><summary className="cursor-pointer text-sm">مراجعة {v.revision} · {new Date(v.created_at).toLocaleString("ar-EG")}</summary><p className="mt-2 break-all text-xs">حساب الحفظ: {v.actor_id}</p><div className="my-3 max-h-72 overflow-auto" dangerouslySetInnerHTML={{ __html: safeLegalHtml(v.payload.contentHtml) }} /><button type="button" disabled={!bootstrap.canWrite || busy} onClick={() => { if (validDraft(v.payload) && confirm("استعادة محتوى هذه المراجعة كحفظ جديد مع الاحتفاظ بالتاريخ؟")) { update({ ...v.payload, id: entry.draft.id, createdAt: entry.draft.createdAt }); setEditorEpoch(n => n + 1); } }} className="rounded-lg border border-[var(--border)] px-3 py-2 disabled:opacity-50">استعادة المحتوى كمراجعة جديدة</button></details>)}{history.nextBefore ? <button type="button" onClick={() => void loadHistory(history.nextBefore!)} className="rounded-lg border border-[var(--border)] px-3 py-2">مراجعات أقدم</button> : null}</section> : null}
      {bootstrap.canWrite ? renderEditor({ editorEpoch, draft: entry.draft, onUpdateDraft: update, onAddVersion: v => update({ versions: [v, ...entry.draft.versions], currentVersionNumber: v.versionNumber }), onRestoreVersion: (v, html, words, chars) => update({ contentHtml: v.contentHtml, versions: [{ id: crypto.randomUUID(), versionNumber: "قبل الاستعادة", timestamp: new Date().toISOString(), authorName: bootstrap.userLabel, note: "نسخة قبل استعادة مراجعة", contentHtml: html, wordCount: words, characterCount: chars }, ...entry.draft.versions] }), onCommitToArchive: () => setMessage("لحفظ مستند رسمي في الأرشيف، صدّر الملف ثم ارفعه من قسم المستندات؛ المسودة محفوظة مستقلة."), showToast: setMessage, persistenceState: entry.dirty ? "لم يؤكّد حفظ تعديلاتك في المكتب بعد" : `محفوظ في المكتب — مراجعة ${entry.revision}`, authorLabel: bootstrap.userLabel }) : <div className="rounded-xl border border-[var(--border)] p-5" dangerouslySetInnerHTML={{ __html: safeLegalHtml(entry.draft.contentHtml) }} />}
    </> : <p className="p-5 text-[var(--text-muted)]">لا توجد مسودات محفوظة. ابدأ مسودة جديدة أو راجع المسودات المحلية القديمة لاستيراد ما يخص المكتب الحالي.</p>}
  </div>;
}
