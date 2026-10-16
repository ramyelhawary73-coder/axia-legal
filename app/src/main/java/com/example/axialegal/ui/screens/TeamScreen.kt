package com.example.axialegal.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.TeamMember
import com.example.axialegal.ui.theme.*

@Composable
fun TeamScreen(
    team: List<TeamMember>,
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
                text = "فريق العمل وهيئة الدفاع",
                style = MaterialTheme.typography.titleMedium,
                color = AxiaGold
            )
            Text(
                text = "الشركاء والمستشارون والمحامون المقيدون بنقابة المحامين المصرية",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(team) { member ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .testTag("team_card_${member.id}"),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
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
                                .size(44.dp)
                                .clip(CircleShape)
                                .background(AxiaGoldDim),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                text = member.avatarInitials,
                                style = MaterialTheme.typography.titleSmall,
                                color = AxiaGold
                            )
                        }

                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            Text(
                                text = member.name,
                                style = MaterialTheme.typography.titleSmall,
                                color = TextPrimary
                            )
                            Text(
                                text = member.role,
                                style = MaterialTheme.typography.bodySmall,
                                color = AxiaGoldLight
                            )
                            Text(
                                text = member.specialty,
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = member.experience,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = TextTertiary
                                )
                                Text(
                                    text = "${member.casesCount} ملفات نشطة",
                                    style = MaterialTheme.typography.labelSmall,
                                    color = CourtBlue
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
