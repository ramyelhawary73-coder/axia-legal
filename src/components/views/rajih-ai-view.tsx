"use client";

import { useState } from "react";
import { 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  ArrowRight,
  Gavel
} from "lucide-react";

let msgSeq = 100;
function nextMsgId(prefix: string) {
  msgSeq += 1;
  return `${prefix}-${msgSeq}`;
}

interface Message {
  id: string;
  sender: "user" | "rajih";
  text: string;
  timestamp: string;
  citations?: string[];
}

const samplePrompts = [
  {
    title: "صياغة دفع بعدم قبول الدعوى لوجود شرط التحكيم",
    query: "صغ لي دفعاً بعدم قبول الدعوى لوجود شرط التحكيم الصحيح في عقد المقاولة وفقاً للمادة ١٣ من قانون التحكيم المصري ٢٧ لسنة ١٩٩٤ مع أحدث أحكام محكمة النقض.",
    response: `**مذكرة بالدفع الشكلي: بعدم قبول الدعوى لوجود شرط التحكيم**

أولاً: الأساس القانوني (المادة ١٣ من قانون التحكيم رقم ٢٧ لسنة ١٩٩٤):
تنص المادة ١٣ على أنه: «يجب على المحكمة التي يرفع إليها نزاع يوجد بشأنه اتفاق تحكيم أن تحكم بعدم قبول الدعوى إذا دفع المدعى عليه بذلك قبل إبدائه أي طلب أو دفاع في الموضوع».

ثانياً: شروط إبداء الدفع شكلاً:
١. التمسك بالدفع بالجلسة الأولى وقبل التكلم في الموضوع أو إبداء أي دفع موضوعي آخر.
٢. إرفاق أصل العقد أو صورته الضوئية غير المجحودة المتضمنة البند التحكيمي الصريح.

ثالثاً: أحكام محكمة النقض المؤيدة:
- الطعن رقم ٤١١٢ لسنة ٨٦ ق - جلسة ٢٠١٨/٠٤/١٥ (دوائر المواد المدنية):
«المقرر في قضاء النقض أن شرط التحكيم متى ورد صريحاً غير غامض استلب ولاية القضاء في نظر النزاع، ويتعين على محكمة الموضوع القضاء بعدم قبول الدعوى بمجرد التمسك به قبل الخوض في الموضوع».

رابعاً: نص الدفـع المقترح للمذكرة:
«نلتمس من الهيئة الموقرة القضاء أصلياً: بعدم قبول الدعوى لوجود شرط التحكيم، وإلزام المدعي بالمصروفات ومقابل أتعاب المحاماة».`,
    citations: [
      "مادة ١٣ من قانون التحكيم رقم ٢٧ لسنة ١٩٩٤",
      "نقض مدني طعن ٤١١٢ لسنة ٨٦ ق - جلسة ٢٠١٨/٠٤/١٥",
      "مادة ١٠٨ مرافعات مدنية وتجارية"
    ]
  },
  {
    title: "الدفع بسقوط الحق في رفع دعوى البطلان بالتقادم",
    query: "ما هو ميعاد سقوط دعوى بطلان العقد للغلط أو التدليس أو الإكراه وفقاً للقانون المدني المصري؟",
    response: `**المذكرة القانونية في شأن سقوط دعوى الإبطال بالتقادم (المادة ١٤٠ مدني)**

تنص المادة ١٤٠ من القانون المدني المصري على:
«يسقط الحق في إبطال العقد إذا لم يتمسك به صاحبه خلال ثلاث سنوات. ويبدأ سريان هذه المدة، في حالة نقص الأهلية من اليوم الذي يزول فيه هذا السبب، وفي حالة الغلط أو التدليس من اليوم الذي يكشف فيه، وفي حالة الإكراه من يوم انقطاعه، وفي كل حال لا يجوز التمسك بحق الإبطال لغلط أو تدليس أو إكراه إذا انقضت خمس عشرة سنة من وقت تمام العقد».

الدفوع الجوهرية الواجب إبداؤها:
١. الدفع بسقوط الحق في طلب الإبطال لمضي أكثر من ثلاث سنوات من تاريخ علم المدعي بالواقعة أو استلام المبيع.
٢. الدفع بسقوط الحق بالتقادم الطويل (١٥ سنة) من تاريخ تحرير العقد كحد أقصى مطلق.

مبدأ محكمة النقض (طعن ١٢٨ لسنة ٦٢ ق):
«مدة الثلاث سنوات المقررة لسقوط دعوى الإبطال هي مدة سقوط حتمية لا تقبل الوقف أو الانقطاع، وانقضاؤها يرتب سقوط الحق في المطالبة».`,
    citations: [
      "المادة ١٤٠ من القانون المدني المصري",
      "نقض مدني طعن ١٢٨ لسنة ٦٢ ق"
    ]
  },
  {
    title: "تدقيق ثغرات بند التعويض الاتفاقي (الشرط الجزائي)",
    query: "كيف يتم تخفيض الشرط الجزائي المبالغ فيه في عقد التوريد أمام القضاء المصري؟",
    response: `**المذكرة الفنية في سلطة القاضي في تخفيض الشرط الجزائي (المادة ٢٢٤ مدني)**

وفقاً للمادة ٢٢٤ من القانون المدني:
١. لا يكون التعويض الاتفاقي مستحقاً إذا أثبت المدين أن الدائن لم يلحقه أي ضرر.
٢. ويجوز للقاضي أن يخفض هذا التعويض إذا أثبت المدين أن التقدير كان مبالغاً فيه إلى درجة كبيرة، أو أن الالتزام قد نفذ في جزء منه.
٣. يقع باطلاً كل اتفاق يخالف حكم هاتين الفقرتين (قاعدة آمرة متعلقة بالنظام العام الاقتصادي).

استراتيجية المرافعة المقترحة:
- طلب ندب خبير حسابي لبيان الضرر الفعلي الواقعي إن وجد مقارنة بالتعويض الاتفاقي الخيالي.
- إثبات حسن نية المورد وتنفيذ نسبة ٧٠٪ من التوريدات التعاقدية.`,
    citations: [
      "المادة ٢٢٤ من القانون المدني المصري",
      "نقض مدني طعن ٩٠٤ لسنة ٥٤ ق"
    ]
  }
];

