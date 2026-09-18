export type NavigationTab =
  | "overview"
  | "matters"
  | "hearings"
  | "clients"
  | "tasks"
  | "documents"
  | "finance"
  | "team"
  | "library"
  | "rajih"
  | "reports"
  | "administration";

export type MatterStage = "متداولة" | "حجز للحكم" | "مؤجلة لتقديم مستندات" | "محكوم فيها" | "طعن بالاستئناف" | "طعن بالنقض";

export type CourtCategory =
  | "محكمة النقض"
  | "استئناف عالي"
  | "ابتدائية كلي"
  | "جزئية"
  | "مجلس الدولة (القضاء الإداري)"
  | "المحكمة الاقتصادية"
  | "محكمة الأسرة"
  | "محكمة الجنايات";

export interface Matter {
  id: string;
  caseNumber: string; // e.g. "1284 لسنة 2025 مدني كلي شمال"
  year: number;
  court: CourtCategory;
  circuit: string; // e.g. "الدائرة 14 مدني واستثمار"
  title: string; // e.g. "دعوى بطلان عقد بيع ومطالبة بتعويض"
  clientName: string;
  clientId?: string;
  clientRole: "مدعي" | "مدعى عليه" | "طاعن" | "مطعون ضده" | "مستأنف" | "مستأنف ضده";
  opponentName: string;
  opponentLawyer?: string;
  assignedLawyer: string;
  nextHearingDate: string;
  nextHearingGoal: string; // المطلوب بالجلسة
  stage: MatterStage;
  claimAmount?: string;
  agreedFees: string;
  paidFees: string;
  notes?: string;
  status?: "مفتوحة" | "مغلقة";
  filingDate?: string;
  verdictDate?: string;
  verdict?: string;
  verdictResult?: "صالح الموكل (كسب الدعوى)" | "رفض الدعوى" | "صلح قضائي وبراءة ذمة" | "بطلان الحكم المستأنف" | "تأييد الحكم الابتدائي";
  executionStatus?: "تم التنفيذ واستلام الحقوق" | "قيد التنفيذ الجبري" | "منتهية بالتراضي" | "تم إنهاء النزاع بالصلح" | "سند تنفيذي معلن";
  finalAwardAmount?: string;
}

export interface Hearing {
  id: string;
  matterId: string;
  caseNumber: string;
  court: string;
  circuit: string;
  hall: string; // القاعة / الرول
  rollNumber: number; // رقم الرول
  hearingDate: string; // YYYY-MM-DD
  hearingTime: string;
  attendingLawyer: string;
  purpose: string; // المذكرات / الشهود / النطق بالحكم
  lastDecision?: string; // قرار الجلسة السابقة
  status: "قادمة" | "اليوم" | "منتهية" | "مؤجلة";
}

export interface Client {
  id: string;
  name: string;
  type: "شركة / مؤسسة" | "فرد / شخص طبيعي";
  nationalIdOrCr: string; // رقم قومي أو سجل تجاري
  phone: string;
  email: string;
  poaNumber: string; // رقم التوكيل الرسمي
  poaOffice: string; // مكتب التوثيق (e.g. الأهرام النموذجي)
  poaExpiry: string; // سريان التوكيل
  activeMattersCount: number;
  totalPaid: string;
  balanceDue: string;
  address: string;
}

export interface LegalTask {
  id: string;
  title: string;
  category: "قلم المحضرين" | "سداد رسوم" | "إيداع مذكرات" | "استخراج شهادة" | "تنفيذ حكم" | "ميعاد طعن قانوني";
  matterCaseNumber?: string;
  courtOrBailiffOffice: string; // قلم محضرين الدقي / خزينة شمال القاهرة
  assignedTo: string;
  deadline: string;
  priority: "حرجة للغاية (ميعاد سقوط)" | "عاجلة" | "عادية";
  status: "قيد التنفيذ" | "مكتملة" | "معلقة";
}

export interface LegalDocument {
  id: string;
  title: string;
  type: "صحيفة دعوى" | "مذكرة دفاع" | "عقد واتفاقية" | "حكم قضائي" | "تقرير خبير" | "إنذار رسمي";
  caseNumber?: string;
  clientName: string;
  date: string;
  fileSize: string;
  status: "نهائي معتمد" | "مسودة قيد المراجعة" | "موقع رسمياً";
}

export interface FinancialRecord {
  id: string;
  clientName: string;
  matterCaseNumber: string;
  type: "دفعة أتعاب" | "أمانة خبير" | "رسوم قضائية" | "مصروفات إدارية" | "أتعاب نجاح مؤخرة";
  amount: number;
  date: string;
  status: "محصلة" | "مستحقة" | "مسددة للمحكمة";
  receiptNumber: string;
}

export interface PrecedentArticle {
  id: string;
  court: "محكمة النقض المصرية" | "المحكمة الإدارية العليا" | "المحكمة الدستورية العليا";
  ruleNumber: string; // الطعن رقم 4210 لسنة 89 ق
  date: string;
  circuit: "الدوائر المدنية والتجارية" | "الدوائر الجنائية" | "دوائر الإيجارات والعمال";
  principle: string; // المبدأ القانوني
  legalArticles: string[]; // مواد القانون المدني/المرافعات ذات الصلة
}
