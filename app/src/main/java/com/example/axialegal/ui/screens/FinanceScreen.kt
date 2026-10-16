package com.example.axialegal.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalance
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.TrendingDown
import androidx.compose.material.icons.filled.TrendingUp
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.FinancialRecord
import com.example.axialegal.ui.theme.*

@Composable
fun FinanceScreen(
    finances: List<FinancialRecord>,
    modifier: Modifier = Modifier
) {
    val totalCollected = finances.filter { it.status == "محصلة" }.sumOf { it.amount }
    val totalPending = finances.filter { it.status == "مستحقة" }.sumOf { it.amount }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column {
            Text(
                text = "المالية والأتعاب والدمغات القضائية",
                style = MaterialTheme.typography.titleMedium,
                color = AxiaGold
            )
            Text(
                text = "إدارة الدفعات، أمانات الخبراء، الرسوم ومطالبات الأتعاب",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        // Summary Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = SuccessGreenDim)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.TrendingUp, contentDescription = null, tint = SuccessGreen, modifier = Modifier.size(16.dp))
                        Text("المحصل فعلياً", style = MaterialTheme.typography.labelSmall, color = SuccessGreen)
                    }
                    Text(
                        text = "١٠٠,٠٠٠ ج.م",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                }
            }

            Card(
                modifier = Modifier.weight(1f),
                colors = CardDefaults.cardColors(containerColor = WarningAmberDim)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                        Icon(Icons.Default.Receipt, contentDescription = null, tint = WarningAmber, modifier = Modifier.size(16.dp))
                        Text("مستحق التحصيل", style = MaterialTheme.typography.labelSmall, color = WarningAmber)
                    }
                    Text(
                        text = "٤٥,٠٠٠ ج.م",
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                }
            }
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(finances) { rec ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("finance_card_${rec.id}"),
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
                                text = rec.type,
                                style = MaterialTheme.typography.titleSmall,
                                color = AxiaGold
                            )
                            Badge(
                                containerColor = when (rec.status) {
                                    "محصلة" -> SuccessGreenDim
                                    "مستحقة" -> WarningAmberDim
                                    else -> CourtBlueDim
                                }
                            ) {
                                Text(
                                    text = rec.status,
                                    color = when (rec.status) {
                                        "محصلة" -> SuccessGreen
                                        "مستحقة" -> WarningAmber
                                        else -> CourtBlue
                                    }
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "الموكل: ${rec.clientName}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextPrimary
                            )
                            Text(
                                text = "${rec.amount} ج.م",
                                style = MaterialTheme.typography.titleSmall,
                                color = if (rec.isIncome) SuccessGreen else AlertRed
                            )
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "القضية: ${rec.matterCaseNumber}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                            Text(
                                text = "إيصال: ${rec.receiptNumber} (${rec.date})",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextTertiary
                            )
                        }
                    }
                }
            }
        }
    }
}
