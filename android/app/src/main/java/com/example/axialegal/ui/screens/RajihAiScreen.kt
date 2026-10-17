package com.example.axialegal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.ui.theme.*

@Composable
fun RajihAiScreen(
    scenarioResult: String?,
    isLoading: Boolean,
    onAskRajih: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var queryText by remember { mutableStateOf("") }

    val presetScenarios = listOf(
        "طعن بالنقض — بطلان شرط التحكيم" to "فحص مدى صحة الدفع ببطلان شرط التحكيم لعدم تفويض الموقع تفويضاً خاصاً طبقاً للمادة ٧٠٢ مدني و١٠ تحكيم.",
        "عقد إيجار تجاري — قانون ٤ لسنة ١٩٩٦" to "مراجعة بند المدة والتجديد التلقائي في عقد إيجار تجاري لتفادي شبهة التأبيد أو الامتداد غير المقيد.",
        "مجلس الدولة — وقف تنفيذ قرار إداري" to "صياغة ركني الجدية والاستعجال في دعوى وقف تنفيذ وإلغاء قرار سحب تخصيص أرض صناعية بالعاشر."
    )

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = AxiaGold)
                Text(
                    text = "محرك الذكاء القضائي «راجح»",
                    style = MaterialTheme.typography.titleMedium,
                    color = AxiaGold
                )
            }
            Text(
                text = "مساعد قانوني سيادي مقيد بالتشريعات وأحكام محكمة النقض المصرية ومجلس الدولة",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        // Preset Scenarios
        Text(text = "نماذج استشارات قضائية جاهزة للتدقيق:", style = MaterialTheme.typography.labelSmall, color = AxiaGold)
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(presetScenarios) { (label, prompt) ->
                Card(
                    modifier = Modifier
                        .clickable {
                            queryText = prompt
                            onAskRajih(prompt)
                        }
                        .testTag("rajih_scenario_${label.take(6)}"),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Text(
                        text = label,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextPrimary,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }
        }

        // Query Input Field
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            OutlinedTextField(
                value = queryText,
                onValueChange = { queryText = it },
                placeholder = { Text("اكتب مسألة قانونية أو دفوع قضائية لفحصها…", color = TextSecondary) },
                modifier = Modifier
                    .weight(1f)
                    .testTag("rajih_query_input"),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = AxiaGold,
                    unfocusedBorderColor = DarkSurfaceElevated,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary
                ),
                maxLines = 3
            )
            Button(
                onClick = {
                    if (queryText.isNotBlank()) {
                        onAskRajih(queryText)
                    }
                },
                modifier = Modifier
                    .height(56.dp)
                    .testTag("rajih_submit_btn"),
                colors = ButtonDefaults.buttonColors(containerColor = AxiaGold),
                enabled = !isLoading && queryText.isNotBlank()
            ) {
                Icon(Icons.Default.Send, contentDescription = "إرسال", tint = DarkSurface)
            }
        }

        // Response or Loading
        if (isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    CircularProgressIndicator(color = AxiaGold)
                    Text("جاري استرجاع أحكام النقض والتحليل الفقهي…", color = TextSecondary, style = MaterialTheme.typography.bodySmall)
                }
            }
        } else if (scenarioResult != null) {
            Card(
                modifier = Modifier
                    .fillMaxSize()
                    .testTag("rajih_result_card"),
                colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
            ) {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Icon(Icons.Default.AutoAwesome, contentDescription = null, tint = AxiaGold, modifier = Modifier.size(18.dp))
                            Text("نتيجة الفحص القضائي والتحليل القانوني المعتمد:", style = MaterialTheme.typography.titleSmall, color = AxiaGold)
                        }
                    }
                    item {
                        Text(
                            text = scenarioResult,
                            style = MaterialTheme.typography.bodyMedium,
                            color = TextPrimary,
                            lineHeight = MaterialTheme.typography.bodyMedium.lineHeight * 1.3
                        )
                    }
                }
            }
        } else {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "اختر نموذج استشارة من الأعلى أو اكتب استفسارك القانوني للحصول على مذكرة إجرائية فورية مدعومة بالنصوص والمبادئ القضائية.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}
