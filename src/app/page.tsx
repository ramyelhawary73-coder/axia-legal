"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { NavigationTab, LegalTask } from "@/types/legal";
import { OverviewView } from "@/components/views/overview-view";
import { MattersView } from "@/components/views/matters-view";
import { HearingsView } from "@/components/views/hearings-view";
import { ClientsView } from "@/components/views/clients-view";
import { TasksView } from "@/components/views/tasks-view";
import { DocumentsView } from "@/components/views/documents-view";
import { FinanceView } from "@/components/views/finance-view";
import { LibraryView } from "@/components/views/library-view";
import { RajihAiView } from "@/components/views/rajih-ai-view";
import { TeamView } from "@/components/views/team-view";
import { ReportsView } from "@/components/views/reports-view";
import { AdministrationView } from "@/components/views/administration-view";
import { mockMatters, mockTasks } from "@/lib/mock-legal-data";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<LegalTask[]>(mockTasks);

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "مكتملة" ? "قيد التنفيذ" : "مكتملة" }
          : t
      )
    );
  };

  const handleCreateTask = (newTask: LegalTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleOpenMatter = (matterId: string) => {
    setSelectedMatterId(matterId);
    setActiveTab("matters");
  };

  let subContext: string | null = null;
  if (activeTab === "matters" && selectedMatterId) {
    const matter = mockMatters.find(m => m.id === selectedMatterId);
    if (matter) {
      subContext = `قضية رقم ${matter.caseNumber}`;
    }
  }

  return (
    <AppShell 
      activeTab={activeTab} 
      onNavigate={(tab) => { setActiveTab(tab); setSelectedMatterId(null); }} 
      subContext={subContext} 
      onClearSubContext={() => setSelectedMatterId(null)}
      tasks={tasks}
      onToggleTaskStatus={handleToggleTaskStatus}
    >
      {activeTab === "overview" && (
        <OverviewView 
          onNavigate={setActiveTab} 
          onOpenMatter={handleOpenMatter} 
        />
      )}
      {activeTab === "matters" && (
        <MattersView 
          selectedMatterId={selectedMatterId}
          onCloseMatterModal={() => setSelectedMatterId(null)}
        />
      )}
      {activeTab === "hearings" && <HearingsView />}
      {activeTab === "clients" && <ClientsView />}
      {activeTab === "tasks" && (
        <TasksView 
          tasks={tasks}
          onToggleTaskStatus={handleToggleTaskStatus}
          onCreateTask={handleCreateTask}
        />
      )}
      {activeTab === "documents" && <DocumentsView />}
      {activeTab === "finance" && <FinanceView />}
      {activeTab === "library" && <LibraryView />}
      {activeTab === "rajih" && <RajihAiView />}
      {activeTab === "team" && <TeamView />}
      {activeTab === "reports" && <ReportsView />}
      {activeTab === "administration" && <AdministrationView />}
    </AppShell>
  );
}
