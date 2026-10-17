package com.example.axialegal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.Matter
import com.example.axialegal.model.NavTab
import com.example.axialegal.ui.theme.*
import com.example.axialegal.viewmodel.AxiaUiState

@Composable
fun OverviewScreen(
    state: AxiaUiState,
    onNavigate: (NavTab) -> Unit,
    onOpenMatter: (Matter) -> Unit,
    onOpenNewTask: () -> Unit,
    onOpenNewMatter: () -> Unit,
    onToggleTask: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val activeMatters = state.matters.filter { it.status == "مفتوحة" }
    val criticalTasks = state.tasks.filter { it.status != "مكتملة" && it.priority.contains("حرجة") }
    val todayHearings = state.hearings.filter { it.status == "اليوم" }

    LazyColumn(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Firm Hero Banner with Brand Summary
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated),
                border = CardDefaults.outlinedCardBorder().copy(brush = androidx.compose.ui.graphics.SolidColor(DarkSurfaceBorder))
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = "مكتب د. رامي الهواري للمحاماة والاستشارات",
                                style = MaterialTheme.typography.titleMedium,
                                color = AxiaGold
                            )
                            Text(
                                text = "محامون بالنقض والدستورية العليا ومحكمون دوليون",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }
                        Box(
                            modifier = Modifier
                                .clip(CircleShape)
                                .background(AxiaGoldDim)
                                .padding(8.dp)
                        ) {
                            Icon(Icons.Default.Scale, contentDescription = null, tint = AxiaGold)
                        }
                    }

                    Divider(color = DarkSurfaceBorder, thickness = 0.5.dp)

                    // Quick Action Buttons
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Button(
                            onClick = onOpenNewMatter,
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .testTag("overview_new_matter_btn"),
                            colors = ButtonDefaults.buttonColors(containerColor = AxiaGold)
                        ) {
                            Icon(Icons.Default.Add, contentDescription = null, tint = DarkBackground, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("قيد قضية", color = DarkBackground, style = MaterialTheme.typography.bodySmall)
                        }

                        OutlinedButton(
                            onClick = onOpenNewTask,
                            modifier = Modifier
                                .weight(1f)
                                .height(42.dp)
                                .testTag("overview_new_task_btn"),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = AxiaGold)
                        ) {
                            Icon(Icons.Default.Assignment, contentDescription = null, tint = AxiaGold, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("مهمة محضرين", color = AxiaGold, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                }
            }
        }

        // Executive KPI Metrics Row
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                KpiCard(
                    title = "القضايا المتداولة",
                    count = activeMatters.size.toString(),
                    icon = Icons.Default.Gavel,
                    color = AxiaGold,
                    onClick = { onNavigate(NavTab.MATTERS) },
                    modifier = Modifier.weight(1f)
                )
                KpiCard(
                    title = "جلسات اليوم",
                    count = todayHearings.size.toString(),
                    icon = Icons.Default.Event,
                    color = CourtBlue,
                    onClick = { onNavigate(NavTab.HEARINGS) },
                    modifier = Modifier.weight(1f)
                )
                KpiCard(
                    title = "مواعيد السقوط",
                    count = criticalTasks.size.toString(),
                    icon = Icons.Default.Warning,
                    color = AlertRed,
                    onClick = { onNavigate(NavTab.TASKS) },
                    modifier = Modifier.weight(1f)
                )
            }
        }

        // Urgent Deadlines Banner (قلم المحضرين والمواعيد الحتمية)
        item {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onNavigate(NavTab.TASKS) },
                colors = CardDefaults.cardColors(containerColor = AlertRedDim)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(14.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(AlertRed),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(Icons.Default.PriorityHigh, contentDescription = null, tint = TextPrimary, modifier = Modifier.size(20.dp))
                    }
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "تنبيه مواعيد السقوط الإجرائية (${criticalTasks.size} مهام حتمية)",
                            style = MaterialTheme.typography.titleSmall,
                            color = AlertRed
                        )
                        Text(
                            text = "إيداع أسباب الطعن بالاستئناف وسداد الرسوم القضائية قبل غلق أقلام الكتاب اليوم.",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                    Icon(Icons.Default.ArrowBack, contentDescription = null, tint = AlertRed)
                }
            }
        }

        // Today's Court Roll Section (رول جلسات اليوم)
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "رول الجلسات العاجلة",
                    style = MaterialTheme.typography.titleMedium,
                    color = AxiaGold
                )
                TextButton(onClick = { onNavigate(NavTab.HEARINGS) }) {
                    Text("عرض كل الجلسات (${state.hearings.size})", color = AxiaGoldLight)
                }
            }
        }

        items(state.hearings.take(3)) { hearing ->
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = hearing.caseNumber,
                            style = MaterialTheme.typography.titleSmall,
                            color = AxiaGold
                        )
                        Badge(containerColor = if (hearing.status == "اليوم") AlertRed else CourtBlue) {
                            Text(hearing.status, color = TextPrimary)
                        }
                    }
                    Text(
                        text = "${hearing.court} · ${hearing.circuit} (${hearing.hall} · رول ${hearing.rollNumber})",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                    Text(
                        text = "المطلوب: ${hearing.purpose}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "المحامي الحاضر: ${hearing.attendingLawyer}",
                            style = MaterialTheme.typography.bodySmall,
                            color = AxiaGoldLight
                        )
                        Text(
                            text = "${hearing.hearingDate} · ${hearing.hearingTime}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                }
            }
        }

        // Active Matters Section
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "أحدث القضايا المفتوحة",
                    style = MaterialTheme.typography.titleMedium,
                    color = AxiaGold
                )
                TextButton(onClick = { onNavigate(NavTab.MATTERS) }) {
                    Text("سجل القضايا الكامل", color = AxiaGoldLight)
                }
            }
        }

        items(state.matters.take(3)) { matter ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onOpenMatter(matter) }
                    .testTag("overview_matter_${matter.id}"),
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = matter.caseNumber,
                            style = MaterialTheme.typography.titleSmall,
                            color = AxiaGold
                        )
                        Text(
                            text = matter.court,
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                    }
                    Text(
                        text = matter.title,
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextPrimary
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = "الموكل: ${matter.clientName}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )
                        Text(
                            text = "الجلسة: ${matter.nextHearingDate}",
                            style = MaterialTheme.typography.bodySmall,
                            color = WarningAmber
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun KpiCard(
    title: String,
    count: String,
    icon: ImageVector,
    color: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable { onClick() },
        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
            Text(text = count, style = MaterialTheme.typography.titleLarge, color = TextPrimary)
            Text(text = title, style = MaterialTheme.typography.labelSmall, color = TextSecondary)
        }
    }
}
