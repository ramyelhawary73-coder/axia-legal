package com.example.axialegal.viewmodel

import androidx.lifecycle.ViewModel
import com.example.axialegal.model.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update

data class AxiaUiState(
    val currentTab: NavTab = NavTab.OVERVIEW,
    val matters: List<Matter> = MockLegalDataSource.matters,
    val hearings: List<Hearing> = MockLegalDataSource.hearings,
    val clients: List<Client> = MockLegalDataSource.clients,
    val tasks: List<LegalTask> = MockLegalDataSource.tasks,
    val documents: List<LegalDocument> = MockLegalDataSource.documents,
    val finances: List<FinancialRecord> = MockLegalDataSource.finances,
    val templates: List<LegalTemplate> = MockLegalDataSource.templates,
    val team: List<TeamMember> = MockLegalDataSource.team,
    val selectedMatter: Matter? = null,
    val searchQuery: String = "",
    val isSearchOpen: Boolean = false,
    val isNewTaskOpen: Boolean = false,
    val isNewMatterOpen: Boolean = false,
    val isNewHearingOpen: Boolean = false,
    val rajihScenarioResult: String? = null,
    val isRajihLoading: Boolean = false,
    val lastSyncNotice: String? = null
)

class AxiaLegalViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(AxiaUiState())
    val uiState: StateFlow<AxiaUiState> = _uiState.asStateFlow()

    fun selectTab(tab: NavTab) {
        _uiState.update { it.copy(currentTab = tab, selectedMatter = null) }
    }

    fun openMatterDetail(matter: Matter) {
        _uiState.update { it.copy(selectedMatter = matter) }
    }

    fun closeMatterDetail() {
        _uiState.update { it.copy(selectedMatter = null) }
    }

    fun setSearchOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isSearchOpen = isOpen) }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun setNewTaskOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isNewTaskOpen = isOpen) }
    }

    fun setNewMatterOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isNewMatterOpen = isOpen) }
    }

    fun setNewHearingOpen(isOpen: Boolean) {
        _uiState.update { it.copy(isNewHearingOpen = isOpen) }
    }

    fun toggleTaskStatus(taskId: String) {
        _uiState.update { state ->
            val updated = state.tasks.map { task ->
                if (task.id == taskId) {
                    val nextStatus = if (task.status == "مكتملة") "قيد التنفيذ" else "مكتملة"
                    task.copy(status = nextStatus)
                } else task
            }
            state.copy(tasks = updated, lastSyncNotice = "تم تحديث حالة المهمة")
        }
    }

    fun addTask(task: LegalTask) {
        _uiState.update { state ->
            state.copy(
                tasks = listOf(task) + state.tasks,
                isNewTaskOpen = false,
                lastSyncNotice = "تم حفظ المهمة بنجاح"
            )
        }
    }

    fun addMatter(matter: Matter) {
        _uiState.update { state ->
            state.copy(
                matters = listOf(matter) + state.matters,
                isNewMatterOpen = false,
                lastSyncNotice = "تم قيد ملف القضية بنجاح"
            )
        }
    }

    fun addHearing(hearing: Hearing) {
        _uiState.update { state ->
            state.copy(
                hearings = listOf(hearing) + state.hearings,
                isNewHearingOpen = false,
                lastSyncNotice = "تم جدولة الجلسة بنجاح"
            )
        }
    }

    fun askRajih(query: String) {
        _uiState.update { it.copy(isRajihLoading = true, rajihScenarioResult = null) }
        val response = when {
            query.contains("تحكيم") || query.contains("بطلان") -> {
                """
الخلاصة القانونية:
الاتفاق على التحكيم هو عمل من أعمال التصرف التي تستلزم وكالة خاصة أو تفويضاً صريحاً طبقاً للمادة (٧٠٢/١) من القانون المدني والمادة (١٠) من قانون التحكيم ٢٧ لسنة ١٩٩٤. إذا وقّع العقد من لا يملك هذا التفويض وقع شرط التحكيم باطلاً بطلاناً متعلقاً بولاية المحاكم.

الأساس القضائي والتشريعي:
- المادة (٧٠٢) مدني مصري.
- المواد (١٠، ١١، ٥٣) من قانون التحكيم المصري رقم ٢٧ لسنة ١٩٩٤.
- استقرار قضاء محكمة النقض (الطعن رقم ١٤٢٠ لسنة ٩٣ ق).

التوصية الإجرائية:
الدفع في صدر المذكرة الختامية بعدم اختصاص هيئة التحكيم وانعدام أثر شرط التحكيم، مع طلب ضم السجل التجاري لإثبات انتفاء الصفة وقت التوقيع.
                """.trimIndent()
            }
            query.contains("إيجار") || query.contains("امتداد") -> {
                """
الخلاصة القانونية:
عقود الإيجار المبرمة بعد نفاذ القانون رقم ٤ لسنة ١٩٩٦ تخضع لإرادة المتعاقدين والقانون المدني (المادتان ٥٥٨ و٥٦٣ مدني). عبارات التجديد التلقائي غير المقيدة بأجل محدد تجعل العقد منعقداً للفترة المحددة لدفع الأجرة فقط.

الأساس التشريعي:
- القانون رقم ٤ لسنة ١٩٩٦ بشأن سريان أحكام القانون المدني على الأماكن التي لم يسبق تأجيرها.
- المواد (٥٥٨، ٥٦٣) من القانون المدني المصري.

التوصية الإجرائية:
تعديل بند المدة ليكون محدداً بتاريخ قطعي غير قابل للتجديد إلا بموجب ملحق كتابي صريح، لتفادي النزاع حول الامتداد العرفي.
                """.trimIndent()
            }
            else -> {
                """
الخلاصة القانونية:
بناءً على نصوص التشريعات المصرية ذات الصلة وأحكام محكمة النقض ومجلس الدولة:
يجب توافر ركني الجدية والمصلحة المباشرة، ومراعاة المواعيد الحتمية المقررة بقانون المرافعات (المادة ٢١٥ وما بعدها).

الخطوة التالية الموصى بها:
إرفاق حافظة المستندات الدالة على صفة الخصم وسداد الرسوم القضائية المقررة بقلم كتاب المحكمة المختصة.
                """.trimIndent()
            }
        }
        _uiState.update { it.copy(isRajihLoading = false, rajihScenarioResult = response) }
    }
}
