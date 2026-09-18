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
import { mockMatters, mockTasks, mockClients, mockDocuments } from "@/lib/mock-legal-data";
import { useDailySnapshotAutoExport } from "@/hooks/use-daily-snapshot-auto-export";
import { DailySnapshotToast } from "@/components/daily-snapshot-toast";
import { DailySnapshotManager } from "@/components/daily-snapshot-manager";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<LegalTask[]>(mockTasks);
  const [isSnapshotManagerOpen, setIsSnapshotManagerOpen] = useState(false);

  // Background Auto-Export: automatically exports daily snapshot to Downloads / Cloud Sync on app startup
  const { toastNotification, dismissToast } = useDailySnapshotAutoExport(mockMatters, tasks);

  const handleToggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "مكتملة" ? "قيد التنفيذ" : "مكتملة" }
          : t
      )
    );
  };

  const handleBulkUpdateTaskStatus = (taskIds: string[], newStatus: LegalTask["status"]) => {
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t.id) ? { ...t, status: newStatus } : t
      )
    );
  };

  const handleBulkDeleteTasks = (taskIds: string[]) => {
    setTasks((prev) => prev.filter((t) => !taskIds.includes(t.id)));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleCreateTask = (newTask: LegalTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleOpenMatter = (matterId: string) => {
    setSelectedMatterId(matterId);
    setActiveTab("matters");
  };

  const handleSelectMatter = (matterId: string) => {
    setSelectedMatterId(matterId);
    setActiveTab("matters");
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setActiveTab("clients");
  };

  const handleSelectDocument = (docId: string) => {
    setSelectedDocumentId(docId);
    setActiveTab("documents");
  };

  let subContext: string | null = null;
  if (activeTab === "matters" && selectedMatterId) {
    const matter = mockMatters.find(m => m.id === selectedMatterId);
    if (matter) {
      subContext = `قضية رقم ${matter.caseNumber}`;
    }
  } else if (activeTab === "clients" && selectedClientId) {
    const client = mockClients.find(c => c.id === selectedClientId);
    if (client) {
      subContext = `الموكل: ${client.name}`;
    }
  } else if (activeTab === "documents" && selectedDocumentId) {
    const doc = mockDocuments.find(d => d.id === selectedDocumentId);
    if (doc) {
      subContext = `مستند: ${doc.title}`;
    }
  }

  return (
    <>
      <AppShell 
        activeTab={activeTab} 
        onNavigate={(tab) => { 
          setActiveTab(tab); 
          setSelectedMatterId(null);
          setSelectedClientId(null);
          setSelectedDocumentId(null);
        }} 
        subContext={subContext} 
        onClearSubContext={() => {
          setSelectedMatterId(null);
          setSelectedClientId(null);
          setSelectedDocumentId(null);
        }}
        tasks={tasks}
        onToggleTaskStatus={handleToggleTaskStatus}
        onCreateTask={handleCreateTask}
        matters={mockMatters}
        clients={mockClients}
        documents={mockDocuments}
        onSelectMatter={handleSelectMatter}
        onSelectClient={handleSelectClient}
        onSelectDocument={handleSelectDocument}
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
        {activeTab === "clients" && (
          <ClientsView 
            selectedClientId={selectedClientId}
            onCloseClientDashboard={() => setSelectedClientId(null)}
          />
        )}
        {activeTab === "tasks" && (
          <TasksView 
            tasks={tasks}
            onToggleTaskStatus={handleToggleTaskStatus}
            onCreateTask={handleCreateTask}
            onBulkUpdateTaskStatus={handleBulkUpdateTaskStatus}
            onBulkDeleteTasks={handleBulkDeleteTasks}
            onDeleteTask={handleDeleteTask}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === "documents" && (
          <DocumentsView 
            clients={mockClients} 
            matters={mockMatters}
            selectedDocId={selectedDocumentId}
            onCloseDocModal={() => setSelectedDocumentId(null)}
          />
        )}
        {activeTab === "finance" && <FinanceView />}
        {activeTab === "library" && <LibraryView />}
        {activeTab === "rajih" && <RajihAiView />}
        {activeTab === "team" && <TeamView />}
        {activeTab === "reports" && <ReportsView matters={mockMatters} tasks={tasks} />}
        {activeTab === "administration" && <AdministrationView matters={mockMatters} tasks={tasks} />}
      </AppShell>

      {/* Floating Notification for Daily Snapshot Auto-Export */}
      <DailySnapshotToast
        notification={toastNotification}
        onDismiss={dismissToast}
        onOpenManager={() => setIsSnapshotManagerOpen(true)}
      />

      {/* Daily Snapshot & Cloud Sync Manager Modal */}
      <DailySnapshotManager
        isOpen={isSnapshotManagerOpen}
        onClose={() => setIsSnapshotManagerOpen(false)}
        matters={mockMatters}
        tasks={tasks}
      />
    </>
  );
}
