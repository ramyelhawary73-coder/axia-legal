import { NavigationTab, LegalTask } from "@/types/legal";

// Extended SpeechRecognition types for browsers (Chrome, Edge, Safari)
export interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export interface IWindowSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: ((this: IWindowSpeechRecognition, ev: Event) => unknown) | null;
  onresult: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionEvent) => unknown) | null;
  onerror: ((this: IWindowSpeechRecognition, ev: SpeechRecognitionErrorEvent) => unknown) | null;
  onend: ((this: IWindowSpeechRecognition, ev: Event) => unknown) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type VoiceActionType = "navigation" | "create_task" | "unknown";

export interface VoiceCommandResult {
  action: VoiceActionType;
  rawText: string;
  normalizedText: string;
  targetTab?: NavigationTab;
  tabLabel?: string;
  createdTask?: LegalTask;
  confidenceMessage?: string;
  feedbackText: string;
}

/**
 * Check if the current browser environment supports the Web Speech API Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
}

/**
 * Check if the browser supports SpeechSynthesis (TTS)
 */
export function isSpeechSynthesisSupported(): boolean {
  if (typeof window === "undefined") return false;
  return "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
}

/**
 * Get the SpeechRecognition constructor if available
 */
export function getSpeechRecognitionConstructor(): (new () => IWindowSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SpeechRec || null;
}

/**
 * Normalize Arabic text for robust speech matching:
 * - Removes tashkeel / harakat
 * - Normalizes Alef variations (أ, إ, آ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa (ى -> ي)
 * - Strips punctuation and excessive whitespace
 */
