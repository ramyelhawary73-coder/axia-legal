"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { NavigationTab, LegalTask } from "@/types/legal";
import {
  isSpeechRecognitionSupported,
  getSpeechRecognitionConstructor,
  parseVoiceCommand,
  speakFeedback,
  IWindowSpeechRecognition,
  VoiceCommandResult,
  SpeechRecognitionEvent,
  SpeechRecognitionErrorEvent,
} from "@/lib/web-speech-service";

export interface UseVoiceCommandOptions {
  onNavigate?: (tab: NavigationTab) => void;
  onCreateTask?: (task: LegalTask) => void;
  defaultLang?: "ar-EG" | "ar-SA" | "en-US";
  enableAudioFeedback?: boolean;
}

export function useVoiceCommand({
  onNavigate,
  onCreateTask,
  defaultLang = "ar-EG",
  enableAudioFeedback = true,
}: UseVoiceCommandOptions = {}) {
  const [isSupported] = useState<boolean>(() => {
    return typeof window !== "undefined" ? isSpeechRecognitionSupported() : false;
  });
  const [isListening, setIsListening] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>("");
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lang, setLang] = useState<"ar-EG" | "ar-SA" | "en-US">(defaultLang);
  const [voiceFeedbackEnabled, setVoiceFeedbackEnabled] = useState<boolean>(enableAudioFeedback);

  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Check browser support on client mount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup abort
        }
      }
    };
  }, []);

  const handleCommandExecution = useCallback(
    (spokenText: string) => {
      if (!spokenText.trim()) return;

      const result = parseVoiceCommand(spokenText);
      setLastResult(result);

      if (result.action === "navigation" && result.targetTab) {
        if (onNavigate) {
          onNavigate(result.targetTab);
        }
        if (voiceFeedbackEnabled) {
          speakFeedback(`تم الانتقال إلى ${result.tabLabel || ""}`, lang);
        }
      } else if (result.action === "create_task" && result.createdTask) {
        if (onCreateTask) {
          onCreateTask(result.createdTask);
        }
        if (voiceFeedbackEnabled) {
          speakFeedback("تم تسجيل المهمة بنجاح", lang);
        }
      } else {
        if (voiceFeedbackEnabled && result.rawText.length > 3) {
          speakFeedback("عفواً، لم أتعرف على الأمر", lang);
        }
      }
    },
    [onNavigate, onCreateTask, voiceFeedbackEnabled, lang]
  );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setErrorMessage(null);
    setTranscript("");
    setInterimTranscript("");

    const SpeechRec = getSpeechRecognitionConstructor();
    if (!SpeechRec) {
      setErrorMessage("المتصفح الحالي لا يدعم واجهة الأوامر الصوتية Web Speech API.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const instance = new SpeechRec();
      instance.continuous = false;
      instance.interimResults = true;
      instance.lang = lang;
      instance.maxAlternatives = 1;

      instance.onstart = () => {
        if (isMountedRef.current) {
          setIsListening(true);
          setErrorMessage(null);
        }
      };

      instance.onresult = (event: SpeechRecognitionEvent) => {
        if (!isMountedRef.current) return;

        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0].transcript;
          if (item.isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        if (interim) {
          setInterimTranscript(interim);
        }

        if (final) {
          setTranscript(final);
          setInterimTranscript("");
          handleCommandExecution(final);
        }
      };

      instance.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (!isMountedRef.current) return;
        setIsListening(false);

        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setErrorMessage("تم رفض إذن استخدام الميكروفون. يرجى السماح بالوصول من إعدادات المتصفح.");
        } else if (event.error === "no-speech") {
          setErrorMessage("لم يتم اكتشاف صوت، يمكنك المحاولة مرة أخرى.");
        } else if (event.error === "network") {
          setErrorMessage("تعذر الاتصال بخدمة التعرف على الصوت (تأكد من الاتصال بالإنترنت).");
        } else {
          setErrorMessage(`تنبيه الميكروفون: ${event.error}`);
        }
      };

      instance.onend = () => {
        if (isMountedRef.current) {
          setIsListening(false);
        }
      };

      recognitionRef.current = instance;
      instance.start();
    } catch (err: unknown) {
      setIsListening(false);
      const msg = err instanceof Error ? err.message : "تعذر بدء الميكروفون";
      setErrorMessage(msg);
    }
  }, [lang, handleCommandExecution]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const executeManualCommand = useCallback(
    (manualText: string) => {
      setTranscript(manualText);
      setInterimTranscript("");
      handleCommandExecution(manualText);
    },
    [handleCommandExecution]
  );

  const clearLastResult = useCallback(() => {
    setLastResult(null);
    setTranscript("");
    setInterimTranscript("");
  }, []);

  return {
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
    toggleListening,
    executeManualCommand,
    clearLastResult,
  };
}
