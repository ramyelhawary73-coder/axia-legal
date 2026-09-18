"use client";

import { useState, useEffect, useRef } from "react";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Plus, 
  X,
  Radio,
  Send,
  BellRing,
  Download,
  Mic
} from "lucide-react";
import { mockMatters, mockTasks } from "@/lib/mock-legal-data";
import { NavigationTab, LegalTask } from "@/types/legal";
import { analyzeTaskDeadline } from "@/lib/task-utils";
import { 
  getNotificationPermissionStatus, 
  requestBrowserNotificationPermission, 
  sendTestBrowserNotification, 
  sendTaskDeadlineBrowserNotification, 
  NotificationPermissionStatus 
} from "@/lib/browser-notifications";
import { LegalPdfReportModal } from "@/components/legal-pdf-report-modal";
import { VoiceCommandModal } from "@/components/voice-command-modal";
import { 
  getSpeechRecognitionConstructor, 
  IWindowSpeechRecognition, 
  SpeechRecognitionEvent 
} from "@/lib/web-speech-service";

interface TasksViewProps {
  tasks?: LegalTask[];
  onToggleTaskStatus?: (id: string) => void;
  onCreateTask?: (task: LegalTask) => void;
  onNavigate?: (tab: NavigationTab) => void;
}

export function TasksView({
  tasks: propTasks,
  onToggleTaskStatus: propToggleStatus,
  onCreateTask: propCreateTask,
  onNavigate,
}: TasksViewProps = {}) {
  const [internalTasks, setInternalTasks] = useState<LegalTask[]>(mockTasks);
  const tasks = propTasks || internalTasks;

  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>(() => {
    return typeof window !== "undefined" ? getNotificationPermissionStatus() : "default";
  });
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);

  const handleRequestPermission = async () => {
    const res = await requestBrowserNotificationPermission();
    setPermissionStatus(res);
  };

  const handleSendTest = () => {
    const ok = sendTestBrowserNotification();
    if (ok) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 3000);
    }
  };

  // New task form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<LegalTask["category"]>("قلم المحضرين");
  const [matterCaseNumber, setMatterCaseNumber] = useState("");
  const [courtOrBailiffOffice, setCourtOrBailiffOffice] = useState("");
  const [assignedTo, setAssignedTo] = useState("أ. مروان هاني (محام متدرب)");
  const [deadline, setDeadline] = useState(() => new Date().toISOString().slice(0, 10));
  const [priority, setPriority] = useState<LegalTask["priority"]>("عاجلة");
  
  // Voice Command & Dictation State
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isDictatingTitle, setIsDictatingTitle] = useState(false);
  const [voiceToastMessage, setVoiceToastMessage] = useState<string | null>(null);
  const titleRecognitionRef = useRef<IWindowSpeechRecognition | null>(null);

  const handleToggleTitleDictation = () => {
    if (isDictatingTitle) {
      if (titleRecognitionRef.current) {
        try {
          titleRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
      setIsDictatingTitle(false);
      return;
    }

    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) {
      alert("المتصفح لا يدعم التعرف الصوتي المباشر عبر Web Speech API.");
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.lang = "ar-EG";
      rec.continuous = false;
      rec.interimResults = true;

      rec.onstart = () => {
        setIsDictatingTitle(true);
      };

      rec.onresult = (ev: SpeechRecognitionEvent) => {
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const res = ev.results[i];
          const text = res[0].transcript;
          if (res.isFinal) {
            setTitle((prev) => (prev ? `${prev} ${text}` : text));
            setIsDictatingTitle(false);

            // Auto-detect category from spoken text
            const lower = text.toLowerCase();
            if (lower.includes("رسم") || lower.includes("رسوم") || lower.includes("سداد") || lower.includes("امانة")) {
              setCategory("سداد رسوم");
            } else if (lower.includes("مذكرة") || lower.includes("دفاع") || lower.includes("ايداع")) {
              setCategory("إيداع مذكرات");
            } else if (lower.includes("شهادة") || lower.includes("صورة رسمية")) {
              setCategory("استخراج شهادة");
            } else if (lower.includes("تنفيذ") || lower.includes("حجز")) {
              setCategory("تنفيذ حكم");
            } else if (lower.includes("طعن") || lower.includes("سقوط") || lower.includes("استئناف")) {
              setCategory("ميعاد طعن قانوني");
            } else if (lower.includes("محضر") || lower.includes("اعلان") || lower.includes("صحيفة")) {
              setCategory("قلم المحضرين");
            }
          }
        }
      };

      rec.onerror = () => {
        setIsDictatingTitle(false);
      };

      rec.onend = () => {
        setIsDictatingTitle(false);
      };

      titleRecognitionRef.current = rec;
      rec.start();
    } catch {
      setIsDictatingTitle(false);
    }
  };

  const handleVoiceTaskCreated = (newTask: LegalTask) => {
    if (propCreateTask) {
      propCreateTask(newTask);
    } else {
      setInternalTasks((prev) => [newTask, ...prev]);
    }
    setVoiceToastMessage(`تمت إضافة المهمة الصوتية بنجاح: "${newTask.title}"`);
    setTimeout(() => setVoiceToastMessage(null), 4500);
  };

  const handleToggleTaskStatus = (id: string) => {
    if (propToggleStatus) {
      propToggleStatus(id);
    } else {
      setInternalTasks((prev) =>
        prev.map((t) => {
          if (t.id === id) {
            return {
              ...t,
              status: t.status === "مكتملة" ? "قيد التنفيذ" : "مكتملة",
            };
          }
          return t;
        })
      );
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !courtOrBailiffOffice) return;

    const newTask: LegalTask = {
      id: `TSK-${Date.now()}`,
      title,
      category,
      matterCaseNumber: matterCaseNumber || "عام بالمكتب",
      courtOrBailiffOffice,
      assignedTo,
      deadline,
      priority,
      status: "قيد التنفيذ",
    };

    if (propCreateTask) {
      propCreateTask(newTask);
    } else {
      setInternalTasks((prev) => [newTask, ...prev]);
    }
    setIsNewTaskOpen(false);
    setTitle("");
    setCourtOrBailiffOffice("");
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterCategory === "all") return true;
    return t.category === filterCategory;
  });

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[var(--border)] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
            <AlertTriangle className="size-4" />
            <span>قلم المحضرين والمواعيد الإجرائية</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-[var(--text)] sm:text-3xl">
            مواعيد السقوط والمهام القضائية
          </h1>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            تتبع تسليم إعلانات المحضرين، مواعيد الطعن القانونية الصارمة، وسداد رسوم الخبراء
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3.5 py-2.5 text-xs font-bold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] shadow-sm transition"
            title="تصدير جدول المهام وإعلانات المحضرين ومواعيد السقوط إلى PDF"
          >
            <Download className="size-4" />
            <span>تصدير جدول المهام (PDF)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsVoiceModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--axia-gold)]/50 bg-[var(--panel)] px-3.5 py-2.5 text-xs font-bold text-[var(--axia-gold)] hover:bg-[var(--accent)] hover:border-[var(--axia-gold)] shadow-sm transition"
            title="إملاء المهام والملاحظات عبر الصوت (Web Speech API)"
          >
            <Mic className="size-4" />
            <span>إملاء مهمة صوتية (Web Speech)</span>
          </button>

          <button
            onClick={() => setIsNewTaskOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-4 py-2.5 text-xs font-bold text-[var(--text)] shadow-md transition hover:brightness-110"
          >
            <Plus className="size-4" />
            <span>تكليف بمهمة إجرائية جديدة</span>
          </button>
        </div>
      </div>

      {/* Voice Action Toast / Notice */}
      {voiceToastMessage && (
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-300 flex items-center justify-between animate-in fade-in slide-in-from-top duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
            <span className="font-bold">{voiceToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setVoiceToastMessage(null)}
            className="text-emerald-400 hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Browser Notification API Status Banner */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--panel-glass)] p-4 backdrop-blur-xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`grid size-9 place-items-center rounded-xl border ${
              permissionStatus === "granted"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : permissionStatus === "denied"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-[var(--axia-gold-dim)] bg-[var(--axia-gold)]/10 text-[var(--axia-gold)]"
            }`}>
              <Radio className="size-4.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-[var(--text)]">
                  نظام التنبيهات المكتبية الفورية (Browser Notification API)
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  permissionStatus === "granted"
                    ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
                    : permissionStatus === "denied"
                    ? "bg-red-500/15 border border-red-500/30 text-red-400"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                }`}>
                  {permissionStatus === "granted" ? "متصل ونشط" : permissionStatus === "denied" ? "محظور بالمتصفح" : "بانتظار الإذن"}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                تنبيه صوتي ومرئي منبثق من المتصفح عند بقاء أقل من ساعة على المهام القضائية العاجلة ومواعيد الطعن.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {permissionStatus === "granted" ? (
              <button
                type="button"
                onClick={handleSendTest}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--text)] hover:border-[var(--axia-gold)] hover:text-[var(--axia-gold)] transition shadow-sm"
              >
                <Send className="size-3" />
                <span>{testSent ? "تم إرسال الإشعار بنجاح ✓" : "اختبار إشعار المتصفح"}</span>
              </button>
            ) : permissionStatus === "denied" ? (
              <span className="text-xs text-red-400 font-medium">
                يرجى السماح بالإشعارات من إعدادات المتصفح
              </span>
            ) : (
              <button
                type="button"
                onClick={handleRequestPermission}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3.5 py-1.5 text-xs font-bold text-black shadow hover:brightness-110 transition"
              >
                <BellRing className="size-3.5" />
                <span>تفعيل التنبيهات المكتبية</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
        {[
          { id: "all", label: `كافة المهام (${tasks.length})` },
          { id: "قلم المحضرين", label: "أعمال قلم المحضرين" },
          { id: "ميعاد طعن قانوني", label: "مواعيد سقوط الطعون" },
          { id: "سداد رسوم", label: "الخزينة ورسوم الخبراء" },
          { id: "إيداع مذكرات", label: "إيداع المذكرات القضائية" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterCategory(tab.id)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
              filterCategory === tab.id
                ? "bg-red-500/20 text-red-300 border border-red-500/30"
                : "text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-[var(--text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-3.5">
        {filteredTasks.map((task) => {
          const isCritical = task.priority.includes("حرجة");
          const isCompleted = task.status === "مكتملة";
          const deadlineInfo = analyzeTaskDeadline(task);
          const isDueWithinOneHour = 
            deadlineInfo.diffHours > -0.08 && 
            deadlineInfo.diffHours <= 1.0 && 
            (isCritical || task.priority === "عاجلة") && 
            !isCompleted;

          return (
            <div
              key={task.id}
              className={`rounded-2xl border p-4.5 transition ${
                isCompleted
                  ? "border-emerald-500/20 bg-emerald-950/10 opacity-75"
                  : isDueWithinOneHour
                  ? "border-red-500/60 bg-gradient-to-r from-red-950/30 to-[var(--panel)] shadow-lg ring-1 ring-red-500/30"
                  : isCritical
                  ? "border-red-500/30 bg-[var(--accent-hover)] shadow-md"
                  : deadlineInfo.isWithin24Hours
                  ? "border-amber-500/30 bg-amber-950/10 hover:border-amber-500/50"
                  : "border-[var(--border)] bg-[var(--panel)] hover:border-[var(--border-strong)]"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3.5">
                  <button
                    onClick={() => handleToggleTaskStatus(task.id)}
                    className={`mt-1 grid size-5 shrink-0 place-items-center rounded border transition ${
                      isCompleted
                        ? "border-emerald-400 bg-emerald-400 text-white"
                        : "border-white/30 hover:border-white"
                    }`}
                  >
                    {isCompleted && <CheckCircle2 className="size-4" />}
                  </button>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isDueWithinOneHour && (
                        <span className="inline-flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                          <AlertTriangle className="size-3" />
                          <span>ينقضي خلال أقل من ساعة!</span>
                        </span>
                      )}
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        isCritical ? "bg-red-500/20 text-red-300" : "bg-slate-800 text-[var(--text-muted)]"
                      }`}>
                        {task.priority}
                      </span>
                      <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--text-muted)]">
                        {task.category}
                      </span>
                      {task.matterCaseNumber && (
                        <span className="text-xs font-semibold text-[var(--axia-gold-light)]">
                          {task.matterCaseNumber}
                        </span>
                      )}
                    </div>

                    <h3 className={`mt-2 text-sm font-semibold ${
                      isCompleted ? "line-through text-[var(--text-muted)]" : "text-[var(--text)]"
                    }`}>
                      {task.title}
                    </h3>

                    <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>الجهة: <strong className="text-[var(--text)]">{task.courtOrBailiffOffice}</strong></span>
                      <span>المسؤول: <strong className="text-[var(--text)]">{task.assignedTo}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <div className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold ${
                    isDueWithinOneHour
                      ? "bg-red-600 text-white shadow-sm"
                      : isCritical 
                      ? "bg-red-500/20 text-red-300 border border-red-500/30" 
                      : deadlineInfo.isWithin24Hours && !isCompleted
                      ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      : "bg-[var(--accent-hover)] text-[var(--text-muted)]"
                  }`}>
                    <Clock className="size-3.5" />
                    <span>{deadlineInfo.remainingText}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isDueWithinOneHour && (
                      <button
                        type="button"
                        onClick={() => {
                          sendTaskDeadlineBrowserNotification({
                            task,
                            diffHours: deadlineInfo.diffHours,
                            force: true,
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-md border border-red-500/40 bg-red-600/10 px-2 py-0.5 text-[10px] font-bold text-red-400 hover:bg-red-600/20 transition"
                        title="إرسال تنبيه مكتبي فوري لهذه المهمة"
                      >
                        <BellRing className="size-3" />
                        <span>إشعار مكتبي</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleToggleTaskStatus(task.id)}
                      className="text-[11px] font-medium text-[var(--text-muted)] hover:text-[var(--text)]"
                    >
                      {isCompleted ? "إلغاء الإكمال" : "تحديد كمكتمل"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {isNewTaskOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[var(--axia-gold-dim)] bg-[var(--panel)] p-6 lg:p-8 shadow-2xl">
            <button
              onClick={() => setIsNewTaskOpen(false)}
              className="absolute left-6 top-6 grid size-8 place-items-center rounded-full bg-[var(--accent-hover)] text-[var(--text-muted)] hover:bg-[var(--accent-hover)] hover:text-[var(--text)]"
            >
              <X className="size-4" />
            </button>

            <div className="flex items-center gap-2 text-xs font-semibold text-red-300">
              <Plus className="size-4" />
              <span>إسناد مهمة إجرائية وميعاد قانوني</span>
            </div>
            
            <h2 className="mt-1 text-xl font-bold text-[var(--text)]">إضافة مهمة إجرائية</h2>
            
            <form onSubmit={handleCreateTask} className="mt-6 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[var(--text-muted)] font-semibold">بيان المهمة والإجراء المطلوب</label>
                  <button
                    type="button"
                    onClick={handleToggleTitleDictation}
                    className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-bold border transition ${
                      isDictatingTitle
                        ? "bg-red-500 text-white border-red-400 animate-pulse"
                        : "bg-[var(--panel)] text-[var(--axia-gold)] border-[var(--border)] hover:border-[var(--axia-gold)]"
                    }`}
                    title="إملاء تفاصيل المهمة صوتياً (Web Speech API)"
                  >
                    <Mic className="size-3" />
                    <span>{isDictatingTitle ? "جارٍ الإملاء... انقر للإنهاء" : "إملاء صوتي (Web Speech)"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="مثال: تسليم أصل صحيفة الاستئناف معلنة لقلم كتاب المحكمة"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-semibold">التصنيف الإجرائي</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as LegalTask["category"])}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                  >
                    <option value="قلم المحضرين">قلم المحضرين</option>
                    <option value="ميعاد طعن قانوني">ميعاد طعن قانوني (سقوط)</option>
                    <option value="سداد رسوم">سداد رسوم / أمانة خبير</option>
                    <option value="إيداع مذكرات">إيداع مذكرات</option>
                    <option value="استخراج شهادة">استخراج شهادة / صورة رسمية</option>
                    <option value="تنفيذ حكم">تنفيذ حكم</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-semibold">درجة الأهمية والميعاد</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as LegalTask["priority"])}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                  >
                    <option value="حرجة للغاية (ميعاد سقوط)">حرجة للغاية (ميعاد سقوط)</option>
                    <option value="عاجلة">عاجلة</option>
                    <option value="عادية">عادية</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-semibold">المقر أو المحكمة المعنية</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: قلم محضرين العجوزة"
                    value={courtOrBailiffOffice}
                    onChange={(e) => setCourtOrBailiffOffice(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-semibold">رقم القضية المرتبطة</label>
                  <input
                    type="text"
                    placeholder="مثال: ٣٨٢ لسنة ٢٠٢٥ تجاري"
                    value={matterCaseNumber}
                    onChange={(e) => setMatterCaseNumber(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-semibold">تاريخ الميعاد الأقصى</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[var(--text-muted)] mb-1 font-semibold">المحامي / الموظف المكلف</label>
                  <input
                    type="text"
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--accent)] p-2.5 text-[var(--text)] focus:border-red-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsNewTaskOpen(false)}
                  className="rounded-xl bg-[var(--accent-hover)] px-4 py-2 font-medium text-[var(--text)] hover:bg-white/15"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-red-500 to-rose-700 px-5 py-2 font-bold text-[var(--text)] hover:brightness-110"
                >
                  حفظ وتكليف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Legal PDF Report Modal */}
      <LegalPdfReportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        defaultReportType="tasks"
        matters={mockMatters}
        tasks={tasks}
      />

      {/* Voice Command & Dictation Assistant Modal */}
      <VoiceCommandModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onNavigate={(tab) => {
          if (onNavigate) {
            onNavigate(tab);
          }
        }}
        onCreateTask={handleVoiceTaskCreated}
      />
    </div>
  );
}
