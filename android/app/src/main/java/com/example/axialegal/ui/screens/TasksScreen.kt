package com.example.axialegal.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.LegalTask
import com.example.axialegal.ui.theme.*

@Composable
fun TasksScreen(
    tasks: List<LegalTask>,
    onToggleTask: (String) -> Unit,
    onOpenNewTask: () -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedFilter by remember { mutableStateOf("الكل") }
    val filters = listOf("الكل", "قيد التنفيذ", "حرجة (سقوط)", "مكتملة")

    val filteredTasks = remember(tasks, selectedFilter) {
        when (selectedFilter) {
            "قيد التنفيذ" -> tasks.filter { it.status == "قيد التنفيذ" }
            "حرجة (سقوط)" -> tasks.filter { it.status == "قيد التنفيذ" && it.priority.contains("حرجة") }
            "مكتملة" -> tasks.filter { it.status == "مكتملة" }
            else -> tasks
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
                    text = "قلم المحضرين والمواعيد الإجرائية",
                    style = MaterialTheme.typography.titleMedium,
                    color = AxiaGold
                )
                Text(
                    text = "حماية المكتب من سقوط المواعيد القانونية والطعون",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }
            Button(
                onClick = onOpenNewTask,
                colors = ButtonDefaults.buttonColors(containerColor = AxiaGold),
                modifier = Modifier.testTag("add_task_btn")
            ) {
                Icon(Icons.Default.Add, contentDescription = null, tint = DarkBackground, modifier = Modifier.size(16.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("مهمة جديدة", color = DarkBackground)
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
            items(filteredTasks) { task ->
                val isCompleted = task.status == "مكتملة"
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onToggleTask(task.id) }
                        .testTag("task_card_${task.id}"),
                    colors = CardDefaults.cardColors(containerColor = DarkSurfaceElevated)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        IconButton(
                            onClick = { onToggleTask(task.id) },
                            modifier = Modifier
                                .size(32.dp)
                                .testTag("toggle_task_${task.id}")
                        ) {
                            Icon(
                                imageVector = if (isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                contentDescription = if (isCompleted) "مكتملة" else "قيد التنفيذ",
                                tint = if (isCompleted) SuccessGreen else if (task.priority.contains("حرجة")) AlertRed else TextSecondary
                            )
                        }

                        Column(
                            modifier = Modifier.weight(1f),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = task.category,
                                    style = MaterialTheme.typography.labelSmall,
                                    color = AxiaGold
                                )
                                Badge(
                                    containerColor = if (task.priority.contains("حرجة")) AlertRedDim else DarkSurfaceBorder
                                ) {
                                    Text(
                                        text = task.priority,
                                        color = if (task.priority.contains("حرجة")) AlertRed else TextSecondary
                                    )
                                }
                            }

                            Text(
                                text = task.title,
                                style = MaterialTheme.typography.bodyMedium,
                                color = if (isCompleted) TextTertiary else TextPrimary
                            )

                            Text(
                                text = "الجهة: ${task.courtOrBailiffOffice}",
                                style = MaterialTheme.typography.bodySmall,
                                color = TextSecondary
                            )

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "المسؤول: ${task.assignedTo}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = AxiaGoldLight
                                )
                                Text(
                                    text = "الموعد: ${task.deadline}",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = if (task.priority.contains("حرجة")) AlertRed else WarningAmber
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
