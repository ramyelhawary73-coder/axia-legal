import crypto from "crypto";

// Map sequential IDs to stable UUIDs for validation safety
export const clientUuidMap: Record<string, string> = {
  "CLI-01": "00000000-0000-0000-0000-000000000001",
  "CLI-02": "00000000-0000-0000-0000-000000000002",
  "CLI-03": "00000000-0000-0000-0000-000000000003",
  "CLI-04": "00000000-0000-0000-0000-000000000004",
  "CLI-05": "00000000-0000-0000-0000-000000000005",
};

export const matterUuidMap: Record<string, string> = {
  "MAT-2025-001": "10000000-0000-0000-0000-000000000001",
  "MAT-2025-006": "10000000-0000-0000-0000-000000000002",
  "MAT-2024-010": "10000000-0000-0000-0000-000000000003",
  "MAT-2023-018": "10000000-0000-0000-0000-000000000004",
  "MAT-2025-002": "10000000-0000-0000-0000-000000000005",
  "MAT-2024-012": "10000000-0000-0000-0000-000000000006",
  "MAT-2023-021": "10000000-0000-0000-0000-000000000007",
  "MAT-2025-004": "10000000-0000-0000-0000-000000000008",
  "MAT-2023-015": "10000000-0000-0000-0000-000000000009",
  "MAT-2025-003": "10000000-0000-0000-0000-000000000010",
  "MAT-2024-005": "10000000-0000-0000-0000-000000000011",
  "MAT-2025-005": "10000000-0000-0000-0000-000000000012",
  "MAT-2024-022": "10000000-0000-0000-0000-000000000013",
};

// Global in-memory state on the Node.js server
const inMemoryClients: Record<string, unknown>[] = [
  {
    id: clientUuidMap["CLI-01"],
    organization_id: "mock-organization-id",
    name: "شركة النيل للمقاولات والتطوير العقاري ش.م.م",
    type: "company",
    national_id_or_cr: "س.ت: ٨٢٩٤٠١ - استثمار القاهرة",
    phone: "+20 100 123 4567",
    email: "legal@nilecontracting.eg",
    address: "١٤ شارع عبد الخالق ثروت، وسط البلد، القاهرة",
    notes: "الموكل الرئيسي لمشروعات التشييد العقاري.",
    status: "active",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
  },
  {
    id: clientUuidMap["CLI-02"],
    organization_id: "mock-organization-id",
    name: "مجموعة المنصور للاستيراد والتصدير",
    type: "company",
    national_id_or_cr: "س.ت: ٤١٩٣٣٢ - غرفة الجيزة",
    phone: "+20 111 889 9001",
    email: "ceo-office@mansour-group.com",
    address: "برج النيل الإداري، شارع مراد، الجيزة",
    notes: "نزاعات عقود الاستيراد وتأمين الحاويات البحرية.",
    status: "active",
    created_at: "2024-02-01T00:00:00Z",
    updated_at: "2024-02-01T00:00:00Z",
  },
  {
    id: clientUuidMap["CLI-03"],
    organization_id: "mock-organization-id",
    name: "الدكتور شريف عزت القاضي",
    type: "individual",
    national_id_or_cr: "ر.ق: ٢٧٢٠٥١٠٠١٠٤٩٢٨",
    phone: "+20 122 455 6789",
    email: "dr.sherif.elqadi@gmail.com",
    address: "٢٢ شارع الحجاز، مصر الجديدة، القاهرة",
    notes: "مالك عيادات الأطباء التخصصية بمصر الجديدة.",
    status: "active",
    created_at: "2024-03-01T00:00:00Z",
    updated_at: "2024-03-01T00:00:00Z",
  },
  {
    id: clientUuidMap["CLI-04"],
    organization_id: "mock-organization-id",
    name: "مصانع الأمل للدرفلة والصلب",
    type: "company",
    national_id_or_cr: "س.ت: ٩٩٢١١٠ - العاشر من رمضان",
    phone: "+20 106 777 3322",
    email: "contracts@alamal-steel.com",
    address: "المنطقة الصناعية الثالثة B4، العاشر من رمضان",
    notes: "منازعات التخصيص الصناعي وهيئة التنمية الصناعية.",
    status: "active",
    created_at: "2024-04-01T00:00:00Z",
    updated_at: "2024-04-01T00:00:00Z",
  },
  {
    id: clientUuidMap["CLI-05"],
    organization_id: "mock-organization-id",
    name: "السيدة فريدة عبد الحميد البستاني",
    type: "individual",
    national_id_or_cr: "ر.ق: ٢٨٥٠٨١٤٠١٠٣٣٤١",
    phone: "+20 109 234 5678",
    email: "farida.elbostani@outlook.com",
    address: "فيلا ٤ شارع دجلة، المعادي، القاهرة",
    notes: "نزاع الميراث وتجنب وبيع العقار بالمعادي.",
    status: "active",
    created_at: "2024-05-01T00:00:00Z",
    updated_at: "2024-05-01T00:00:00Z",
  },
];

