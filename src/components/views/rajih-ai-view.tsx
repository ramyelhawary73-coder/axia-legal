"use client";

import { useState } from "react";
import {
  ArrowUp,
  BookOpen,
  Check,
  Clipboard,
  FileSearch,
  Gavel,
  Info,
  Loader2,
  MessageSquareText,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

let messageSequence = 100;
function nextMessageId(prefix: string) {
  messageSequence += 1;
  return `${prefix}-${messageSequence}`;
}

type Message = {
  id: string;
  sender: "user" | "rajih";
  text: string;
  citations?: string[];
};

const samplePrompts = [
  {
    title: "بحث في نص قانوني",
    description: "ابحث في نص قانوني منشور ومقارنته بتاريخ الواقعة.",
    query: "ما النصوص السارية التي تنظم شرط التحكيم في عقود المقاولات؟",
    icon: Scale,
  },
  {
    title: "تحليل ملف قضية",
    description: "لخّص الخط الزمني والنقاط التي تحتاج إلى تحقق.",
    query: "لخّص آخر تطورات القضية وحدد المواعيد والمعلومات الناقصة.",
    icon: FileSearch,
  },
  {
    title: "مسودة قانونية",
    description: "أنشئ مسودة أولية مع مصادرها للمراجعة البشرية.",
    query: "أنشئ هيكلاً أولياً لمذكرة دفاع مع بيان المصادر المطلوبة.",
    icon: Gavel,
  },
];

export function RajihAiView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "rajih",
      text: "مرحباً بك في راجح. أنا مساعد بحث قانوني أعمل بالمصادر المنشورة والمعتمدة فقط. لن أجزم بإجابة عند نقص المعلومات، وكل نتيجة تحتاج إلى مراجعة محامٍ مختص قبل الاعتماد عليها.",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputPrompt).trim();
    if (!text || isTyping) return;

    setMessages((previous) => [...previous, { id: nextMessageId("usr"), sender: "user", text }]);
    setInputPrompt("");
    setIsTyping(true);

    try {
      const response = await fetch("/api/rajih", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const result = (await response.json()) as {
        answer?: string;
        citations?: Array<{ title: string; version: string; sourceAuthority: string }>;
        error?: string;
      };
      setMessages((previous) => [
        ...previous,
        {
          id: nextMessageId("raj"),
          sender: "rajih",
          text: result.answer ?? result.error ?? "تعذر معالجة الطلب بشكل آمن.",
          citations: (result.citations ?? []).map(
            (citation) => `${citation.title} — ${citation.sourceAuthority} — الإصدار ${citation.version}`,
          ),
        },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: nextMessageId("raj"),
          sender: "rajih",
          text: "تعذر الاتصال بخادم راجح. لم يتم إنشاء إجابة بديلة غير موثقة.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const copyAnswer = async (message: Message) => {
    await navigator.clipboard.writeText(message.text);
    setCopiedId(message.id);
    window.setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <main className="min-h-full space-y-5 p-3 sm:space-y-7 sm:p-6 lg:p-10" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] border border-[var(--axia-gold)]/30 bg-[radial-gradient(circle_at_top_right,rgba(191,151,45,0.18),transparent_42%),linear-gradient(135deg,var(--panel),var(--bg))] p-5 shadow-2xl shadow-black/20 sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-300">
              <span className="size-1.5 animate-pulse rounded-full bg-emerald-300" />
              مساعد بحث قانوني آمن
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-[var(--text)] sm:text-5xl">
              راجح <span className="text-[var(--axia-gold-light)]">RAJIH</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--text-muted)] sm:text-base">
              ابحث في المصادر القانونية المعتمدة، حلّل مستنداتك المصرح بها، وأنشئ مسودات قابلة للمراجعة — مع مصدر كل نتيجة وتاريخ سريانها.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[420px]">
            {[
              [ShieldCheck, "مصادر معتمدة", "فقط"],
              [BookOpen, "بحث موثق", "بالاستشهادات"],
              [MessageSquareText, "مسودات", "للمراجعة"],
              [Info, "المحامي", "صاحب القرار"],
            ].map(([Icon, label, value]) => {
              const IconComponent = Icon as typeof ShieldCheck;
              return (
                <div key={label as string} className="rounded-2xl border border-[var(--border)] bg-black/15 p-3">
                  <IconComponent className="size-4 text-[var(--axia-gold-light)]" />
                  <p className="mt-2 text-[10px] text-[var(--text-muted)]">{label as string}</p>
                  <p className="mt-0.5 text-[11px] font-bold text-[var(--text)]">{value as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--axia-gold-light)]">ابدأ بسرعة</p>
            <h2 className="mt-1 text-lg font-bold text-[var(--text)]">ماذا تريد من راجح اليوم؟</h2>
          </div>
          <Sparkles className="size-5 text-[var(--axia-gold-light)]" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {samplePrompts.map(({ title, description, query, icon: Icon }) => (
            <button
              key={title}
              type="button"
              onClick={() => handleSend(query)}
              disabled={isTyping}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 text-right transition hover:-translate-y-0.5 hover:border-[var(--axia-gold)]/60 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-9 place-items-center rounded-xl bg-[var(--axia-gold)]/10 text-[var(--axia-gold-light)]"><Icon className="size-4" /></span>
                <ArrowUp className="size-4 rotate-45 text-[var(--text-muted)] transition group-hover:-translate-y-1" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-[var(--text)]">{title}</h3>
              <p className="mt-1 text-xs leading-5 text-[var(--text-muted)]">{description}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3 border-b border-[var(--border)] bg-[var(--accent)]/60 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-[var(--axia-gold)]/15 text-[var(--axia-gold-light)]"><Sparkles className="size-5" /></div>
            <div><h2 className="text-sm font-bold text-[var(--text)]">جلسة بحث راجح</h2><p className="text-[10px] text-[var(--text-muted)]">المصادر والنتائج محفوظة للتدقيق عند التفعيل</p></div>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300"><ShieldCheck className="size-3" /> مراجعة بشرية إلزامية</span>
        </div>

        <div className="flex h-[min(62vh,620px)] min-h-[440px] flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
            {messages.map((message) => {
              const isRajih = message.sender === "rajih";
              return (
                <div key={message.id} className={`flex gap-3 ${isRajih ? "items-start" : "flex-row-reverse items-start"}`}>
                  <div className={`grid size-9 shrink-0 place-items-center rounded-xl text-[10px] font-bold ${isRajih ? "border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/15 text-[var(--axia-gold-light)]" : "bg-[var(--text)] text-[var(--bg)]"}`}>
                    {isRajih ? <Sparkles className="size-4" /> : "أنت"}
                  </div>
                  <div className={`max-w-[90%] rounded-2xl p-4 text-sm leading-7 sm:max-w-[78%] ${isRajih ? "rounded-tr-sm border border-[var(--border)] bg-[var(--accent-hover)] text-[var(--text)]" : "rounded-tl-sm bg-cyan-950/40 text-[var(--text)]"}`}>
                    <p className="whitespace-pre-wrap">{message.text}</p>
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-4 border-t border-[var(--border)] pt-3">
                        <p className="mb-2 text-[10px] font-bold text-[var(--axia-gold-light)]">المصادر المستخدمة</p>
                        <div className="flex flex-wrap gap-1.5">{message.citations.map((citation) => <span key={citation} className="rounded-lg border border-[var(--border)] bg-[var(--accent)] px-2 py-1 text-[10px] text-[var(--text-muted)]">{citation}</span>)}</div>
                      </div>
                    )}
                    {isRajih && <button type="button" onClick={() => copyAnswer(message)} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-2.5 py-1.5 text-[10px] text-[var(--text-muted)] transition hover:text-[var(--text)]">{copiedId === message.id ? <><Check className="size-3 text-emerald-400" /> تم النسخ</> : <><Clipboard className="size-3" /> نسخ الإجابة</>}</button>}
                  </div>
                </div>
              );
            })}
            {isTyping && <div className="flex items-center gap-2 text-xs text-[var(--axia-gold-light)]"><Loader2 className="size-4 animate-spin" /> يجري البحث في المصادر المعتمدة…</div>}
          </div>

          <div className="border-t border-[var(--border)] bg-[var(--accent)]/40 p-3 sm:p-4">
            <form onSubmit={(event) => { event.preventDefault(); void handleSend(); }} className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 focus-within:border-[var(--axia-gold)]/60">
              <textarea value={inputPrompt} onChange={(event) => setInputPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} rows={2} placeholder="اكتب سؤالك القانوني أو اطلب تحليل مستند…" className="min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[var(--text)] outline-none placeholder:text-[var(--text-muted)]" />
              <button type="submit" disabled={!inputPrompt.trim() || isTyping} aria-label="إرسال السؤال" className="grid size-11 shrink-0 place-items-center rounded-xl bg-[var(--axia-gold)] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><ArrowUp className="size-5" /></button>
            </form>
            <p className="mt-2 px-1 text-[10px] leading-5 text-[var(--text-muted)]"><Info className="mr-1 inline size-3" />راجح مساعد بحث فقط. راجع النص الساري والوقائع والمصادر مع محامٍ مختص قبل اتخاذ أي إجراء.</p>
          </div>
        </div>
      </section>
    </main>
  );
}
