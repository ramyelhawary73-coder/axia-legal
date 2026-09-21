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

export type MatterStage = "متداولة" | "حجز للحكم" | "مؤجلة لتقديم مستندات" | "محكوم فيها" | "طعن بالاستئناف" | "طعن بالنقض" | "غير مسجل";

export type CourtCategory =
  | "محكمة النقض"
  | "استئناف عالي"
  | "ابتدائية كلي"
  | "جزئية"
  | "مجلس الدولة (القضاء الإداري)"
  | "المحكمة الاقتصادية"
  | "محكمة الأسرة"
  | "محكمة الجنايات"
  | "غير مسجل";

export interface Matter {
  id: string;
  caseNumber: string; // e.g. "1284 لسنة 2025 مدني كلي شمال"
  year: number;
  court: CourtCategory;
  category?: "مدني" | "جنائي" | "عمالي" | "تجاري" | "إداري" | "أسرة";
  circuit: string; // e.g. "الدائرة 14 مدني واستثمار"
  title: string; // e.g. "دعوى بطلان عقد بيع ومطالبة بتعويض"
  clientName: string;
  clientId?: string;
  clientRole: "مدعي" | "مدعى عليه" | "طاعن" | "مطعون ضده" | "مستأنف" | "مستأنف ضده" | "غير مسجل";
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
  contacts?: {
    id: string;
    name: string;
    role: "شاهد" | "خصم" | "خبير" | "أخرى";
    phone: string;
    email?: string;
    notes?: string;
  }[];
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
  pleadingNotes?: string; // نقاط المرافعة وملاحظات سريعة للجلسة
  isArchived?: boolean; // أرشفة الجلسة
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
  matterId?: string;
  matterCaseNumber?: string;
  courtOrBailiffOffice: string; // قلم محضرين الدقي / خزينة شمال القاهرة
  assignedTo: string;
  assignedToUserId?: string;
  deadline: string;
  priority: "حرجة للغاية (ميعاد سقوط)" | "عاجلة" | "عادية";
  status: "قيد التنفيذ" | "مكتملة" | "معلقة";
}

export interface LegalDocument {
  id: string;
  title: string;
  type:
    | "صحيفة دعوى"
    | "مذكرة دفاع"
    | "عقد واتفاقية"
    | "حكم قضائي"
    | "تقرير خبير"
    | "إنذار رسمي"
    | "مستند قانوني";
  caseNumber?: string;
  clientName: string;
  date: string;
  fileSize: string;
  status: "نهائي معتمد" | "مسودة قيد المراجعة" | "موقع رسمياً";
  matterId?: string;
  mimeType?: string;
}

export interface FinancialRecord {
  id: string;
  clientId?: string;
  matterId?: string;
  clientName: string;
  matterCaseNumber: string;
  type: "دفعة أتعاب" | "أمانة خبير" | "رسوم قضائية" | "مصروفات إدارية" | "أتعاب نجاح مؤخرة";
  amount: number;
  currency?: string;
  direction?: "income" | "expense";
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
