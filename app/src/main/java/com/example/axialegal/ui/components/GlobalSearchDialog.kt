package com.example.axialegal.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.axialegal.model.Matter
import com.example.axialegal.ui.theme.AxiaGold
import com.example.axialegal.ui.theme.DarkSurface
import com.example.axialegal.ui.theme.DarkSurfaceElevated
import com.example.axialegal.ui.theme.TextPrimary
import com.example.axialegal.ui.theme.TextSecondary
import com.example.axialegal.viewmodel.AxiaUiState

@Composable
fun GlobalSearchDialog(
    state: AxiaUiState,
    onDismiss: () -> Unit,
    onSelectMatter: (Matter) -> Unit,
    modifier: Modifier = Modifier
) {
    var query by remember { mutableStateOf("") }

    val filteredMatters = remember(query, state.matters) {
        if (query.isBlank()) emptyList()
        else state.matters.filter {
            it.title.contains(query, ignoreCase = true) ||
            it.caseNumber.contains(query, ignoreCase = true) ||
            it.clientName.contains(query, ignoreCase = true) ||
            it.court.contains(query, ignoreCase = true)
        }
    }

    val filteredClients = remember(query, state.clients) {
        if (query.isBlank()) emptyList()
        else state.clients.filter {
            it.name.contains(query, ignoreCase = true) ||
            it.nationalIdOrCr.contains(query, ignoreCase = true) ||
            it.poaNumber.contains(query, ignoreCase = true)
        }
    }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = modifier
                .fillMaxWidth()
                .fillMaxHeight(0.8f)
                .clip(RoundedCornerShape(16.dp)),
            color = DarkSurface
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "البحث القضائي الشامل",
                        style = MaterialTheme.typography.titleMedium,
                        color = AxiaGold
                    )
                    IconButton(
                        onClick = onDismiss,
                        modifier = Modifier.testTag("close_search_button")
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "إغلاق البحث",
                            tint = TextSecondary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = query,
                    onValueChange = { query = it },
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("search_input_field"),
                    placeholder = { Text("ابحث برقم القضية، اسم الموكل، الدائرة أو التوكيل…", color = TextSecondary) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = AxiaGold)
                    },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AxiaGold,
                        unfocusedBorderColor = DarkSurfaceElevated,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                if (query.isBlank()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "اكتب كلمة بحث للعثور الفوري على أي قضية، موكل، أو رول جلسة.",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                } else if (filteredMatters.isEmpty() && filteredClients.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "لا توجد نتائج مطابقة لكلمة البحث «$query».",
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextSecondary
                        )
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (filteredMatters.isNotEmpty()) {
                            item {
                                Text(
                                    text = "ملفات القضايا (${filteredMatters.size})",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = AxiaGold
                                )
                            }
                            items(filteredMatters) { matter ->
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable {
                                            onSelectMatter(matter)
                                            onDismiss()
                                        }
                                        .testTag("search_result_matter_${matter.id}"),
                                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = matter.caseNumber,
                                            style = MaterialTheme.typography.titleSmall,
                                            color = AxiaGold
                                        )
                                        Text(
                                            text = matter.title,
                                            style = MaterialTheme.typography.bodyMedium,
                                            color = TextPrimary
                                        )
                                        Text(
                                            text = "الموكل: ${matter.clientName} · ${matter.court}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextSecondary
                                        )
                                    }
                                }
                            }
                        }

                        if (filteredClients.isNotEmpty()) {
                            item {
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "سجل الموكلين (${filteredClients.size})",
                                    style = MaterialTheme.typography.labelMedium,
                                    color = AxiaGold
                                )
                            }
                            items(filteredClients) { client ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                                ) {
                                    Column(modifier = Modifier.padding(12.dp)) {
                                        Text(
                                            text = client.name,
                                            style = MaterialTheme.typography.titleSmall,
                                            color = TextPrimary
                                        )
                                        Text(
                                            text = "${client.type} · ${client.nationalIdOrCr}",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = TextSecondary
                                        )
                                        Text(
                                            text = "التوكيل: ${client.poaNumber} (${client.poaOffice})",
                                            style = MaterialTheme.typography.bodySmall,
                                            color = AxiaGold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