const inMemoryMatters: Record<string, unknown>[] = [
  {
    id: matterUuidMap["MAT-2025-001"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-01"],
    case_number: "١٤٢٠ لسنة ٩٣ ق - نقض مدني",
    title: "طعن بالنقض في حكم بطلان شرط التحكيم والإلزام بالتعويض",
    court: "محكمة النقض",
    category: "مدني",
    status: "open",
    created_at: "2025-01-14T08:00:00Z",
    case_year: 2025,
    circuit: "دائرة المواد المدنية والتجارية الأولى",
    stage: "cassation",
    client_role: "طاعن",
    filing_date: "2025-01-14",
    claim_amount: 4850000,
    currency: "EGP",
    notes: "تم إيداع مذكرة الرد على تقرير نيابة النقض التي أوصت برفض الطعن، وتفنيد أسباب البطلان.",
    closed_at: null,
  },
  {
    id: matterUuidMap["MAT-2025-006"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-01"],
    case_number: "١١٥ لسنة ٢٠٢٥ تجاري استئناف القاهرة",
    title: "دعوى استرداد وتسييل خطاب ضمان بنكي مقاولة مشروع العاصمة الإدارية",
    court: "استئناف عالي",
    category: "تجاري",
    status: "open",
    created_at: "2025-03-10T08:00:00Z",
    case_year: 2025,
    circuit: "الدائرة السابعة استثماري وتجاري",
    stage: "appeal",
    client_role: "مدعي",
    filing_date: "2025-03-10",
    claim_amount: 6200000,
    currency: "EGP",
    notes: "تم إيداع أصل محاضر الاستلام الابتدائي لموقع المشروع بطلب وقف التسييل.",
    closed_at: null,
  },
  {
    id: matterUuidMap["MAT-2024-010"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-01"],
    case_number: "٨٩٢ لسنة ٢٠٢٣ تجاري كلي جنوب القاهرة",
    title: "دعوى فسخ عقد مقاولة برج الياسمين والمطالبة بالشرط الجزائي والتعويض",
    court: "المحكمة الاقتصادية",
    category: "تجاري",
    status: "closed",
    created_at: "2023-04-18T08:00:00Z",
    case_year: 2023,
    circuit: "الدائرة الثانية استئناف اقتصادي",
    stage: "judgment_issued",
    client_role: "مدعي",
    filing_date: "2023-04-18",
    claim_amount: 10000000,
    currency: "EGP",
    notes: "تم استخراج الصيغة التنفيذية والإعلان بها، وتحصيل كامل المبلغ بموجب شيكات مصرفية مقبولة الدفع.",
    closed_at: "2024-11-20T14:00:00Z",
  },
  {
    id: matterUuidMap["MAT-2025-002"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-02"],
    case_number: "٣٨٢ لسنة ٢٠٢٥ تجاري كلي القاهرة",
    title: "دعوى منازعة شريك وتنفيذ عقد بيع أسهم وفسخ ملحق الشراكة",
    court: "المحكمة الاقتصادية",
    category: "تجاري",
    status: "open",
    created_at: "2025-02-20T08:00:00Z",
    case_year: 2025,
    circuit: "الدائرة الرابعة الابتدائية استثماري",
    stage: "documents_pending",
    client_role: "مدعي",
    filing_date: "2025-02-20",
    claim_amount: 12400000,
    currency: "EGP",
    notes: "يجب استلام تقرير الخبير الحسابي المودع ومناقشته في الدفوع المحاسبية.",
    closed_at: null,
  },
  {
    id: matterUuidMap["MAT-2025-004"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-03"],
    case_number: "٨١٩ لسنة ٢٠٢٤ مدني مستأنف الجيزة",
    title: "استئناف حكم تعويض عن الإخلال بعقد توريد معدات طبية",
    court: "استئناف عالي",
    category: "مدني",
    status: "open",
    created_at: "2024-05-18T08:00:00Z",
    case_year: 2024,
    circuit: "الدائرة ٩ مدني الجيزة الكلية",
    stage: "reserved_for_judgment",
    client_role: "مستأنف",
    filing_date: "2024-05-18",
    claim_amount: 2100000,
    currency: "EGP",
    notes: "محجوزة للحكم بجلسة اليوم مع التصريح بتقديم مذكرات ختامية.",
    closed_at: null,
  },
  {
    id: matterUuidMap["MAT-2025-003"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-04"],
    case_number: "٢٩١١ لسنة ٧١ ق - قضاء إداري",
    title: "وقف تنفيذ وإلغاء قرار سحب تخصيص قطعة أرض صناعية بالعاشر من رمضان",
    court: "مجلس الدولة (القضاء الإداري)",
    category: "إداري",
    status: "open",
    created_at: "2025-01-20T08:00:00Z",
    case_year: 2025,
    circuit: "الدائرة الثانية منازعات تراخيص وعقود إدارية",
    stage: "active",
    client_role: "مدعي",
    filing_date: "2025-01-20",
    claim_amount: 0,
    currency: "EGP",
    notes: "تم إرفاق شهادات الجدية وسداد أقساط الأرض وتراخيص البناء للرد على دفع الجهة الإدارية.",
    closed_at: null,
  },
  {
    id: matterUuidMap["MAT-2025-005"],
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-05"],
    case_number: "٤٥٠١ لسنة ٢٠٢٥ مدني كلي شمال القاهرة",
    title: "دعوى صحة ونفاذ عقد بيع عقار سكني والتسليم",
    court: "ابتدائية كلي",
    category: "مدني",
    status: "open",
    created_at: "2025-02-12T08:00:00Z",
    case_year: 2025,
    circuit: "الدائرة ١١ مدني كلي العباسية",
    stage: "active",
    client_role: "مدعي",
    filing_date: "2025-02-12",
    claim_amount: 8500000,
    currency: "EGP",
    notes: "تم تقديم صحيفة الدعوى وقيدها وإخطار مصلحة الشهر العقاري بنسخة مطابقة.",
    closed_at: null,
  },
];

const inMemoryHearings: Record<string, unknown>[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-004"],
    hearing_date: "2026-09-15",
    hearing_time: "09:30 ص",
    court: "مجمع محاكم تاج الدول - استئناف الجيزة",
    circuit: "الدائرة ٩ مدني",
    hall: "قاعة ٤ - الدور الثاني",
    roll_number: "7",
    purpose: "المرافعة الشفوية الختامية وطلب حجز الدعوى للحكم",
    last_decision: "تأجيل للمرافعة وإلزام المستأنف ضده بالمستندات",
    attending_user_id: "mock-user-id",
    status: "scheduled",
    pleading_notes: "تم تحضير المرافعة وإيداع المستندات.",
    is_archived: false,
    created_at: "2026-09-01T09:00:00Z",
    updated_at: "2026-09-01T09:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-002"],
    hearing_date: "2026-09-16",
    hearing_time: "10:00 ص",
    court: "المحكمة الاقتصادية بالمعادي",
    circuit: "الدائرة الرابعة الابتدائية",
    hall: "قاعة ب - الدور الأرضي",
    roll_number: "15",
    purpose: "تقديم أصل الصحيفة معلنة وسداد أمانة الخبير",
    last_decision: "تأجيل لإعادة الإعلان وسداد ٥٠٠٠ ج أمانة خبير",
    attending_user_id: "mock-user-id",
    status: "scheduled",
    pleading_notes: "يجب إيداع الوصل ومطالبة السكرتارية بالملف.",
    is_archived: false,
    created_at: "2026-09-02T09:00:00Z",
    updated_at: "2026-09-02T09:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-003"],
    hearing_date: "2026-09-18",
    hearing_time: "11:00 ص",
    court: "مجلس الدولة - الدقي (شارع مراد)",
    circuit: "الدائرة الثانية عقود وتراخيص",
    hall: "قاعة المستشار عبد الرازق السنهوري",
    roll_number: "22",
    purpose: "الرد على مذكرة هيئة قضايا الدولة وطلب وقف القرار فورياً",
    last_decision: "التأجيل للاطلاع والمستندات من قضايا الدولة",
    attending_user_id: "mock-user-id",
    status: "scheduled",
    pleading_notes: "تحتاج لمتابعة دقيقة مع هيئة قضايا الدولة.",
    is_archived: false,
    created_at: "2026-09-03T09:00:00Z",
    updated_at: "2026-09-03T09:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000104",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-001"],
    hearing_date: "2026-09-22",
    hearing_time: "10:30 ص",
    court: "دار القضاء العالي - محكمة النقض",
    circuit: "دائرة المواد المدنية الأولى",
    hall: "قاعة الجلسات الكبرى - الدور الأول",
    roll_number: "5",
    purpose: "حجز الطعن للنطق بالحكم في مذكرات الدفوع الجوهرية",
    last_decision: "التأجيل لإيداع مذكرات الرد على نيابة النقض",
    attending_user_id: "mock-user-id",
    status: "scheduled",
    pleading_notes: "سيتم الحضور والتقرير بالحجز للحكم.",
    is_archived: false,
    created_at: "2026-09-04T09:00:00Z",
    updated_at: "2026-09-04T09:00:00Z",
  },
];

const inMemoryTasks: Record<string, unknown>[] = [
  {
    id: "00000000-0000-0000-0000-000000000201",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-002"],
    title: "ميعاد سقوط استئناف فرعي - سداد الرسم وإيداع العريضة قلم كتاب استئناف القاهرة",
    category: "ميعاد طعن قانوني",
    court_or_office: "قلم كتاب استئناف عالي القاهرة - دار القضاء العالي",
    assigned_to: "mock-user-id",
    deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
    priority: "critical",
    status: "in_progress",
    created_by: "mock-user-id",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000202",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-002"],
    title: "إعلان صحيفة إعادة إعلان بالطلبات العارضة وتسليمها للمحضرين بالمعادي",
    category: "قلم المحضرين",
    court_or_office: "قلم محضرين المعادي ومحكمة البساتين",
    assigned_to: "mock-user-id",
    deadline: new Date(Date.now() + 11 * 3600 * 1000).toISOString(),
    priority: "urgent",
    status: "in_progress",
    created_by: "mock-user-id",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000203",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-002"],
    title: "سداد أمانة الخبير الحسابي بقيمة ٥٠٠٠ ج بخزينة المحكمة الاقتصادية",
    category: "سداد رسوم",
    court_or_office: "خزينة المحكمة الاقتصادية بالمعادي",
    assigned_to: "mock-user-id",
    deadline: new Date(Date.now() + 19 * 3600 * 1000).toISOString(),
    priority: "urgent",
    status: "in_progress",
    created_by: "mock-user-id",
    created_at: new Date().toISOString(),
  },
  {
    id: "00000000-0000-0000-0000-000000000204",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-001"],
    title: "صياغة مذكرة الرد النهائية للطعن بالنقض وتسليمها لرئيس الدائرة",
    category: "إيداع مذكرات",
    court_or_office: "جدول محكمة النقض - دار القضاء العالي",
    assigned_to: "mock-user-id",
    deadline: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    priority: "critical",
    status: "in_progress",
    created_by: "mock-user-id",
    created_at: new Date().toISOString(),
  },
];

const inMemoryFinancials: Record<string, unknown>[] = [
  {
    id: "00000000-0000-0000-0000-000000000301",
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-01"],
    matter_id: matterUuidMap["MAT-2025-001"],
    record_type: "fee_payment",
    direction: "income",
    amount: 100000,
    currency: "EGP",
    status: "completed",
    due_date: "2026-09-01",
    occurred_at: "2026-09-01T12:00:00Z",
    receipt_number: "REC-2026-881",
    notes: "دفعة مقدم الأتعاب للطعن بالنقض.",
    created_by: "mock-user-id",
    created_at: "2026-09-01T12:00:00Z",
    updated_at: "2026-09-01T12:00:00Z",
  },
  {
    id: "00000000-0000-0000-0000-000000000302",
    organization_id: "mock-organization-id",
    client_id: clientUuidMap["CLI-02"],
    matter_id: matterUuidMap["MAT-2025-002"],
    record_type: "expert_deposit",
    direction: "expense",
    amount: 5000,
    currency: "EGP",
    status: "pending",
    due_date: "2026-09-14",
    occurred_at: null,
    receipt_number: "ADV-2026-042",
    notes: "سداد أمانة الخبير بخزينة المحكمة الاقتصادية.",
    created_by: "mock-user-id",
    created_at: "2026-09-10T12:00:00Z",
    updated_at: "2026-09-10T12:00:00Z",
  },
];

const inMemoryDocuments: Record<string, unknown>[] = [
  {
    id: "00000000-0000-0000-0000-000000000401",
    organization_id: "mock-organization-id",
    matter_id: matterUuidMap["MAT-2025-001"],
    title: "مذكرة الرد على تقرير نيابة النقض ودفاع الطاعن بالبطلان الجوهري",
    file_name: "مذكرة_دفاع_نقض_النيل.pdf",
    storage_path: "documents/مذكرة_دفاع_نقض_النيل.pdf",
    content_hash: "hash12345678",
    file_size: 2516582, // 2.4 MB
    file_type: "application/pdf",
    created_by: "mock-user-id",
    created_at: "2026-09-10T14:30:00Z",
    updated_at: "2026-09-10T14:30:00Z",
  },
];

const inMemoryOrgMembers: Record<string, unknown>[] = [
  {
    organization_id: "mock-organization-id",
    user_id: "mock-user-id",
    role: "owner",
    created_at: "2024-01-01T00:00:00Z",
  },
];

const inMemoryProfiles: Record<string, unknown>[] = [
  {
    id: "mock-user-id",
    full_name: "د. رامي الهواري",
    created_at: "2024-01-01T00:00:00Z",
  },
];

// Helper to access and modify database collections
const tables: Record<string, Record<string, unknown>[]> = {
  clients: inMemoryClients,
  matters: inMemoryMatters,
  hearings: inMemoryHearings,
  tasks: inMemoryTasks,
  financial_records: inMemoryFinancials,
  documents: inMemoryDocuments,
  organization_members: inMemoryOrgMembers,
  profiles: inMemoryProfiles,
};

// Chainable mock builder to simulate Supabase queries in-memory
export class MockQueryBuilder {
  private tableName: string;
  private filters: { type: string; column: string; value: unknown; values?: unknown[] }[] = [];
  private orderings: { column: string; ascending: boolean }[] = [];
  private isSingle: boolean = false;
  private isMaybeSingle: boolean = false;
  private insertData: unknown = null;
  private updateData: Record<string, unknown> | null = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.filters.push({ type: "eq", column, value });
    return this;
  }

  in(column: string, values: unknown[]) {
    this.filters.push({ type: "in", column, value: null, values });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderings.push({ column, ascending: options?.ascending !== false });
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: unknown) {
    this.insertData = data;
    return this;
  }

  update(data: Record<string, unknown>) {
    this.updateData = data;
    return this;
  }

  // Support thenable/Promise pattern so users can await the chain
  async then(
    resolve: (value: { data: unknown; error: unknown }) => void,
    reject?: (reason: unknown) => void,
  ) {
    try {
      const result = await this.execute();
      return resolve(result);
    } catch (err) {
      if (reject) return reject(err);
      throw err;
    }
  }

  private async execute() {
    const list = tables[this.tableName];
    if (!list) {
      return { data: null, error: { message: `Table ${this.tableName} not found in Mock DB` } };
    }

    if (this.insertData) {
      const itemsToInsert = Array.isArray(this.insertData) ? this.insertData : [this.insertData];
      const insertedRows: Record<string, unknown>[] = [];

      for (const item of itemsToInsert) {
        const newRow = {
          id: (item as { id?: string })?.id || crypto.randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...(item as Record<string, unknown>),
        };
        list.push(newRow);
        insertedRows.push(newRow);
      }

      const returned = Array.isArray(this.insertData) ? insertedRows : insertedRows[0];
      return { data: returned, error: null };
    }

    if (this.updateData) {
      // Find matching items to update
      const matches = list.filter((item) => {
        return this.filters.every((filter) => {
          if (filter.type === "eq") {
            return item[filter.column] === filter.value;
          }
          if (filter.type === "in" && filter.values) {
            return filter.values.includes(item[filter.column]);
          }
          return true;
        });
      });

      for (const match of matches) {
        Object.assign(match, {
          ...this.updateData,
          updated_at: new Date().toISOString(),
        });
      }

      const returned = this.isSingle || this.isMaybeSingle ? (matches[0] || null) : matches;
      return { data: returned, error: null };
    }

    // Default SELECT operation
    const matches = list.filter((item) => {
      return this.filters.every((filter) => {
        if (filter.type === "eq") {
          return item[filter.column] === filter.value;
        }
        if (filter.type === "in" && filter.values) {
          return filter.values.includes(item[filter.column]);
        }
        return true;
      });
    });

    // Apply sorting
    for (const ord of this.orderings) {
      matches.sort((a, b) => {
        const valA = a[ord.column];
        const valB = b[ord.column];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (ord.ascending) {
          return String(valA) > String(valB) ? 1 : -1;
        } else {
          return String(valA) < String(valB) ? 1 : -1;
        }
      });
    }

    if (this.isSingle) {
      if (matches.length === 0) {
        return { data: null, error: { message: "Item not found" } };
      }
      return { data: matches[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: matches[0] || null, error: null };
    }

    return { data: matches, error: null };
  }
}

// Complete mock client
export class MockSupabaseClient {
  from(tableName: string) {
    return new MockQueryBuilder(tableName);
  }

  auth = {
    async getClaims() {
      return {
        data: {
          claims: {
            sub: "mock-user-id",
            email: "staff.demo@example.invalid",
            full_name: "موظف تجريبي",
          },
        },
        error: null,
      };
    },
    async signInWithPassword() {
      return { data: { user: {} }, error: null };
    },
    async signOut() {
      return { error: null };
    },
  };
}

export function createMockSupabaseServerClient() {
  return new MockSupabaseClient();
}