export function normalizeArabicSpeech(input: string): string {
  if (!input) return "";
  let text = input.trim().toLowerCase();

  // Remove diacritics
  text = text.replace(/[\u064B-\u065F\u0670]/g, "");

  // Normalize Alef forms
  text = text.replace(/[إأآا]/g, "ا");

  // Normalize Taa Marbuta to Haa
  text = text.replace(/ة/g, "ه");

  // Normalize Alef Maqsura to Yaa
  text = text.replace(/ى/g, "ي");

  // Strip punctuation and special chars
  text = text.replace(/[:،,.؟!/\\-]/g, " ");

  // Collapse multiple whitespaces
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

// Synonyms dictionary for tabs
interface NavMapping {
  tab: NavigationTab;
  labelAr: string;
  keywords: string[];
}

const NAVIGATION_MAPPINGS: NavMapping[] = [
  {
    tab: "overview",
    labelAr: "نظرة عامة",
    keywords: ["نظره عامه", "الرئيسيه", "الصفحه الرئيسيه", "لوحه التحكم", "الداشبورد", "البدايه", "overview", "home", "dashboard"],
  },
  {
    tab: "matters",
    labelAr: "القضايا والملفات",
    keywords: ["القضايا", "الملفات", "قضايا", "الدعاوى", "قضيه", "ملف قضيه", "ملفات القضايا", "matters", "cases", "dossiers"],
  },
  {
    tab: "hearings",
    labelAr: "الجلسات والتقويم",
    keywords: ["الجلسات", "التقويم", "رول الجلسات", "جلسات اليوم", "الرول", "مواعيد الجلسات", "جلسه", "hearings", "sessions", "calendar", "roll"],
  },
  {
    tab: "clients",
    labelAr: "الموكلين والتوكيلات",
    keywords: ["الموكلين", "الموكلون", "التوكيلات", "العملاء", "الموكل", "توكيل", "توكيلات", "clients", "customers", "poa"],
  },
  {
    tab: "tasks",
    labelAr: "قلم المحضرين والمهام",
    keywords: ["المهام", "قلم المحضرين", "المحضرين", "مواعيد السقوط", "الاعمال اليوميه", "مهام", "tasks", "bailiff", "deadlines"],
  },
  {
    tab: "documents",
    labelAr: "العقود والمستندات",
    keywords: ["المستندات", "العقود", "الوثائق", "الاوراق", "عقود", "مستند", "صيغ العقود", "documents", "contracts", "docs"],
  },
  {
    tab: "finance",
    labelAr: "المالية والأتعاب",
    keywords: ["الماليه", "الاتعاب", "الحسابات", "المطالبات", "المصروفات", "الفواتير", "الخزينه", "finance", "fees", "billing", "money"],
  },
  {
    tab: "library",
    labelAr: "المكتبة وأحكام النقض",
    keywords: ["المكتبه", "احكام النقض", "النقض", "المراجع القانونيه", "القوانين", "السوابق القضائيه", "المكتبه القانونيه", "library", "precedents", "laws"],
  },
  {
    tab: "rajih",
    labelAr: "راجح الذكاء الاصطناعي",
    keywords: ["راجح", "الذكاء الاصطناعي", "المساعد الذكي", "المستشار راجح", "مساعد ذكي", "rajih", "ai", "copilot"],
  },
  {
    tab: "team",
    labelAr: "فريق العمل والمتدربون",
    keywords: ["فريق العمل", "المحامين", "المحامون", "المتدربين", "المتدربون", "اعضاء المكتب", "الزملاء", "team", "lawyers", "staff"],
  },
  {
    tab: "reports",
    labelAr: "التقارير والإحصائيات",
    keywords: ["التقارير", "الاحصائيات", "التحليلات", "مؤشرات الاداء", "تقرير", "reports", "analytics", "stats", "kpi"],
  },
  {
    tab: "administration",
    labelAr: "إدارة المكتب والترخيص",
    keywords: ["الاداره", "الاعدادات", "اداره المكتب", "الترخيص", "بيانات المكتب", "الضبط", "administration", "settings", "admin"],
  },
];

// Prefixes commonly spoken before a navigation command
const NAV_PREFIXES = [
  "افتح", "انتقل الى", "انتقل ل", "روح على", "روح ل", "اذهب الى", "اذهب ل", 
  "عرض", "شاشه", "صفحه", "وديني", "حولني الى", "هات", "open", "go to", "show", "navigate to"
];

// Trigger words for creating a task note
const TASK_TRIGGERS = [
  "مهمه جديده", "مهمه صوتيه", "اضف مهمه", "اضافه مهمه", "سجل مهمه", 
  "تسجيل مهمه", "دون مهمه", "ملاحظه مهمه", "عمل مهمه", "مهمه", 
  "سجل لي", "انشئ مهمه", "new task", "create task", "add task", "task note", "note"
];

/**
 * Parses user spoken transcript and determines if it is a Navigation command or a Task creation command
 */
export function parseVoiceCommand(rawTranscript: string): VoiceCommandResult {
  const trimmed = rawTranscript.trim();
  const normalized = normalizeArabicSpeech(trimmed);

  if (!normalized) {
    return {
      action: "unknown",
      rawText: rawTranscript,
      normalizedText: "",
      feedbackText: "لم يتم التعرف على الأمر، يرجى التحدث بوضوح.",
    };
  }

  // 1. Check for Task Creation Command first if trigger phrases exist
  for (const trigger of TASK_TRIGGERS) {
    const normTrigger = normalizeArabicSpeech(trigger);
    if (normalized.startsWith(normTrigger) || normalized.includes(normTrigger)) {
      // Extract the task content/note
      let taskContent = "";
      const triggerIdx = normalized.indexOf(normTrigger);
      if (triggerIdx !== -1) {
        // Find in original text roughly after the trigger
        const words = trimmed.split(/\s+/);
        const triggerWordsCount = trigger.split(/\s+/).length;
        
        // If trigger is at start
        if (triggerIdx === 0) {
          taskContent = words.slice(triggerWordsCount).join(" ").trim();
        } else {
          // If in the middle
          taskContent = trimmed.substring(triggerIdx + trigger.length).trim();
        }
      }

      // If empty task content, fallback to using raw text without the trigger word
      if (!taskContent || taskContent.length < 3) {
        taskContent = trimmed.replace(new RegExp(trigger, "i"), "").trim();
      }

      // Strip leading colons or prepositions like "بـ" or "أن"
      taskContent = taskContent.replace(/^[:،.\- أن ب]+/g, "").trim();

      if (taskContent.length >= 3) {
        const newTask = buildTaskFromVoiceNote(taskContent);
        return {
          action: "create_task",
          rawText: rawTranscript,
          normalizedText: normalized,
          createdTask: newTask,
          feedbackText: `تم تسجيل المهمة الصوتية بنجاح: "${newTask.title}"`,
        };
      }
    }
  }

  // 2. Check for Navigation Commands
  // Clean off navigation prefixes if present
  let cleanNavText = normalized;
  for (const p of NAV_PREFIXES) {
    const normPrefix = normalizeArabicSpeech(p);
    if (cleanNavText.startsWith(normPrefix)) {
      cleanNavText = cleanNavText.substring(normPrefix.length).trim();
      break;
    }
  }

  for (const item of NAVIGATION_MAPPINGS) {
    // Check if cleanNavText directly matches any keyword or contains it
    for (const kw of item.keywords) {
      const normKw = normalizeArabicSpeech(kw);
      if (
        cleanNavText === normKw ||
        cleanNavText.startsWith(normKw + " ") ||
        cleanNavText.endsWith(" " + normKw) ||
        cleanNavText.includes(" " + normKw + " ") ||
        normalized.includes(normKw)
      ) {
        return {
          action: "navigation",
          rawText: rawTranscript,
          normalizedText: normalized,
          targetTab: item.tab,
          tabLabel: item.labelAr,
          feedbackText: `جارٍ الانتقال إلى قسم: ${item.labelAr}`,
        };
      }
    }
  }

  // 3. Fallback: If text contains words strongly indicating a legal task even without trigger (e.g. "سداد رسم بمحكمة شمال القاهرة")
  const taskKeywords = ["سداد رسوم", "اعلان صحيفه", "اعلان حكم", "قلم المحضرين", "ايداع مذكره", "استخراج شهاده", "تنفيذ حكم"];
  for (const tkw of taskKeywords) {
    if (normalized.includes(tkw)) {
      const newTask = buildTaskFromVoiceNote(trimmed);
      return {
        action: "create_task",
        rawText: rawTranscript,
        normalizedText: normalized,
        createdTask: newTask,
        feedbackText: `تم تسجيل المهمة الصوتية بنجاح: "${newTask.title}"`,
      };
    }
  }

  return {
    action: "unknown",
    rawText: rawTranscript,
    normalizedText: normalized,
    feedbackText: `تم سماع: "${trimmed}" - يمكنك قول: "افتح الجلسات" أو "مهمة جديدة: إعلان صحيفة الدعوى..."`,
  };
}

/**
 * Constructs a structured LegalTask from a spoken voice note
 */
export function buildTaskFromVoiceNote(voiceNote: string): LegalTask {
  const norm = normalizeArabicSpeech(voiceNote);

  // Determine Category
  let category: LegalTask["category"] = "قلم المحضرين";
  if (norm.includes("رسم") || norm.includes("رسوم") || norm.includes("خزينه") || norm.includes("سداد") || norm.includes("دفع") || norm.includes("دمغه")) {
    category = "سداد رسوم";
  } else if (norm.includes("مذكره") || norm.includes("مذكرات") || norm.includes("دفاع") || norm.includes("ايداع") || norm.includes("تعقيب")) {
    category = "إيداع مذكرات";
  } else if (norm.includes("شهاده") || norm.includes("جدول") || norm.includes("صوره رسميه") || norm.includes("استخراج") || norm.includes("تصوير")) {
    category = "استخراج شهادة";
  } else if (norm.includes("تنفيذ") || norm.includes("صيغه تنفيذيه") || norm.includes("حجز") || norm.includes("محضر تبديد") || norm.includes("اشكال")) {
    category = "تنفيذ حكم";
  } else if (norm.includes("طعن") || norm.includes("استئناف") || norm.includes("نقض") || norm.includes("ميعاد") || norm.includes("سقوط")) {
    category = "ميعاد طعن قانوني";
  } else if (norm.includes("محضر") || norm.includes("اعلان") || norm.includes("انذار")) {
    category = "قلم المحضرين";
  }

  // Determine Priority
  let priority: LegalTask["priority"] = "عاجلة";
  if (norm.includes("سقوط") || norm.includes("حرج") || norm.includes("خطير") || norm.includes("فوري") || norm.includes("طارئ")) {
    priority = "حرجة للغاية (ميعاد سقوط)";
  } else if (norm.includes("عادي") || norm.includes("بسيط") || norm.includes("روتين")) {
    priority = "عادية";
  }

  // Detect Court or Bailiff Office
  let courtOrBailiffOffice = "قلم محضرين الاختصاص / جهة التنفيذ";
  if (norm.includes("شمال القاهره")) {
    courtOrBailiffOffice = "محكمة شمال القاهرة الابتدائية - مجمع الجلاء";
  } else if (norm.includes("جنوب القاهره") || norm.includes("باب الخلق")) {
    courtOrBailiffOffice = "محكمة جنوب القاهرة الابتدائية - باب الخلق";
  } else if (norm.includes("الجيزه")) {
    courtOrBailiffOffice = "قلم محضرين الجيزة - مجمع محاكم تاج الدول";
  } else if (norm.includes("الدقي") || norm.includes("العجوزه")) {
    courtOrBailiffOffice = "قلم محضرين الدقي والعجوزة - شارع السودان";
  } else if (norm.includes("مصر الجديده") || norm.includes("النزهه")) {
    courtOrBailiffOffice = "قلم محضرين مصر الجديدة والنزهة";
  } else if (norm.includes("مدينه نصر")) {
    courtOrBailiffOffice = "قلم محضرين أول مدينة نصر - الحي السابع";
  } else if (norm.includes("النقض")) {
    courtOrBailiffOffice = "محكمة النقض - دار القضاء العالي";
  } else if (norm.includes("مجلس الدوله")) {
    courtOrBailiffOffice = "مجلس الدولة بالدقي - القضاء الإداري";
  } else if (norm.includes("الاقتصاديه")) {
    courtOrBailiffOffice = "المحكمة الاقتصادية بالقاهرة - المعادي";
  } else if (norm.includes("قصر النيل")) {
    courtOrBailiffOffice = "قلم محضرين قصر النيل وعابدين";
  }

  // Default Deadline: 3 days from now
  const deadlineDate = new Date();
  deadlineDate.setDate(deadlineDate.getDate() + 3);
  const deadlineStr = deadlineDate.toISOString().slice(0, 10);

  // Capitalize or clean title
  const cleanTitle = voiceNote.trim();

  return {
    id: `VOICE-TSK-${Date.now()}`,
    title: cleanTitle.length > 5 ? cleanTitle : `مهمة صوتية: ${cleanTitle}`,
    category,
    courtOrBailiffOffice,
    assignedTo: "أ. مروان هاني (محام متدرب)",
    deadline: deadlineStr,
    priority,
    status: "قيد التنفيذ",
  };
}

/**
 * Provide voice feedback using browser SpeechSynthesis
 */
export function speakFeedback(text: string, lang: string = "ar-EG"): void {
  if (!isSpeechSynthesisSupported()) return;

  try {
    window.speechSynthesis.cancel(); // Cancel any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    // Try to find an Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith("ar"));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn("Speech synthesis error:", err);
  }
}
