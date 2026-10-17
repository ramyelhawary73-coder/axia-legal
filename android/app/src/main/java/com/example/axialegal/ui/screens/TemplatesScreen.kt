package com.example.axialegal.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bookmark
import androidx.compose.material.icons.filled.Description
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.LegalTemplate
import com.example.axialegal.ui.theme.*

@Composable
fun TemplatesScreen(
    templates: List<LegalTemplate>,
    modifier: Modifier = Modifier
) {
    var selectedTemplate by remember { mutableStateOf<LegalTemplate?>(null) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column {
            Text(
                text = "مكتبة الصيغ والنماذج القانونية المعتمدة",
                style = MaterialTheme.typography.titleMedium,
                color = AxiaGold
            )
            Text(
                text = "صيغ متوافقة مع القوانين المصرية (إنذارات، عقود، وصحف دعاوى)",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        if (selectedTemplate != null) {
            val tmpl = selectedTemplate!!
            Card(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("template_detail_view"),
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = tmpl.title,
                            style = MaterialTheme.typography.titleSmall,
                            color = AxiaGold,
                            modifier = Modifier.weight(1f)
                        )
                        TextButton(onClick = { selectedTemplate = null }) {
                            Text("رجوع للقائمة", color = AxiaGoldLight)
                        }
                    }

                    Text(
                        text = "السند القانوني: ${tmpl.governingLaw}",
                        style = MaterialTheme.typography.bodySmall,
                        color = CourtBlue
                    )

                    Divider(color = DarkSurfaceBorder, thickness = 0.5.dp)

                    LazyColumn(modifier = Modifier.weight(1f)) {
                        item {
                            Text(
                                text = tmpl.templateBody,
                                style = MaterialTheme.typography.bodyMedium,
                                color = TextPrimary,
                                lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.3
                            )
                        }
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(templates) { tmpl ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedTemplate = tmpl }
                            .testTag("template_item_${tmpl.id}"),
                        colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = tmpl.category,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AxiaGold
                                )
                                Badge(containerColor = AxiaGoldDim) {
                                    Text(tmpl.badge, color = AxiaGold)
                                }
                            }

                            Text(
                                text = tmpl.title,
                                style = MaterialTheme.typography.titleSmall,
                                color = TextPrimary
                            )

                            Text(
                                text = tmpl.subtitle,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )

                            Text(
                                text = tmpl.governingLaw,
                                style = MaterialTheme.typography.bodySmall,
                                color = CourtBlue
                            )
                        }
                    }
                }
            }
        }
    }
}
