package com.example.axialegal

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.BackHandler
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.testTag
import androidx.compose.ui.unit.dp
import com.example.axialegal.model.NavTab
import com.example.axialegal.ui.components.*
import com.example.axialegal.ui.screens.*
import com.example.axialegal.ui.theme.*
import com.example.axialegal.viewmodel.AxiaLegalViewModel

class MainActivity : ComponentActivity() {
    private val viewModel: AxiaLegalViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            AxiaLegalTheme {
                val uiState by viewModel.uiState.collectAsState()

                // BackHandler support: if user is in another tab or dialog, return to Overview
                BackHandler(enabled = uiState.currentTab != NavTab.OVERVIEW || uiState.selectedMatter != null) {
                    if (uiState.selectedMatter != null) {
                        viewModel.closeMatterDetail()
                    } else {
                        viewModel.selectTab(NavTab.OVERVIEW)
                    }
                }

                BoxWithConstraints(modifier = Modifier.fillMaxSize().background(DarkBackground)) {
                    val isExpanded = maxWidth >= 600.dp

                    Scaffold(
                        modifier = Modifier.fillMaxSize(),
                        containerColor = DarkBackground,
                        contentWindowInsets = WindowInsets.safeDrawing,
                        topBar = {
                            AxiaTopAppBar(
                                currentTab = uiState.currentTab,
                                onOpenSearch = { viewModel.setSearchOpen(true) },
                                onOpenNewTask = { viewModel.setNewTaskOpen(true) }
                            )
                        },
                        bottomBar = {
                            if (!isExpanded) {
                                AxiaBottomNavigation(
                                    currentTab = uiState.currentTab,
                                    onSelectTab = { viewModel.selectTab(it) }
                                )
                            }
                        },
                        floatingActionButton = {
                            FloatingActionButton(
                                onClick = { viewModel.setNewTaskOpen(true) },
                                containerColor = AxiaGold,
                                contentColor = DarkBackground,
                                modifier = Modifier
                                    .padding(bottom = if (!isExpanded) 16.dp else 0.dp)
                                    .testTag("global_fab_add_task")
                            ) {
                                Icon(Icons.Default.Add, contentDescription = "إضافة مهمة محضرين سريعة")
                            }
                        }
                    ) { innerPadding ->
                        Row(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(innerPadding)
                        ) {
                            if (isExpanded) {
                                AxiaNavigationRail(
                                    currentTab = uiState.currentTab,
                                    onSelectTab = { viewModel.selectTab(it) }
                                )
                            }

                            Box(
                                modifier = Modifier
                                    .weight(1f)
                                    .fillMaxHeight()
                            ) {
                                when (uiState.currentTab) {
                                    NavTab.OVERVIEW -> OverviewScreen(
                                        state = uiState,
                                        onNavigate = { viewModel.selectTab(it) },
                                        onOpenMatter = { viewModel.openMatterDetail(it) },
                                        onOpenNewTask = { viewModel.setNewTaskOpen(true) },
                                        onOpenNewMatter = { viewModel.setNewMatterOpen(true) },
                                        onToggleTask = { viewModel.toggleTaskStatus(it) }
                                    )
                                    NavTab.MATTERS -> MattersScreen(
                                        matters = uiState.matters,
                                        onOpenMatter = { viewModel.openMatterDetail(it) },
                                        onOpenNewMatter = { viewModel.setNewMatterOpen(true) }
                                    )
                                    NavTab.HEARINGS -> HearingsScreen(
                                        hearings = uiState.hearings,
                                        onOpenNewHearing = { viewModel.setNewHearingOpen(true) }
                                    )
                                    NavTab.CLIENTS -> ClientsScreen(
                                        clients = uiState.clients
                                    )
                                    NavTab.TASKS -> TasksScreen(
                                        tasks = uiState.tasks,
                                        onToggleTask = { viewModel.toggleTaskStatus(it) },
                                        onOpenNewTask = { viewModel.setNewTaskOpen(true) }
                                    )
                                    NavTab.DOCUMENTS -> DocumentsScreen(
                                        documents = uiState.documents
                                    )
                                    NavTab.FINANCE -> FinanceScreen(
                                        finances = uiState.finances
                                    )
                                    NavTab.RAJIH_AI -> RajihAiScreen(
                                        scenarioResult = uiState.rajihScenarioResult,
                                        isLoading = uiState.isRajihLoading,
                                        onAskRajih = { viewModel.askRajih(it) }
                                    )
                                    NavTab.TEMPLATES -> TemplatesScreen(
                                        templates = uiState.templates
                                    )
                                    NavTab.TEAM -> TeamScreen(
                                        team = uiState.team
                                    )
                                }
                            }
                        }
                    }

                    // Dialogs & Sheets
                    if (uiState.isSearchOpen) {
                        GlobalSearchDialog(
                            state = uiState,
                            onDismiss = { viewModel.setSearchOpen(false) },
                            onSelectMatter = { viewModel.openMatterDetail(it) }
                        )
                    }

                    if (uiState.isNewTaskOpen) {
                        NewTaskDialog(
                            onDismiss = { viewModel.setNewTaskOpen(false) },
                            onSaveTask = { viewModel.addTask(it) }
                        )
                    }

                    if (uiState.isNewMatterOpen) {
                        NewMatterDialog(
                            onDismiss = { viewModel.setNewMatterOpen(false) },
                            onSaveMatter = { viewModel.addMatter(it) }
                        )
                    }

                    if (uiState.isNewHearingOpen) {
                        NewHearingDialog(
                            matters = uiState.matters,
                            onDismiss = { viewModel.setNewHearingOpen(false) },
                            onSaveHearing = { viewModel.addHearing(it) }
                        )
                    }

                    uiState.selectedMatter?.let { matter ->
                        MatterDetailSheet(
                            matter = matter,
                            onDismiss = { viewModel.closeMatterDetail() },
                            onRequestAddHearing = { viewModel.setNewHearingOpen(true) }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AxiaTopAppBar(
    currentTab: NavTab,
    onOpenSearch: () -> Unit,
    onOpenNewTask: () -> Unit,
    modifier: Modifier = Modifier
) {
    TopAppBar(
        title = {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Scale,
                    contentDescription = null,
                    tint = AxiaGold,
                    modifier = Modifier.size(24.dp)
                )
                Column {
                    Text(
                        text = "AXIA LEGAL",
                        style = MaterialTheme.typography.titleMedium,
                        color = AxiaGold
                    )
                    Text(
                        text = currentTab.titleAr,
                        style = MaterialTheme.typography.labelSmall,
                        color = TextSecondary
                    )
                }
            }
        },
        actions = {
            IconButton(
                onClick = onOpenSearch,
                modifier = Modifier.testTag("top_search_btn")
            ) {
                Icon(
                    imageVector = Icons.Default.Search,
                    contentDescription = "البحث القضائي الشامل",
                    tint = AxiaGold
                )
            }
        },
        colors = TopAppBarDefaults.topAppBarColors(
            containerColor = DarkBackground,
            titleContentColor = AxiaGold
        ),
        modifier = modifier
    )
}

@Composable
fun AxiaBottomNavigation(
    currentTab: NavTab,
    onSelectTab: (NavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    val tabs = listOf(
        NavTab.OVERVIEW to Icons.Default.Dashboard,
        NavTab.MATTERS to Icons.Default.Gavel,
        NavTab.HEARINGS to Icons.Default.Event,
        NavTab.TASKS to Icons.Default.Assignment,
        NavTab.RAJIH_AI to Icons.Default.AutoAwesome
    )

    NavigationBar(
        containerColor = DarkSurface,
        modifier = modifier
            .windowInsetsPadding(WindowInsets.navigationBars)
            .testTag("bottom_nav_bar")
    ) {
        tabs.forEach { (tab, icon) ->
            val isSelected = currentTab == tab
            NavigationBarItem(
                selected = isSelected,
                onClick = { onSelectTab(tab) },
                icon = {
                    Icon(
                        imageVector = icon,
                        contentDescription = tab.titleAr,
                        tint = if (isSelected) AxiaGold else TextSecondary
                    )
                },
                label = {
                    Text(
                        text = tab.titleAr,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isSelected) AxiaGold else TextSecondary
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = AxiaGoldDim
                ),
                modifier = Modifier.testTag("nav_tab_${tab.name}")
            )
        }
    }
}

@Composable
fun AxiaNavigationRail(
    currentTab: NavTab,
    onSelectTab: (NavTab) -> Unit,
    modifier: Modifier = Modifier
) {
    NavigationRail(
        containerColor = DarkSurface,
        modifier = modifier
    ) {
        NavTab.values().forEach { tab ->
            val icon = when (tab) {
                NavTab.OVERVIEW -> Icons.Default.Dashboard
                NavTab.MATTERS -> Icons.Default.Gavel
                NavTab.HEARINGS -> Icons.Default.Event
                NavTab.CLIENTS -> Icons.Default.People
                NavTab.TASKS -> Icons.Default.Assignment
                NavTab.DOCUMENTS -> Icons.Default.Description
                NavTab.FINANCE -> Icons.Default.AccountBalance
                NavTab.RAJIH_AI -> Icons.Default.AutoAwesome
                NavTab.TEMPLATES -> Icons.Default.Book
                NavTab.TEAM -> Icons.Default.Group
            }
            NavigationRailItem(
                selected = currentTab == tab,
                onClick = { onSelectTab(tab) },
                icon = { Icon(icon, contentDescription = tab.titleAr) },
                label = { Text(tab.titleAr) },
                colors = NavigationRailItemDefaults.colors(
                    selectedIconColor = AxiaGold,
                    selectedTextColor = AxiaGold,
                    indicatorColor = AxiaGoldDim,
                    unselectedIconColor = TextSecondary,
                    unselectedTextColor = TextSecondary
                )
            )
        }
    }
}
