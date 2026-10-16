package com.example.axialegal.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Event
import androidx.compose.material.icons.filled.Gavel
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.Hearing
import com.example.axialegal.ui.theme.*

@Composable
fun HearingsScreen(
    hearings: List<Hearing>,
    onOpenNewHearing: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("الكل") }
    val filters = listOf("الكل", "اليوم", "قادمة")

    val filteredHearings = remember(hearings, selectedFilter) {
        when (selectedFilter) {
            "اليوم" -> hearings.filter { it.status == "اليوم" }
            "قادمة" -> hearings.filter { it.status == "قادمة" }
            else -> hearings
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "رول الجلسات والتقويم القضائي",
                    style = MaterialTheme.typography.titleMedium,
                    color = AxiaGold
                )
                Text(
                    text = "تتبع يومي لأرقام الرول وقاعات المحاكم والقرارات",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
            Button(
                onClick = onOpenNewHearing,
                colors = ButtonDefaults.buttonColors(containerColor = AxiaGold),
                modifier = Modifier.testTag("add_hearing_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = DarkBackground, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("جدولة رول", color = DarkBackground)
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            filters.forEach { f ->
                FilterChip(
                    selected = selectedFilter == f,
                    onClick = { selectedFilter = f },
                    label = { Text(f, style = MaterialTheme.typography.bodySmall) }
                )
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filteredHearings) { hearing ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("hearing_card_${hearing.id}"),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
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
                            Badge(
                                containerColor = if (hearing.status == "اليوم") AlertRed else CourtBlue
                            ) {
                                Text(
                                    text = "رول ${hearing.rollNumber} · ${hearing.status}",
                                    color = TextPrimary
                                )
                            }
                        }

                        Text(
                            text = "${hearing.court} · ${hearing.circuit}",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextPrimary
                        )

                        Text(
                            text = "القاعة: ${hearing.hall} · الموعد: ${hearing.hearingDate} (${hearing.hearingTime})",
                            style = MaterialTheme.typography.bodySmall,
                            color = WarningAmber
                        )

                        Text(
                            text = "المطلوب بالجلسة: ${hearing.purpose}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )

                        hearing.lastDecision?.let { dec ->
                            Text(
                                text = "القرار السابق: $dec",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextTertiary
                            )
                        }

                        Divider(color = DarkSurfaceBorder, thickness = 0.5.dp)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "المحامي الحاضر: ${hearing.attendingLawyer}",
                                style = MaterialTheme.typography.bodySmall,
                                color = AxiaGoldLight
                            )
                        }
                    }
                }
            }
        }
    }
}
