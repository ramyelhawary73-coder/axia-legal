"use client";

import { useState, useMemo } from "react";
import { 
  FileText, 
  X, 
  Check, 
  Copy, 
  Printer, 
  UserCheck, 
  Building2, 
  User, 
  Scale, 
  Sparkles, 
  FolderPlus,
  RefreshCw,
  Eye,
  Edit3
} from "lucide-react";
import { LegalTemplate } from "@/types/legal-template";
import { Client, Matter, LegalDocument } from "@/types/legal";
import { extractClientTemplateVariables, renderLegalTemplate, legalTemplatesCollection } from "@/lib/legal-templates-data";

interface LegalTemplateGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: LegalTemplate | null;
  clients: Client[];
  matters: Matter[];
  preSelectedClientId?: string;
  onSaveDocument?: (doc: LegalDocument) => void;
}

export function LegalTemplateGeneratorModal({
  isOpen,
  onClose,
  template,
  clients,
  matters,
  preSelectedClientId,
  onSaveDocument,
}: LegalTemplateGeneratorModalProps) {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(template?.id || legalTemplatesCollection[0].id);
  const [selectedClientId, setSelectedClientId] = useState<string>(preSelectedClientId || clients[0]?.id || "");
  const [selectedMatterId, setSelectedMatterId] = useState<string>("");
  const [variableOverrides, setVariableOverrides] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"preview" | "fields">("preview");
  const [isManualEditing, setIsManualEditing] = useState(false);
  const [editedBody, setEditedBody] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const currentTemplate = useMemo(() => {
    return legalTemplatesCollection.find((t) => t.id === selectedTemplateId) || template || legalTemplatesCollection[0];
  }, [selectedTemplateId, template]);

  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  const clientMatters = useMemo(() => {
    if (!selectedClient) return [];
    return matters.filter(
      (m) => m.clientId === selectedClient.id || m.clientName === selectedClient.name
    );
  }, [matters, selectedClient]);

  const selectedMatter = useMemo(() => {
    return clientMatters.find((m) => m.id === selectedMatterId) || undefined;
  }, [clientMatters, selectedMatterId]);

  // Declarative computation of variables: combines client/matter auto-fill with defaults and user overrides
  const variables = useMemo(() => {
    if (!currentTemplate || !selectedClient) return {};

    const base = extractClientTemplateVariables(selectedClient, selectedMatter);

    currentTemplate.variables.forEach((v) => {
      if ((base[v.key] === undefined || base[v.key] === "") && v.defaultValue) {
        base[v.key] = v.defaultValue;
      }
    });

    return { ...base, ...variableOverrides };
  }, [currentTemplate, selectedClient, selectedMatter, variableOverrides]);

  // Render template body
  const renderedContent = useMemo(() => {
    if (!currentTemplate) return "";
    if (isManualEditing && editedBody) return editedBody;
    return renderLegalTemplate(currentTemplate.templateBody, variables);
  }, [currentTemplate, variables, isManualEditing, editedBody]);

  const handleVariableChange = (key: string, value: string) => {
    setVariableOverrides((prev) => ({ ...prev, [key]: value }));
    if (isManualEditing) {
      setIsManualEditing(false);
    }
  };

  const handleResetToAutoFill = () => {
    setVariableOverrides({});
    setIsManualEditing(false);
    setEditedBody("");
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(renderedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const handleSaveToArchive = () => {
    if (!currentTemplate || !selectedClient) return;
    const newDoc: LegalDocument = {
      id: `DOC-TPL-${Date.now()}`,
      title: `${currentTemplate.title} — ${selectedClient.name}`,
      type: currentTemplate.category === "إنذارات ومحاضر" ? "إنذار رسمي" :
            currentTemplate.category === "عقود واتفاقيات" ? "عقد واتفاقية" :
            currentTemplate.category === "لوائح وصحف دعاوى" ? "صحيفة دعوى" : "مذكرة دفاع",
      caseNumber: selectedMatter?.caseNumber || "توثيق رسمي",
      clientName: selectedClient.name,
      date: new Date().toISOString().split("T")[0],
      fileSize: "1.8 MB (محرر رقمياً)",
      status: "نهائي معتمد",
    };

    if (onSaveDocument) {
      onSaveDocument(newDoc);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  if (!isOpen || !currentTemplate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-[94vh] sm:h-auto sm:max-h-[90vh] w-full sm:max-w-5xl rounded-t-[28px] sm:rounded-3xl border-t sm:border border-[var(--border)] bg-[var(--panel)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/90 px-6 py-3.5 gap-3">
          <div className="flex items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--axia-gold)]/15 border border-[var(--axia-gold)]/30 text-[var(--axia-gold)]">
              <FileText className="size-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] font-bold text-[var(--axia-gold-light)]">
                  {currentTemplate.category}
                </span>
                {currentTemplate.badge && (
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                    {currentTemplate.badge}
                  </span>
                )}
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {currentTemplate.governingLaw}
                </span>
              </div>
              <h2 className="text-base font-bold text-[var(--text)] mt-0.5">
                {currentTemplate.title}
              </h2>
            </div>
          </div>

          {/* Template Switcher Dropdown & Close */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
              <span>تبديل القالب:</span>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none max-w-[220px] truncate"
              >
                {legalTemplatesCollection.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="grid size-9 place-items-center rounded-xl text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)] transition"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Client Auto-Fill Bar */}
        <div className="border-b border-[var(--border)] bg-gradient-to-r from-[var(--panel)] via-[var(--accent)]/60 to-[var(--panel)] px-6 py-3.5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            
            {/* Client Picker */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--axia-gold-light)]">
                <UserCheck className="size-4 text-[var(--axia-gold)]" />
                <span>الموكل المعتمد للتعبئة التلقائية:</span>
              </div>

              <div className="relative min-w-[240px]">
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    setSelectedMatterId("");
                  }}
                  className="w-full rounded-xl border border-[var(--axia-gold)]/40 bg-[var(--bg)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Optional Case/Matter selector */}
              {clientMatters.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[var(--text-muted)]">القضية (اختياري):</span>
                  <select
                    value={selectedMatterId}
                    onChange={(e) => setSelectedMatterId(e.target.value)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none"
                  >
                    <option value="">بدون ربط قضية (بيانات عامة)</option>
                    {clientMatters.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.caseNumber} - {m.court}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Client Credentials Quick Pills */}
            {selectedClient && (
              <div className="flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 text-[var(--text-muted)]">
                  {selectedClient.type === "شركة / مؤسسة" ? <Building2 className="size-3 text-sky-400" /> : <User className="size-3 text-emerald-400" />}
                  <span className="font-medium text-[var(--text)]">{selectedClient.nationalIdOrCr}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 text-[var(--text-muted)]">
                  <Scale className="size-3 text-[var(--axia-gold)]" />
                  <span>توكيل: </span>
                  <span className="font-semibold text-[var(--axia-gold-light)]">{selectedClient.poaNumber}</span>
                </span>
                <button
                  type="button"
                  onClick={handleResetToAutoFill}
                  className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-semibold text-[var(--text)] transition"
                  title="إعادة التعبئة بالبيانات الأصلية للموكل"
                >
                  <RefreshCw className="size-3 text-[var(--axia-gold)]" />
                  <span>تحديث الحقول</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* View Tabs & Action Bar */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)] px-6 py-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "preview"
                  ? "bg-[var(--axia-gold)] text-black shadow-sm"
                  : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Eye className="size-3.5" />
              <span>معاينة الوثيقة المكتملة</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("fields")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                activeTab === "fields"
                  ? "bg-[var(--axia-gold)] text-black shadow-sm"
                  : "bg-[var(--accent)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <Edit3 className="size-3.5" />
              <span>تعديل الحقول والمتغيرات ({currentTemplate.variables.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent-hover)] transition shadow-sm"
              title="نسخ النص القانوني للصق في Word"
            >
              {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5 text-[var(--axia-gold)]" />}
              <span>{copied ? "تم النسخ بنجاح" : "نسخ النص"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrintDocument}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-[var(--text)] hover:bg-[var(--accent-hover)] transition shadow-sm"
              title="طباعة الوثيقة على ورق رسمي"
            >
              <Printer className="size-3.5 text-[var(--text-muted)]" />
              <span>طباعة رسمية</span>
            </button>

            <button
              type="button"
              onClick={handleSaveToArchive}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-amber-500 px-4 py-1.5 text-xs font-extrabold text-black hover:brightness-110 transition shadow-md"
            >
              {savedSuccess ? <Check className="size-3.5" /> : <FolderPlus className="size-3.5" />}
              <span>{savedSuccess ? "تم الحفظ بالأرشيف!" : "حفظ في الأرشيف ومستندات الموكل"}</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[var(--bg)]/40">
          {activeTab === "preview" ? (
            /* Document Preview Paper View */
            <div className="max-w-3xl mx-auto rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-8 sm:p-10 shadow-xl text-[var(--text)] relative font-sans leading-relaxed">
              {/* Header Letterhead */}
              <div className="border-b-2 border-[var(--axia-gold)]/50 pb-5 mb-6 text-center">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] pb-2">
                  <div className="text-right">
                    <p className="font-bold text-[var(--text)]">مكتب د. رامي الهواري للمحاماة</p>
                    <p>بالنقض والدستورية العليا والإدارية</p>
                  </div>
                  <div className="size-12 grid place-items-center rounded-2xl bg-[var(--axia-gold)]/10 border border-[var(--axia-gold)]/30 text-[var(--axia-gold)]">
                    <Scale className="size-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[var(--text)]">جمهورية مصر العربية</p>
                    <p>نقابة المحامين العامة — استئناف القاهرة</p>
                  </div>
                </div>
                <div className="h-0.5 bg-gradient-to-r from-transparent via-[var(--axia-gold)] to-transparent opacity-60" />
              </div>

              {/* Editable or Static View */}
              {isManualEditing ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-[var(--axia-gold-light)] mb-1">
                    <span>وضع التحرير المباشر للصيغة القانونية:</span>
                    <button
                      type="button"
                      onClick={() => setIsManualEditing(false)}
                      className="text-[11px] underline text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      إنهاء التحرير المباشر
                    </button>
                  </div>
                  <textarea
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={22}
                    className="w-full rounded-xl border border-[var(--axia-gold)]/50 bg-[var(--bg)] p-4 font-mono text-xs text-[var(--text)] leading-loose focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)] custom-scrollbar"
                  />
                </div>
              ) : (
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setEditedBody(renderedContent);
                      setIsManualEditing(true);
                    }}
                    className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--accent)] px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--axia-gold)] transition opacity-0 group-hover:opacity-100 shadow-sm"
                  >
                    <Edit3 className="size-3 text-[var(--axia-gold)]" />
                    <span>تعديل مباشر على هذا النص</span>
                  </button>
                  <pre className="whitespace-pre-wrap font-sans text-xs text-[var(--text)] leading-loose text-justify select-text">
                    {renderedContent}
                  </pre>
                </div>
              )}

              {/* Official Stamp & Signatures Box */}
              <div className="mt-10 pt-6 border-t border-dashed border-[var(--border)] grid grid-cols-2 gap-6 text-xs text-[var(--text-muted)]">
                <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg)]/50 text-center space-y-3">
                  <p className="font-bold text-[var(--text)]">خاتم المحامي وتصديق النقابة</p>
                  <div className="size-16 mx-auto rounded-full border-2 border-dashed border-[var(--axia-gold)]/40 grid place-items-center text-[10px] text-[var(--axia-gold)] font-mono">
                    خاتم المكتب
                  </div>
                  <p className="text-[10px]">المقيد بالنقض: 41290</p>
                </div>

                <div className="border border-[var(--border)] rounded-xl p-4 bg-[var(--bg)]/50 text-center space-y-3">
                  <p className="font-bold text-[var(--text)]">اعتماد الموكل / الطالب</p>
                  <div className="h-16 flex items-end justify-center pb-1 text-[11px] font-semibold text-[var(--text)]">
                    {selectedClient?.name}
                  </div>
                  <p className="text-[10px]">بموجب التوكيل: {selectedClient?.poaNumber}</p>
                </div>
              </div>

              {/* Document Footer */}
              <div className="mt-6 pt-3 text-center text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] flex justify-between">
                <span>وثيقة نموذجية صادرة عبر منصة AXIA Legal للأنظمة القانونية</span>
                <span>تاريخ الصياغة: {new Date().toLocaleDateString("ar-EG")}</span>
              </div>
            </div>
          ) : (
            /* Variable Fields Fine-Tuning View */
            <div className="max-w-3xl mx-auto space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[var(--axia-gold-light)]">
                  <Sparkles className="size-4 text-[var(--axia-gold)]" />
                  <span>تخصيص بنود ومتغيرات الوثيقة:</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  الحقول المميزة باللون الذهبي تم ملؤها تلقائياً من الملف الرسمي للموكل. يمكنك تعديل أي حقل وتخصيص المبالغ أو التواريخ أو بيانات الخصم بحسب ملابسات الواقعة.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {currentTemplate.variables.map((variable) => {
                  const isClientField = variable.source === "client";
                  const isSystemField = variable.source === "system";
                  const value = variables[variable.key] || "";

                  return (
                    <div
                      key={variable.key}
                      className={`rounded-2xl border p-4 transition ${
                        isClientField
                          ? "border-[var(--axia-gold)]/30 bg-[var(--accent)]/50"
                          : "border-[var(--border)] bg-[var(--panel)]"
                      } ${variable.type === "textarea" ? "sm:col-span-2" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-[var(--text)]">
                          {variable.label}
                        </label>
                        {isClientField && (
                          <span className="inline-flex items-center gap-1 rounded bg-[var(--axia-gold)]/15 px-1.5 py-0.5 text-[9px] font-bold text-[var(--axia-gold)]">
                            <UserCheck className="size-2.5" />
                            <span>تلقائي من الموكل</span>
                          </span>
                        )}
                        {isSystemField && (
                          <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
                            نظام المكتب
                          </span>
                        )}
                      </div>

                      {variable.type === "textarea" ? (
                        <textarea
                          rows={3}
                          value={value}
                          onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                          placeholder={variable.placeholder}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)] custom-scrollbar"
                        />
                      ) : (
                        <input
                          type={variable.type || "text"}
                          value={value}
                          onChange={(e) => handleVariableChange(variable.key, e.target.value)}
                          placeholder={variable.placeholder}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text)] focus:border-[var(--axia-gold)] focus:outline-none focus:ring-1 focus:ring-[var(--axia-gold)]"
                        />
                      )}

                      {variable.description && (
                        <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                          {variable.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--axia-gold)] px-5 py-2 text-xs font-bold text-black hover:brightness-110 transition shadow-sm"
                >
                  <Eye className="size-4" />
                  <span>معاينة النتيجة النهائية المكتملة</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--panel)] px-6 py-3 text-xs text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <span>الصيغة: <strong className="text-[var(--text)]">{currentTemplate.clausesCount} بنود نظامية</strong></span>
            <span>•</span>
            <span>المرجع: <strong className="text-[var(--text)]">{currentTemplate.governingLaw}</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--border)] bg-[var(--accent)] px-4 py-1.5 font-semibold text-[var(--text)] hover:bg-[var(--accent-hover)] transition"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={handleSaveToArchive}
              className="rounded-xl bg-[var(--axia-gold)] px-4 py-1.5 font-bold text-black hover:brightness-110 transition"
            >
              حفظ المستند
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
