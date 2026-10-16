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
import com.example.axialegal.model.Hearing
import com.example.axialegal.model.Matter
import com.example.axialegal.ui.theme.AxiaGold
import com.example.axialegal.ui.theme.DarkSurface
import com.example.axialegal.ui.theme.DarkSurfaceElevated
import com.example.axialegal.ui.theme.TextPrimary
import com.example.axialegal.ui.theme.TextSecondary
import java.util.UUID

@Composable
fun NewHearingDialog(
    matters: List<Matter>,
    onDismiss: () -> Unit,
    onSaveHearing: (Hearing) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedMatter by remember { mutableStateOf(matters.firstOrNull()) }
    var court by remember { mutableStateOf(selectedMatter?.court ?: "استئناف عالي الجيزة") }
    var circuit by remember { mutableStateOf(selectedMatter?.circuit ?: "الدائرة ٩ مدني") }
    var hall by remember { mutableStateOf("قاعة ٤ - الدور الثاني") }
    var rollNumberText by remember { mutableStateOf("١٢") }
    var hearingDate by remember { mutableStateOf("2026-10-24") }
    var hearingTime by remember { mutableStateOf("09:30 ص") }
    var attendingLawyer by remember { mutableStateOf("أ. خالد النمر") }
    var purpose by remember { mutableStateOf("تقديم المذكرات الختامية وحافظة المستندات") }

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
                        text = "جدولة جلسة ورول محكمة",
                        style = MaterialTheme.typography.titleMedium,
                        color = AxiaGold
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.testTag("close_new_hearing_btn")) {
                        Icon(Icons.Default.Close, contentDescription = "إلغاء", tint = TextSecondary)
                    }
                }

                Text(text = "القضية المرتبطة", style = MaterialTheme.typography.labelMedium, color = AxiaGold)
                matters.take(3).forEach { matter ->
                    FilterChip(
                        selected = selectedMatter?.id == matter.id,
                        onClick = {
                            selectedMatter = matter
                            court = matter.court
                            circuit = matter.circuit
                        },
                        label = { Text(matter.caseNumber, style = MaterialTheme.typography.bodySmall) }
                    )
                }

                OutlinedTextField(
                    value = court,
                    onValueChange = { court = it },
                    label = { Text("المحكمة", color = TextSecondary) },
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
                        value = hall,
                        onValueChange = { hall = it },
                        label = { Text("القاعة / الدور", color = TextSecondary) },
                        modifier = Modifier.weight(1.5f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AxiaGold,
                            unfocusedBorderColor = DarkSurfaceElevated,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = rollNumberText,
                        onValueChange = { rollNumberText = it },
                        label = { Text("رقم الرول", color = TextSecondary) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AxiaGold,
                            unfocusedBorderColor = DarkSurfaceElevated,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = hearingDate,
                        onValueChange = { hearingDate = it },
                        label = { Text("تاريخ الجلسة", color = TextSecondary) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AxiaGold,
                            unfocusedBorderColor = DarkSurfaceElevated,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                    OutlinedTextField(
                        value = hearingTime,
                        onValueChange = { hearingTime = it },
                        label = { Text("الموعد", color = TextSecondary) },
                        modifier = Modifier.weight(1f),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AxiaGold,
                            unfocusedBorderColor = DarkSurfaceElevated,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        )
                    )
                }

                OutlinedTextField(
                    value = purpose,
                    onValueChange = { purpose = it },
                    label = { Text("المطلوب بالجلسة (القرار السابق والمرافعة)", color = TextSecondary) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    )
                )

                Spacer(modifier = Modifier.height(10.dp))

                Button(
                    onClick = {
                        val m = selectedMatter ?: matters.firstOrNull()
                        if (m != null) {
                            onSaveHearing(
                                Hearing(
                                    id = "HR-${UUID.randomUUID().toString().take(6).uppercase()}",
                                    matterId = m.id,
                                    caseNumber = m.caseNumber,
                                    court = court,
                                    circuit = circuit,
                                    hall = hall,
                                    rollNumber = rollNumberText.toIntOrNull() ?: 1,
                                    hearingDate = hearingDate,
                                    hearingTime = hearingTime,
                                    attendingLawyer = attendingLawyer,
                                    purpose = purpose
                                )
                            )
                        }
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("submit_new_hearing_btn"),
                    colors = ButtonDefaults.buttonColors(containerColor = AxiaGold)
                ) {
                    Text("إدراج الجلسة في رول المحكمة", color = DarkSurface)
                }
            }
        }
    }
}
