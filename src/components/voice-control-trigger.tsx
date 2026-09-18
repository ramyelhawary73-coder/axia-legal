"use client";

import { useState } from "react";
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Compass, 
  CheckSquare, 
  Settings2,
  ExternalLink 
} from "lucide-react";
import { NavigationTab, LegalTask } from "@/types/legal";
import { useVoiceCommand } from "@/hooks/use-voice-command";
import { VoiceCommandModal } from "@/components/voice-command-modal";

interface VoiceControlTriggerProps {
  onNavigate: (tab: NavigationTab) => void;
  onCreateTask?: (task: LegalTask) => void;
}

export function VoiceControlTrigger({
  onNavigate,
  onCreateTask,
}: VoiceControlTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    lastResult,
    errorMessage,
    startListening,
    stopListening,
    clearLastResult,
  } = useVoiceCommand({
    onNavigate: (tab) => {
      onNavigate(tab);
      setBannerDismissed(false);
    },
    onCreateTask: (task) => {
      if (onCreateTask) {
        onCreateTask(task);
      }
      setBannerDismissed(false);
    },
    defaultLang: "ar-EG",
    enableAudioFeedback: true,
  });

  const handleMicClick = () => {
    if (!isSupported) {
      setIsModalOpen(true);
      return;
    }

    if (isListening) {
      stopListening();
    } else {
      setBannerDismissed(false);
      startListening();
    }
  };

  const showActiveBanner = (isListening || (lastResult && !bannerDismissed) || errorMessage) && !isModalOpen;

  return (
    <>
      <div className="relative flex items-center">
        {/* Main Header Mic Button */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleMicClick}
            title={
              !isSupported
                ? "الأوامر الصوتية (انقر للإرشادات)"
                : isListening
                ? "جارٍ الاستماع... انقر للإيقاف"
                : "تفعيل التحكم الصوتي الذكي (Web Speech API)"
            }
            className={`relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all duration-300 ${
              isListening
                ? "border-red-500/50 bg-red-500/15 text-red-400 shadow-md shadow-red-500/20"
                : "border-[var(--border)] bg-[var(--panel)]/60 text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--axia-gold)]/50 hover:bg-[var(--accent)]"
            }`}
          >
            {isListening ? (
              <>
                <span className="relative flex size-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full size-2 bg-red-500"></span>
                </span>
                <Mic className="size-3.5 text-red-400 animate-pulse" />
                <span className="hidden md:inline font-bold text-[11px] text-red-400">
                  جارٍ الاستماع...
                </span>
                {/* Visual Audio Waveform bars */}
                <div className="hidden sm:flex items-center gap-0.5 h-3">
                  <span className="w-0.5 h-full bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-0.5 h-2/3 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-0.5 h-full bg-red-400 rounded-full animate-bounce"></span>
                </div>
              </>
            ) : (
              <>
                <Mic className="size-3.5 text-[var(--axia-gold)]" />
                <span className="hidden md:inline text-[11px]">الأوامر الصوتية</span>
              </>
            )}
          </button>

          {/* Quick Settings / Cheatsheet button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="إدارة الأوامر الصوتية ودليل الكلمات المفتاحية"
            className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--panel)]/40 text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--accent)] transition"
          >
            <Settings2 className="size-3.5" />
          </button>
        </div>

        {/* Floating Live Voice Action Banner (below header) */}
        {showActiveBanner && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-lg rounded-2xl border border-[var(--axia-gold)]/40 bg-[var(--panel-glass)] backdrop-blur-xl p-3 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {isListening ? (
                  <div className="size-7 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 animate-pulse">
                    <Mic className="size-4" />
                  </div>
                ) : lastResult?.action === "navigation" ? (
                  <div className="size-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Compass className="size-4" />
                  </div>
                ) : lastResult?.action === "create_task" ? (
                  <div className="size-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckSquare className="size-4" />
                  </div>
                ) : (
                  <div className="size-7 rounded-xl bg-[var(--axia-gold)]/20 text-[var(--axia-gold)] flex items-center justify-center shrink-0">
                    <Sparkles className="size-4" />
                  </div>
                )}

                <div className="min-w-0 text-right">
                  {isListening ? (
                    <div>
                      <div className="text-[11px] font-bold text-red-400 flex items-center gap-1.5">
                        <span>تحدث الآن...</span>
                        <span className="text-[10px] text-[var(--text-muted)] font-normal">(مثال: &ldquo;افتح الجلسات&rdquo; أو &ldquo;مهمة جديدة...&rdquo;)</span>
                      </div>
                      <div className="text-xs font-semibold text-[var(--text)] truncate mt-0.5">
                        {interimTranscript ? (
                          <span className="text-[var(--axia-gold-light)] italic">&ldquo;{interimTranscript}&rdquo;</span>
                        ) : transcript ? (
                          <span>&ldquo;{transcript}&rdquo;</span>
                        ) : (
                          <span className="text-[var(--text-muted)] text-[11px]">في انتظار الكلمات المنطوقة...</span>
                        )}
                      </div>
                    </div>
                  ) : lastResult ? (
                    <div>
                      <div className="text-xs font-bold text-[var(--text)] flex items-center gap-1.5">
                        <span>{lastResult.feedbackText}</span>
                      </div>
                      {lastResult.createdTask && (
                        <div className="text-[10px] text-[var(--text-muted)] truncate">
                          المطلوب: {lastResult.createdTask.title} • {lastResult.createdTask.category}
                        </div>
                      )}
                    </div>
                  ) : errorMessage ? (
                    <div className="text-xs font-bold text-red-400">
                      {errorMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {lastResult?.action === "create_task" && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate("tasks");
                      setBannerDismissed(true);
                      clearLastResult();
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-1 text-[11px] font-bold hover:bg-emerald-500/30 transition"
                  >
                    <ExternalLink className="size-3" />
                    <span>عرض</span>
                  </button>
                )}

                {isListening && (
                  <button
                    type="button"
                    onClick={stopListening}
                    className="rounded-lg bg-red-500 text-white px-2 py-1 text-[11px] font-bold hover:bg-red-600 transition"
                  >
                    <MicOff className="size-3 inline ml-1" />
                    <span>إيقاف</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition"
                >
                  الدليل
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setBannerDismissed(true);
                    clearLastResult();
                    if (isListening) stopListening();
                  }}
                  className="p-1 text-[var(--text-muted)] hover:text-[var(--text)] rounded-lg hover:bg-[var(--accent)] transition"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Voice Command & Cheatsheet Modal */}
      <VoiceCommandModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onNavigate={onNavigate}
        onCreateTask={(task) => {
          if (onCreateTask) {
            onCreateTask(task);
          }
        }}
      />
    </>
  );
}