export function RajihAiView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "rajih",
      text: "مرحباً بك يا أستاذنا المستشار. أنا «راجح RAJIH AI» - المساعد القانوني الذكي المتخصص في المنظومة القضائية والتشريعات المصرية وأحكام محكمة النقض. يمكنك سؤالي عن صياغة الدفوع، استخراج أرقام الطعون المطابقة لوقائع قضيتك، فحص بنود العقود، أو تلخيص صحف الدعاوى المعقدة.",
      timestamp: "الآن",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputPrompt;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: nextMsgId("usr"),
      sender: "user",
      text,
      timestamp: "الآن",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsTyping(true);

    // Look for matching sample prompt or generate structured response
    setTimeout(() => {
      const match = samplePrompts.find((p) => text.includes(p.title) || p.query.includes(text) || text.includes("تحكيم") || text.includes("بطلان"));
      
      const reply: Message = {
        id: nextMsgId("raj"),
        sender: "rajih",
        text: match ? match.response : `**تحليل راجح القانوني للاستفسار:**

بناءً على نصوص القانون المصري والمبادئ القضائية المستقرة:

١. التكييف القانوني السليم للواقعة:
يخضع هذا النزاع للقواعد العامة للمسؤولية العقدية والتقصيرية وفقاً لنصوص القانون المدني وقانون المرافعات المدنية والتجارية.

٢. الدفوع الموصى بالتمسك بها في المذكرة:
- الدفع بعدم قبول الدعوى لرفعها بغير الطريق الذي رسمه القانون.
- الدفع بانعدام الخصومة لعدم اختصام ذوي الشأن الأصليين.
- الدفع بسقوط الحق بالميعاد أو التقادم المسقط.

٣. السوابق القضائية لمحكمة النقض:
«المقرر في قضاء هذه المحكمة أن عبء إثبات الواقعة المنشئة للالتزام يقع على عاتق المدعي، فإذا عجز عن إثباتها تعين رفض الدعوى بحالتها» (نقض مدني طعن رقم ٧١٨ لسنة ٨٢ ق).`,
        timestamp: "الآن",
        citations: match ? match.citations : ["قانون المرافعات المصري", "القانون المدني المصري", "مبادئ الدوائر المدنية لمحكمة النقض"],
      };

      setMessages((prev) => [...prev, reply]);
      setIsTyping(false);
    }, 600);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-7 p-6 sm:p-8 lg:p-10">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[var(--axia-gold)]/40 bg-gradient-to-r from-[var(--panel)] via-[var(--bg)] to-[var(--panel)] p-6 lg:p-8 shadow-xl shadow-black/20">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/10 px-3.5 py-1 text-xs font-semibold text-[var(--axia-gold-light)]">
              <Sparkles className="size-3.5" />
              <span>محرك الاستدلال القانوني الذكي المعتمد</span>
            </div>
            <h1 className="mt-3 text-2xl font-bold text-[var(--text)] sm:text-3xl">
              راجح — RAJIH AI Legal Copilot
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl leading-relaxed">
              المساعد القانوني المتخصص للبحث الفوري في أحكام محكمة النقض المصرية، صياغة مذكرات الدفوع الشكلية والموضوعية، وفحص بنود العقود وتحديد الثغرات القضائية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--accent)] px-4 py-2.5 text-right text-xs">
              <span className="text-[var(--text-muted)] block text-[10px]">قاعدة المعرفة النشطة:</span>
              <strong className="text-[var(--axia-gold-light)] font-mono">١٢٠,٠٠٠+ مبدأ نقض رسمي</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Quick Actions / Sample Prompts */}
      <div>
        <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          نماذج استشارات وأبحاث قانونية فورية:
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {samplePrompts.map((sp, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(sp.query)}
              className="group text-right rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4 transition hover:border-[var(--axia-gold)]/50 hover:bg-[var(--accent-hover)]"
            >
              <div className="flex items-center justify-between text-[var(--axia-gold-light)] mb-2">
                <Gavel className="size-4" />
                <ArrowRight className="size-3.5 group-hover:-translate-x-1 transition" />
              </div>
              <h3 className="text-xs font-bold text-[var(--text)] group-hover:text-[var(--axia-gold-light)] transition">
                {sp.title}
              </h3>
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)] line-clamp-2">
                {sp.query}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Workspace */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] shadow-xl flex flex-col h-[520px]">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isRajih = msg.sender === "rajih";
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isRajih ? "items-start" : "items-start flex-row-reverse"}`}
              >
                <div
                  className={`grid size-9 shrink-0 place-items-center rounded-xl font-bold text-xs ${
                    isRajih
                      ? "border border-[var(--axia-gold)]/40 bg-[var(--axia-gold)]/15 text-[var(--axia-gold-light)]"
                      : "bg-cyan-500 text-slate-950"
                  }`}
                >
                  {isRajih ? <Sparkles className="size-4" /> : "أنت"}
                </div>

                <div
                  className={`relative max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed ${
                    isRajih
                      ? "border border-[var(--border)] bg-[var(--accent-hover)] text-[var(--text)]"
                      : "bg-cyan-950/40 border border-cyan-500/20 text-[var(--text)]"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 border-t border-[var(--border)] pt-3">
                      <span className="text-[10px] font-bold text-[var(--axia-gold-light)] block mb-1.5">
                        المصادر والمراجع القانونية المعتمدة:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.citations.map((c, i) => (
                          <span
                            key={i}
                            className="rounded bg-[var(--accent)] border border-[var(--border)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] font-mono"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isRajih && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="inline-flex items-center gap-1 rounded bg-[var(--accent)] px-2 py-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--text)]"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="size-3 text-emerald-400" />
                            <span className="text-emerald-400">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3" />
                            <span>نسخ الصيغة القانونية</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isTyping && (
            <div className="flex items-center gap-3 text-xs text-[var(--axia-gold-light)] animate-pulse">
              <Sparkles className="size-4" />
              <span>جاري مضاهاة وقائع القضية مع نصوص القانون وأحكام النقض...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="border-t border-[var(--border)] p-4 bg-[var(--accent)]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="اكتب استفسارك، أو اطلب صياغة دفع قانوني، أو ابحث عن مبدأ قضائي في محكمة النقض..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-3 text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:border-[var(--axia-gold)] focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputPrompt.trim() || isTyping}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--axia-gold)] to-[#a77e16] px-5 py-3 text-xs font-bold text-slate-950 shadow-md transition hover:brightness-110 disabled:opacity-50"
            >
              <span>تحليل</span>
              <Send className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
