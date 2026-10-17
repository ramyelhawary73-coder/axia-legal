package com.example.axialegal.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.axialegal.model.LegalTask
import com.example.axialegal.ui.theme.AxiaGold
import com.example.axialegal.ui.theme.DarkSurface
import com.example.axialegal.ui.theme.DarkSurfaceElevated
import com.example.axialegal.ui.theme.TextPrimary
import com.example.axialegal.ui.theme.TextSecondary
import java.util.UUID

@Composable
fun NewTaskDialog(
    onDismiss: () -> Unit,
    onSaveTask: (LegalTask) -> Unit,
    modifier: Modifier = Modifier
) {
    var title by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("قلم المحضرين") }
    var courtOffice by remember { mutableStateOf("") }
    var caseNumber by remember { mutableStateOf("") }
    var assignedTo by remember { mutableStateOf("أ. مروان هاني") }
    var deadline by remember { mutableStateOf("اليوم ٠٢:٠٠ م") }
    var priority by remember { mutableStateOf("عاجلة") }

    val categories = listOf("قلم المحضرين", "سداد رسوم", "إيداع مذكرات", "ميعاد طعن قانوني", "استخراج شهادة")
    val priorities = listOf("حرجة للغاية (ميعاد سقوط)", "عاجلة", "عادية")

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = modifier
                .fillMaxWidth()
                .fillMaxHeight(0.85f)
                .clip(RoundedCornerShape(16.dp)),
            color = DarkSurface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "إضافة مهمة إجرائية / قلم المحضرين",
                        style = MaterialTheme.typography.titleMedium,
                        color = AxiaGold
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.testTag("close_new_task_btn")) {
                        Icon(Icons.Default.Close, contentDescription = "إلغاء", tint = TextSecondary)
                    }
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("بيان المهمة والإجراء القانوني المطلوبة", color = TextSecondary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("task_title_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Text(text = "التصنيف الإجرائي", style = MaterialTheme.typography.labelMedium, color = AxiaGold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    categories.take(3).forEach { cat ->
                        FilterChip(
                            selected = category == cat,
                            onClick = { category = cat },
                            label = { Text(cat, style = MaterialTheme.typography.bodySmall) }
                        )
                    }
                }

                OutlinedTextField(
                    value = courtOffice,
                    onValueChange = { courtOffice = it },
                    label = { Text("المحكمة / قلم المحضرين / الخزينة المختصة", color = TextSecondary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("task_office_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                OutlinedTextField(
                    value = caseNumber,
                    onValueChange = { caseNumber = it },
                    label = { Text("رقم القضية المرتبطة (اختياري)", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                OutlinedTextField(
                    value = deadline,
                    onValueChange = { deadline = it },
                    label = { Text("الموعد الحتمي للإنجاز", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Text(text = "درجة الأهمية / السقوط", style = MaterialTheme.typography.labelMedium, color = AxiaGold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    priorities.forEach { p ->
                        FilterChip(
                            selected = priority == p,
                            onClick = { priority = p },
                            label = { Text(p, style = MaterialTheme.typography.bodySmall) }
                        )
                    }
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = {
                        if (title.isNotBlank()) {
                            onSaveTask(
                                LegalTask(
                                    id = "TSK-${UUID.randomUUID().toString().take(6).uppercase()}",
                                    title = title,
                                    category = category,
                                    courtOrBailiffOffice = courtOffice.ifBlank { "قلم محضرين المحكمة المختصة" },
                                    matterCaseNumber = caseNumber.ifBlank { null },
                                    assignedTo = assignedTo,
                                    deadline = deadline,
                                    priority = priority
                                )
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("submit_new_task_btn"),
                    colors = ButtonDefaults.buttonColors(containerColor = AxiaGold),
                    enabled = title.isNotBlank()
                ) {
                    Text("حفظ المهمة في جدول الأعمال", color = DarkSurface)
                }
            }
        }
    }
}
