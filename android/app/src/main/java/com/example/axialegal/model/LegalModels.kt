package com.example.axialegal.model

data class Matter(
    val id: String = "",
    val caseNumber: String,
    val year: Int,
    val court: String,
    val category: String = "مدني",
    val circuit: String,
    val title: String,
    val clientName: String,
    val clientId: String? = null,
    val clientRole: String = "مدعي",
    val opponentName: String,
    val opponentLawyer: String? = null,
    val assignedLawyer: String,
    val nextHearingDate: String,
    val nextHearingGoal: String,
    val stage: String = "متداولة",
    val claimAmount: String? = null,
    val agreedFees: String,
    val paidFees: String,
    val notes: String? = null,
    val status: String = "مفتوحة",
    val filingDate: String? = null,
    val verdictDate: String? = null,
    val verdict: String? = null,
    val verdictResult: String? = null,
    val executionStatus: String? = null,
    val finalAwardAmount: String? = null
)

data class Hearing(
    val id: String,
    val matterId: String,
    val caseNumber: String,
    val court: String,
    val circuit: String,
    val hall: String,
    val rollNumber: Int,
    val hearingDate: String, // YYYY-MM-DD
    val hearingTime: String,
    val attendingLawyer: String,
    val purpose: String,
    val lastDecision: String? = null,
    val status: String = "قادمة", // "اليوم", "قادمة", "منتهية", "مؤجلة"
    val pleadingNotes: String? = null
)

data class Client(
    val id: String,
    val name: String,
    val type: String, // "شركة / مؤسسة" | "فرد / شخص طبيعي"
    val nationalIdOrCr: String,
    val phone: String,
    val email: String,
    val poaNumber: String,
    val poaOffice: String,
    val poaExpiry: String,
    val activeMattersCount: Int,
    val totalPaid: String,
    val balanceDue: String,
    val address: String
)

data class LegalTask(
    val id: String,
    val title: String,
    val category: String, // "قلم المحضرين" | "سداد رسوم" | "إيداع مذكرات" | "ميعاد طعن قانوني" | "استخراج شهادة"
    val matterCaseNumber: String? = null,
    val courtOrBailiffOffice: String,
    val assignedTo: String,
    val deadline: String,
    val priority: String, // "حرجة للغاية (ميعاد سقوط)" | "عاجلة" | "عادية"
    val status: String = "قيد التنفيذ" // "قيد التنفيذ" | "مكتملة"
)

data class LegalDocument(
    val id: String,
    val title: String,
    val type: String,
    val caseNumber: String? = null,
    val clientName: String,
    val date: String,
    val fileSize: String,
    val status: String // "نهائي معتمد" | "مسودة قيد المراجعة" | "موقع رسمياً"
)

data class FinancialRecord(
    val id: String,
    val clientName: String,
    val matterCaseNumber: String,
    val type: String, // "دفعة أتعاب" | "أمانة خبير" | "رسوم قضائية" | "أتعاب نجاح مؤخرة"
    val amount: Long,
    val date: String,
    val status: String, // "محصلة" | "مستحقة" | "مسددة للمحكمة"
    val receiptNumber: String,
    val isIncome: Boolean = true
)

data class PrecedentArticle(
    val id: String,
    val court: String,
    val ruleNumber: String,
    val date: String,
    val circuit: String,
    val principle: String,
    val legalArticles: List<String>
)

data class LegalTemplate(
    val id: String,
    val title: String,
    val subtitle: String,
    val category: String,
    val governingLaw: String,
    val description: String,
    val badge: String,
    val templateBody: String
)

data class TeamMember(
    val id: String,
    val name: String,
    val role: String,
    val specialty: String,
    val experience: String,
    val casesCount: Int,
    val avatarInitials: String
)

enum class NavTab(val titleAr: String) {
    OVERVIEW("الرئيسية"),
    MATTERS("سجل القضايا"),
    HEARINGS("رول الجلسات"),
    CLIENTS("الموكلون"),
    TASKS("المحضرين والمهام"),
    DOCUMENTS("خزينة المستندات"),
    FINANCE("المالية والأتعاب"),
    RAJIH_AI("مستشار راجح AI"),
    TEMPLATES("صيغ العقود"),
    TEAM("فريق العمل")
}
