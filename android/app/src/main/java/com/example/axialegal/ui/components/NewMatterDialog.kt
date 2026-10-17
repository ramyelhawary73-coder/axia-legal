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
import com.example.axialegal.model.Matter
import com.example.axialegal.ui.theme.AxiaGold
import com.example.axialegal.ui.theme.DarkSurface
import com.example.axialegal.ui.theme.DarkSurfaceElevated
import com.example.axialegal.ui.theme.TextPrimary
import com.example.axialegal.ui.theme.TextSecondary
import java.util.UUID

@Composable
fun NewMatterDialog(
    onDismiss: () -> Unit,
    onSaveMatter: (Matter) -> Unit,
    modifier: Modifier = Modifier
) {
    var caseNumber by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var court by remember { mutableStateOf("استئناف عالي") }
    var circuit by remember { mutableStateOf("الدائرة السادسة مدني واستثماري") }
    var clientName by remember { mutableStateOf("") }
    var opponentName by remember { mutableStateOf("") }
    var agreedFees by remember { mutableStateOf("١٥٠,٠٠٠ ج.م") }
    var paidFees by remember { mutableStateOf("٥٠,٠٠٠ ج.م") }
    var nextHearingGoal by remember { mutableStateOf("إيداع الصحيفة وإعلان الخصوم") }

    val courts = listOf("محكمة النقض", "المحكمة الاقتصادية", "مجلس الدولة (القضاء الإداري)", "استئناف عالي", "ابتدائية كلي")

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f)
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
                        text = "قيد قضية جديدة في السجل القضائي",
                        style = MaterialTheme.typography.titleMedium,
                        color = AxiaGold
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.testTag("close_new_matter_btn")) {
                        Icon(Icons.Default.Close, contentDescription = "إلغاء", tint = TextSecondary)
                    }
                }

                OutlinedTextField(
                    value = caseNumber,
                    onValueChange = { caseNumber = it },
                    label = { Text("رقم الدعوى / القضية والقيد", color = TextSecondary) },
                    placeholder = { Text("مثال: ٥٢٠ لسنة ٢٠٢٦ تجاري كلي", color = TextSecondary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("matter_case_number_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("موضوع الدعوى والطلبات الختامية", color = TextSecondary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("matter_title_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Text(text = "جهة القضاء والمحكمة المختصة", style = MaterialTheme.typography.labelMedium, color = AxiaGold)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    courts.take(3).forEach { c ->
                        FilterChip(
                            selected = court == c,
                            onClick = { court = c },
                            label = { Text(c, style = MaterialTheme.typography.bodySmall) }
                        )
                    }
                }

                OutlinedTextField(
                    value = circuit,
                    onValueChange = { circuit = it },
                    label = { Text("الدائرة القضائية المختصة", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                OutlinedTextField(
                    value = clientName,
                    onValueChange = { clientName = it },
                    label = { Text("اسم الموكل (الطالب)", color = TextSecondary) },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("matter_client_input"),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                OutlinedTextField(
                    value = opponentName,
                    onValueChange = { opponentName = it },
                    label = { Text("اسم الخصم (المعلن إليه)", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = agreedFees,
                        onValueChange = { agreedFees = it },
                        label = { Text("الأتعاب المتفق عليها", color = TextSecondary) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AxiaGold,
                            unfocusedBorderColor = DarkSurfaceElevated,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = paidFees,
                        onValueChange = { paidFees = it },
                        label = { Text("المسدد منها", color = TextSecondary) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AxiaGold,
                            unfocusedBorderColor = DarkSurfaceElevated,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                }

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = {
                        if (caseNumber.isNotBlank() && title.isNotBlank() && clientName.isNotBlank()) {
                            onSaveMatter(
                                Matter(
                                    id = "MAT-${UUID.randomUUID().toString().take(6).uppercase()}",
                                    caseNumber = caseNumber,
                                    year = 2026,
                                    court = court,
                                    circuit = circuit,
                                    title = title,
                                    clientName = clientName,
                                    opponentName = opponentName.ifBlank { "خصم غير معلن بعد" },
                                    assignedLawyer = "د. رامي الهواري",
                                    nextHearingDate = "2026-11-15",
                                    nextHearingGoal = nextHearingGoal,
                                    agreedFees = agreedFees,
                                    paidFees = paidFees
                                )
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("submit_new_matter_btn"),
                    colors = ButtonDefaults.buttonColors(containerColor = AxiaGold),
                    enabled = caseNumber.isNotBlank() && title.isNotBlank() && clientName.isNotBlank()
                ) {
                    Text("قيد وتثبيت ملف القضية", color = DarkSurface)
                }
            }
        }
    }
}
