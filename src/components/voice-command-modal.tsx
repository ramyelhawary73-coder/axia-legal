"use client";

import { useState } from "react";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Compass, 
  CheckSquare, 
  CornerDownLeft, 
  AlertCircle,
  Radio,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { NavigationTab, LegalTask } from "@/types/legal";
import { useVoiceCommand } from "@/hooks/use-voice-command";

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavigationTab) => void;
  onCreateTask: (task: LegalTask) => void;
}

export function VoiceCommandModal({
  isOpen,
  onClose,
  onNavigate,
  onCreateTask,
}: VoiceCommandModalProps) {
  const [manualInput, setManualInput] = useState("");
  const [showCheatsheet, setShowCheatsheet] = useState(false);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    lastResult,
    errorMessage,
    lang,
    voiceFeedbackEnabled,
    setLang,
    setVoiceFeedbackEnabled,
    startListening,
    stopListening,
    executeManualCommand,
    clearLastResult,
  } = useVoiceCommand({
    onNavigate: (tab) => {
      onNavigate(tab);
    },
    onCreateTask: (task) => {
      onCreateTask(task);
    },
    defaultLang: "ar-EG",
    enableAudioFeedback: true,
  });

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    executeManualCommand(manualInput);
    setManualInput("");
  };

  const sampleCommands = [
    { label: "افتح القضايا", desc: "تنقل فوري لقسم القضايا والملفات" },
    { label: "انتقل إلى الجلسات والتقويم", desc: "عرض جدول جلسات المحاكم" },
    { label: "مهمة جديدة: إعلان صحيفة الدعوى بقلم محضرين الدقي", desc: "تسجيل مهمة تلقائية بقلم المحضرين" },
    { label: "سجل مهمة: سداد رسوم الاستئناف بخزينة شمال القاهرة عاجل", desc: "تسجيل مهمة سداد رسوم ذات أولوية" },
    { label: "افتح راجح الذكاء الاصطناعي", desc: "تشغيل مستشار راجح القانوني" },
    { label: "شاشة التقارير والإحصائيات", desc: "عرض مؤشرات الأداء والأرشفة" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--axia-gold)]/40 bg-[var(--panel)] shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4 bg-gradient-to-r from-[var(--panel)] via-[var(--panel)] to-[var(--axia-gold-dim)]/15">
          <div className="flex items-center gap-3">
            <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${
              isListening 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse" 
                : "bg-[var(--axia-gold)] text-black shadow-md shadow-[var(--axia-gold)]/20"
            }`}>
              <Mic className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[var(--text)]">
                  التحكم الصوتي والأوامر الذكية
                </h3>
                <span className="rounded-full bg-[var(--axia-gold)]/15 text-[var(--axia-gold)] px-2 py-0.5 text-[10px] font-bold border border-[var(--axia-gold)]/30 font-mono">
                  Web Speech API
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                تنقل بين أقسام المنظومة أو سجّل مهامك وملاحظاتك بصوتك فورياً
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVoiceFeedbackEnabled(!voiceFeedbackEnabled)}
              title={voiceFeedbackEnabled ? "الرد الصوتي مفعّل (انقر للتعطيل)" : "الرد الصوتي معطل (انقر للتشغيل)"}
              className={`p-2 rounded-xl border transition ${
                voiceFeedbackEnabled 
                  ? "border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 text-[var(--axia-gold)]" 
                  : "border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)]"
              }`}
            >
              {voiceFeedbackEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            </button>

            <button
              type="button"
              onClick={() => setShowCheatsheet(!showCheatsheet)}
              title="دليل الأوامر الصوتية"
              className={`p-2 rounded-xl border transition ${
                showCheatsheet 
                  ? "border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 text-[var(--axia-gold)]" 
                  : "border-[var(--border)] bg-[var(--panel)] text-[var(--text-muted)] hover:text-[var(--text)]"
              }`}
            >
              <HelpCircle className="size-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)] transition"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Browser Support Notice if needed */}
          {!isSupported && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300 flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 text-amber-400 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold">تنبيه دعم المتصفح (Browser Compatibility):</div>
                <div>
                  المتصفح الحالي لا يدعم ميزة التعرف الصوتي المباشر عبر Web Speech API بشكل كامل، يُنصح باستخدام متصفح <strong>Google Chrome</strong> أو <strong>Microsoft Edge</strong> أو <strong>Safari</strong>. يمكنك تجربة الأوامر كتابياً عبر الحقل أدناه.
                </div>
              </div>
            </div>
          )}

          {/* Microphone Interactive Stage */}
          <div className="relative rounded-3xl border border-[var(--border)] bg-gradient-to-b from-[var(--bg)] to-[var(--panel)] p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-inner">
            {/* Pulsing visual rings */}
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <div className="absolute size-32 rounded-full bg-red-500/20 animate-ping" />
                  <div className="absolute size-28 rounded-full bg-amber-500/25 animate-pulse" />
                </>
              )}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={!isSupported}
                className={`relative z-10 size-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white shadow-red-500/50 scale-105 hover:bg-red-600"
                    : "bg-gradient-to-tr from-[var(--axia-gold-dim)] via-[var(--axia-gold)] to-[var(--axia-gold-light)] text-black shadow-[var(--axia-gold)]/30 hover:scale-105 active:scale-95"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? (
                  <MicOff className="size-8 animate-bounce" />
                ) : (
                  <Mic className="size-8" />
                )}
              </button>
            </div>

            {/* Status indicator */}
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className={`inline-block size-2 rounded-full ${
                  isListening ? "bg-red-500 animate-ping" : "bg-emerald-400"
                }`} />
                <span className="text-sm font-bold text-[var(--text)]">
                  {isListening ? "جارٍ الاستماع... تحدث الآن" : "انقر على الميكروفون لبدء الأمر الصوتي"}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                {isListening 
                  ? "يمكنك قول اسم القسم للتنقل، أو 'مهمة جديدة: إعلان صحيفة الدعوى...'"
                  : "تحدث باللغة العربية أو الإنجليزية لتوجيه المنظومة"}
              </p>
            </div>

            {/* Live Transcript Display */}
            <div className="w-full min-h-16 rounded-2xl border border-[var(--border)] bg-[var(--panel)]/80 p-4 text-center flex flex-col items-center justify-center">
              {interimTranscript ? (
                <div className="text-sm text-[var(--axia-gold-light)] font-medium italic animate-pulse">
                  &ldquo;{interimTranscript}&rdquo;
                </div>
              ) : transcript ? (
                <div className="text-sm font-bold text-[var(--text)]">
                  &ldquo;{transcript}&rdquo;
                </div>
              ) : (
                <div className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                  <Radio className="size-3.5 opacity-50" />
                  <span>في انتظار الأمر الصوتي...</span>
                </div>
              )}
            </div>

            {/* Language switch */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-[var(--text-muted)]">لغة التحدث:</span>
              <div className="inline-flex rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setLang("ar-EG")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    lang === "ar-EG" 
                      ? "bg-[var(--axia-gold)] text-black font-bold shadow-sm" 
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  العربية (مصر)
                </button>
                <button
                  type="button"
                  onClick={() => setLang("ar-SA")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    lang === "ar-SA" 
                      ? "bg-[var(--axia-gold)] text-black font-bold shadow-sm" 
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  العربية الفصحى
                </button>
                <button
                  type="button"
                  onClick={() => setLang("en-US")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    lang === "en-US" 
                      ? "bg-[var(--axia-gold)] text-black font-bold shadow-sm" 
                      : "text-[var(--text-muted)] hover:text-[var(--text)]"
                  }`}
                >
                  English
                </button>
              </div>
            </div>
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Last Recognized Result Feedback Card */}
          {lastResult && (
            <div className={`rounded-2xl border p-4 transition-all duration-300 ${
              lastResult.action === "navigation"
                ? "border-blue-500/40 bg-blue-500/10 text-blue-300"
                : lastResult.action === "create_task"
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/40 bg-amber-500/10 text-amber-300"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    {lastResult.action === "navigation" && (
                      <>
                        <Compass className="size-4 text-blue-400" />
                        <span>تنقل فوري: {lastResult.tabLabel}</span>
                      </>
                    )}
                    {lastResult.action === "create_task" && (
                      <>
                        <CheckSquare className="size-4 text-emerald-400" />
                        <span>تم إنشاء مهمة قضائية جديدة بنجاح</span>
                      </>
                    )}
                    {lastResult.action === "unknown" && (
                      <>
                        <AlertCircle className="size-4 text-amber-400" />
                        <span>لم يتم تحديد أمر محدد</span>
                      </>
                    )}
                  </div>

                  <p className="text-xs leading-relaxed text-[var(--text)]">
                    {lastResult.feedbackText}
                  </p>

                  {lastResult.createdTask && (
                    <div className="mt-2 rounded-xl bg-[var(--panel)]/80 p-3 border border-[var(--border)] text-xs text-[var(--text)] space-y-1.5">
                      <div className="font-bold flex items-center justify-between">
                        <span>{lastResult.createdTask.title}</span>
                        <span className="rounded bg-[var(--accent)] px-2 py-0.5 text-[10px] text-[var(--axia-gold-light)] border border-[var(--border)]">
                          {lastResult.createdTask.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] flex flex-wrap gap-3">
                        <span>الجهة: {lastResult.createdTask.courtOrBailiffOffice}</span>
                        <span>الأولوية: <strong className="text-amber-400">{lastResult.createdTask.priority}</strong></span>
                        <span>المكلف: {lastResult.createdTask.assignedTo}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 shrink-0">
                  {lastResult.action === "create_task" && (
                    <button
                      type="button"
                      onClick={() => {
                        onNavigate("tasks");
                        onClose();
                      }}
                      className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 text-black px-3 py-1.5 text-xs font-bold hover:bg-emerald-400 transition"
                    >
                      <ExternalLink className="size-3" />
                      <span>عرض في المهام</span>
                    </button>
                  )}
                  {lastResult.action === "navigation" && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-500 text-white px-3 py-1.5 text-xs font-bold hover:bg-blue-400 transition"
                    >
                      <span>الانتقال للشاشة</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={clearLastResult}
                    className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] text-center py-1"
                  >
                    مسح
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Quick Cheatsheet & Sample Commands */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-[var(--axia-gold)]" />
                <span>أوامر صوتية نموذجية (جرب الآن بنقرة واحدة أو انطقها):</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sampleCommands.map((cmd, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => executeManualCommand(cmd.label)}
                  className="text-right p-2.5 rounded-xl border border-[var(--border)] bg-[var(--panel)]/50 hover:bg-[var(--accent)] hover:border-[var(--axia-gold)]/40 transition group flex flex-col justify-between"
                >
                  <div className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--axia-gold-light)] flex items-center justify-between">
                    <span>{cmd.label}</span>
                    <CornerDownLeft className="size-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] mt-1">{cmd.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Input Fallback */}
          <form onSubmit={handleManualSubmit} className="pt-2">
            <div className="relative">
              <input
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="أو اكتب الأمر هنا للتجربة الفورية... (مثال: مهمة جديدة: سداد الرسوم)"
                className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 pl-20 text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none shadow-inner"
              />
              <button
                type="submit"
                disabled={!manualInput.trim()}
                className="absolute left-1.5 top-1.5 bottom-1.5 inline-flex items-center gap-1.5 rounded-xl bg-[var(--axia-gold)] px-3 text-xs font-bold text-black hover:bg-[var(--axia-gold-light)] transition disabled:opacity-40"
              >
                <span>تنفيذ</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-6 py-3 bg-[var(--panel)] flex items-center justify-between text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            <span>متوافق مع محرك الصوت الداخلي للمتصفح بالكامل (Web Speech API)</span>
          </div>
          <span>AXIA Legal Voice Control</span>
        </div>
      </div>
    </div>
  );
}
