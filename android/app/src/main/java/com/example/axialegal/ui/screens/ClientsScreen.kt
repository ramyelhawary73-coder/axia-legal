package com.example.axialegal.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Business
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.Client
import com.example.axialegal.ui.theme.*

@Composable
fun ClientsScreen(
    clients: List<Client>,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Column {
            Text(
                text = "الموكلون وسجل التوكيلات الرسمية",
                style = MaterialTheme.typography.titleMedium,
                color = AxiaGold
            )
            Text(
                text = "سجل متكامل للشركات والأفراد مع أرقام وسريان توكيلات قضايا المحاكم",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(clients) { client ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("client_card_${client.id}"),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                Icon(
                                    imageVector = if (client.type.contains("شركة")) Icons.Default.Business else Icons.Default.Person,
                                    contentDescription = null,
                                    tint = AxiaGold
                                )
                                Text(
                                    text = client.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    color = TextPrimary
                                )
                            }
                            Badge(containerColor = CourtBlueDim) {
                                Text(
                                    text = "${client.activeMattersCount} قضايا متداولة",
                                    color = CourtBlue
                                )
                            }
                        }

                        Text(
                            text = "${client.type} · ${client.nationalIdOrCr}",
                            style = MaterialTheme.typography.bodySmall,
                            color = TextSecondary
                        )

                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(containerColor = DarkSurface)
                        ) {
                            Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                Text(
                                    text = "بيانات التوكيل الرسمي: ${client.poaNumber}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AxiaGold
                                )
                                Text(
                                    text = "مكتب التوثيق: ${client.poaOffice} · الحالة: ${client.poaExpiry}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = TextSecondary
                                )
                            }
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "الهاتف: ${client.phone}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                            Text(
                                text = "المسدد: ${client.totalPaid}",
                                style = MaterialTheme.typography.bodySmall,
                                color = SuccessGreen
                            )
                        }

                        if (client.balanceDue != "٠ ج.م") {
                            Text(
                                text = "الرصيد المتبقي: ${client.balanceDue}",
                                style = MaterialTheme.typography.bodySmall,
                                color = AlertRed
                            )
                        }
                    }
                }
            }
        }
    }
}
