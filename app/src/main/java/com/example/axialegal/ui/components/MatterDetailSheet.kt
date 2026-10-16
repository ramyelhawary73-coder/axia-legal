package com.example.axialegal.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.axialegal.model.Matter
import com.example.axialegal.ui.theme.*

@Composable
fun MatterDetailSheet(
    matter: Matter,
    onDismiss: () -> Unit,
    onRequestAddHearing: (String) -> Unit,
    modifier: Modifier = Modifier
) {
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
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = matter.caseNumber,
                            style = MaterialTheme.typography.titleMedium,
                            color = AxiaGold
                        )
                        Text(
                            text = "${matter.court} · ${matter.circuit}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                    IconButton(onClick = onDismiss, modifier = Modifier.testTag("close_matter_detail_btn")) {
                        Icon(Icons.Default.Close, contentDescription = "إغلاق", tint = TextSecondary)
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(text = "موضوع النزاع القضائي", style = MaterialTheme.typography.labelSmall, color = AxiaGold)
                        Text(text = matter.title, style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        
                        Divider(color = DarkSurfaceBorder, thickness = 0.5.dp)

                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "الموكل: ${matter.clientName}", style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                            Text(text = "الصفة: ${matter.clientRole}", style = MaterialTheme.typography.bodySmall, color = AxiaGold)
                        }
                        Text(text = "الخصم: ${matter.opponentName}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        matter.opponentLawyer?.let {
                            Text(text = "محامي الخصم: $it", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                        }
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(text = "الجلسة القادمة والمطلوب فيها", style = MaterialTheme.typography.labelSmall, color = AxiaGold)
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                            Icon(Icons.Default.Schedule, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                            Text(text = matter.nextHearingDate, style = MaterialTheme.typography.titleSmall, color = WarningAmber)
                        }
                        Text(text = "المطلوب بالجلسة: ${matter.nextHearingGoal}", style = MaterialTheme.typography.bodyMedium, color = TextPrimary)
                        Text(text = "المحامي الحاضر: ${matter.assignedLawyer}", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                    }
                }

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(text = "الموقف المالي للأتعاب", style = MaterialTheme.typography.labelSmall, color = AxiaGold)
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "الأتعاب المتفق عليها:", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                            Text(text = matter.agreedFees, style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                        }
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(text = "المسدد حتى الآن:", style = MaterialTheme.typography.bodySmall, color = TextSecondary)
                            Text(text = matter.paidFees, style = MaterialTheme.typography.bodySmall, color = SuccessGreen)
                        }
                    }
                }

                matter.notes?.let { note ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(text = "ملاحظات الدفوع الختامية", style = MaterialTheme.typography.labelSmall, color = AxiaGold)
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(text = note, style = MaterialTheme.typography.bodySmall, color = TextPrimary)
                        }
                    }
                }

                Button(
                    onClick = {
                        onRequestAddHearing(matter.id)
                        onDismiss()
                    },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp)
                        .testTag("schedule_hearing_for_matter_btn"),
                    colors = ButtonDefaults.buttonColors(containerColor = AxiaGold)
                ) {
                    Icon(Icons.Default.Gavel, contentDescription = null, tint = DarkSurface, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("جدولة رول جلسة جديدة لهذه القضية", color = DarkSurface)
                }
            }
        }
    }
}
