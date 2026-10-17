package com.example.axialegal.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.Matter
import com.example.axialegal.ui.theme.*

@Composable
fun MattersScreen(
    matters: List<Matter>,
    onOpenMatter: (Matter) -> Unit,
    onOpenNewMatter: () -> Unit,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCourtFilter by remember { mutableStateOf<String?>(null) }

    val courtFilters = listOf("الكل", "محكمة النقض", "المحكمة الاقتصادية", "مجلس الدولة (القضاء الإداري)", "استئناف عالي", "ابتدائية كلي")

    val filteredMatters = remember(matters, searchQuery, selectedCourtFilter) {
        matters.filter { matter ->
            val matchesSearch = searchQuery.isBlank() ||
                matter.caseNumber.contains(searchQuery, ignoreCase = true) ||
                matter.title.contains(searchQuery, ignoreCase = true) ||
                matter.clientName.contains(searchQuery, ignoreCase = true)

            val matchesCourt = selectedCourtFilter == null || selectedCourtFilter == "الكل" ||
                matter.court == selectedCourtFilter

            matchesSearch && matchesCourt
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        // Top Bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = "سجل القضايا والملفات القضائية",
                    style = MaterialTheme.typography.titleMedium,
                    color = AxiaGold
                )
                Text(
                    text = "إجمالي الملفات المقيدة: ${matters.size} قضية",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
            Button(
                onClick = onOpenNewMatter,
                colors = ButtonDefaults.buttonColors(containerColor = AxiaGold),
                modifier = Modifier.testTag("add_matter_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = DarkBackground, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("قيد قضية", color = DarkBackground)
            }
        }

        // Search Input
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            placeholder = { Text("بحث برقم الدعوى، اسم الموكل، أو موضوع النزاع…", color = TextSecondary) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = AxiaGold) },
            modifier = Modifier
                .fillMaxWidth()
                .testTag("matters_search_field"),
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = AxiaGold,
                unfocusedBorderColor = DarkSurfaceElevated,
                focusedTextColor = TextPrimary,
                unfocusedTextColor = TextPrimary
            ),
            singleLine = true
        )

        // Court Filters
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(courtFilters) { court ->
                val isSelected = (court == "الكل" && selectedCourtFilter == null) || selectedCourtFilter == court
                FilterChip(
                    selected = isSelected,
                    onClick = {
                        selectedCourtFilter = if (court == "الكل") null else court
                    },
                    label = { Text(court, style = MaterialTheme.typography.bodySmall) }
                )
            }
        }

        // Matters List
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(filteredMatters) { matter ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onOpenMatter(matter) }
                        .testTag("matter_card_${matter.id}"),
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
                                text = matter.caseNumber,
                                style = MaterialTheme.typography.titleSmall,
                                color = AxiaGold
                            )
                            Badge(
                                containerColor = when (matter.stage) {
                                    "متداولة" -> CourtBlue
                                    "حجز للحكم" -> WarningAmber
                                    "محكوم فيها" -> SuccessGreen
                                    else -> PurpleAdmin
                                }
                            ) {
                                Text(matter.stage, color = TextPrimary)
                            }
                        }

                        Text(
                            text = matter.title,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextPrimary
                        )

                        Text(
                            text = "${matter.court} · ${matter.circuit}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "الموكل: ${matter.clientName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextPrimary
                            )
                            Text(
                                text = "الخصم: ${matter.opponentName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                        }

                        Divider(color = DarkSurfaceBorder, thickness = 0.5.dp)

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = "الجلسة القادمة: ${matter.nextHearingDate}",
                                style = MaterialTheme.typography.bodySmall,
                                color = WarningAmber
                            )
                            Text(
                                text = "الأتعاب: ${matter.paidFees} / ${matter.agreedFees}",
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
