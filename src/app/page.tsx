"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  NavigationTab,
  LegalTask,
  Client,
  Matter,
  Hearing,
  LegalDocument,
} from "@/types/legal";
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
import {
  createPersistentTask,
  loadTaskWorkspace,
  updatePersistentTaskStatus,
  type TaskWorkspace,
} from "@/lib/tasks-client";
import { useDailySnapshotAutoExport } from "@/hooks/use-daily-snapshot-auto-export";
import { DailySnapshotToast } from "@/components/daily-snapshot-toast";
import { DailySnapshotManager } from "@/components/daily-snapshot-manager";
import { loadPersistentClients } from "@/lib/clients-client";
import { loadMattersWorkspace } from "@/lib/matters-client";
import { loadPersistentHearings } from "@/lib/hearings-client";
import { loadPersistentDocuments } from "@/lib/documents-client";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavigationTab>("overview");
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<LegalTask[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [matters, setMatters] = useState<Matter[]>([]);
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [coreSyncError, setCoreSyncError] = useState<string | null>(null);
  const [coreLoading, setCoreLoading] = useState(true);
  const [taskWorkspace, setTaskWorkspace] = useState<TaskWorkspace | null>(null);
  const [taskSyncError, setTaskSyncError] = useState<string | null>(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [isSnapshotManagerOpen, setIsSnapshotManagerOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Background Auto-Export: automatically exports daily snapshot to Downloads / Cloud Sync on app startup
  const { toastNotification, dismissToast } = useDailySnapshotAutoExport(matters, tasks);

  useEffect(() => {
    let cancelled = false;

    void loadTaskWorkspace()
      .then((workspace) => {
        if (cancelled) return;
        setTaskWorkspace(workspace);
        setTasks(workspace.tasks);
        setTaskSyncError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTaskSyncError(
          error instanceof Error ? error.message : "تعذر تحميل المهام من قاعدة البيانات.",
        );
      })
      .finally(() => {
        if (!cancelled) setTasksLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const refreshCoreWorkspace = async () => {
    const [loadedClients, matterWorkspace] = await Promise.all([
      loadPersistentClients(),
      loadMattersWorkspace(),
    ]);

    const [loadedHearings, loadedDocuments] = await Promise.all([
      loadPersistentHearings(matterWorkspace.matters),
      loadPersistentDocuments(matterWorkspace.matters, loadedClients),
    ]);

    setClients(loadedClients);
    setMatters(matterWorkspace.matters);
    setHearings(loadedHearings);
    setDocuments(loadedDocuments);
    setCoreSyncError(null);
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [loadedClients, matterWorkspace] = await Promise.all([
          loadPersistentClients(),
          loadMattersWorkspace(),
        ]);

        const [loadedHearings, loadedDocuments] = await Promise.all([
          loadPersistentHearings(matterWorkspace.matters),
          loadPersistentDocuments(matterWorkspace.matters, loadedClients),
        ]);

        if (cancelled) return;
        setClients(loadedClients);
        setMatters(matterWorkspace.matters);
        setHearings(loadedHearings);
        setDocuments(loadedDocuments);
        setCoreSyncError(null);
      } catch (error) {
        if (cancelled) return;
        setCoreSyncError(
          error instanceof Error
            ? error.message
            : "تعذر تحميل بيانات مساحة العمل.",
        );
      } finally {
        if (!cancelled) setCoreLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggleTaskStatus = async (taskId: string) => {
    const currentTask = tasks.find((task) => task.id === taskId);
    if (!currentTask) return;

    const nextStatus: LegalTask["status"] =
      currentTask.status === "مكتملة" ? "قيد التنفيذ" : "مكتملة";

    try {
      await updatePersistentTaskStatus([taskId], nextStatus);
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: nextStatus } : task,
        ),
      );
      setTaskSyncError(null);
    } catch (error) {
      setTaskSyncError(
        error instanceof Error ? error.message : "تعذر تحديث حالة المهمة.",
      );
    }
  };

  const handleBulkUpdateTaskStatus = async (
    taskIds: string[],
    newStatus: LegalTask["status"],
  ) => {
    try {
      await updatePersistentTaskStatus(taskIds, newStatus);
      setTasks((prev) =>
        prev.map((task) =>
          taskIds.includes(task.id) ? { ...task, status: newStatus } : task,
        ),
      );
      setTaskSyncError(null);
    } catch (error) {
      setTaskSyncError(
        error instanceof Error ? error.message : "تعذر تحديث المهام المحددة.",
      );
    }
  };

  const handleCreateTask = async (newTask: LegalTask) => {
    if (!taskWorkspace) {
      setTaskSyncError("لم يكتمل تحميل مساحة العمل بعد.");
      return false;
    }

    try {
      const persistedTask = await createPersistentTask(newTask);
      setTasks((prev) => [persistedTask, ...prev]);
      setTaskSyncError(null);
      return true;
    } catch (error) {
      setTaskSyncError(
        error instanceof Error ? error.message : "تعذر حفظ المهمة.",
      );
      return false;
    }
  };

  const handleMatterCreated = async () => {
    try {
      const workspace = await loadTaskWorkspace();
      setTaskWorkspace(workspace);
      setTasks(workspace.tasks);
      await refreshCoreWorkspace();
      setTaskSyncError(null);
    } catch (error) {
      setTaskSyncError(
        error instanceof Error ? error.message : "تعذر تحديث قائمة القضايا للمهام.",
      );
    }
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
    const matter = matters.find((m) => m.id === selectedMatterId);
    if (matter) {
      subContext = `قضية رقم ${matter.caseNumber}`;
    }
  } else if (activeTab === "clients" && selectedClientId) {
    const client = clients.find((c) => c.id === selectedClientId);
    if (client) {
      subContext = `الموكل: ${client.name}`;
    }
  } else if (activeTab === "documents" && selectedDocumentId) {
    const doc = documents.find((d) => d.id === selectedDocumentId);
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
          setIsFocusMode(false);
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
        taskMatterOptions={taskWorkspace?.matters ?? []}
        taskAssigneeLabel={taskWorkspace?.assigneeLabel ?? "المستخدم الحالي"}
        matters={matters}
        clients={clients}
        documents={documents}
        onSelectMatter={handleSelectMatter}
        onSelectClient={handleSelectClient}
        onSelectDocument={handleSelectDocument}
        isFocusMode={isFocusMode}
      >
        {activeTab === "overview" && (
          <>
            {coreSyncError && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                {coreSyncError}
              </div>
            )}
            {coreLoading && (
              <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
                جارٍ تحميل بيانات مساحة العمل...
              </div>
            )}
            <OverviewView
              matters={matters}
              hearings={hearings}
              tasks={tasks}
              clients={clients}
              documents={documents}
              onNavigate={setActiveTab}
              onOpenMatter={handleOpenMatter}
            />
          </>
        )}
        {activeTab === "matters" && (
          <MattersView 
            selectedMatterId={selectedMatterId}
            onCloseMatterModal={() => setSelectedMatterId(null)}
            onMatterCreated={() => {
              void handleMatterCreated();
            }}
          />
        )}
        {activeTab === "hearings" && (
          <HearingsView
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            onHearingsChanged={refreshCoreWorkspace}
          />
        )}
        {activeTab === "clients" && (
          <ClientsView
            selectedClientId={selectedClientId}
            onCloseClientDashboard={() => setSelectedClientId(null)}
            onWorkspaceChanged={refreshCoreWorkspace}
          />
        )}
        {activeTab === "tasks" && (
          <>
            {taskSyncError && (
              <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-xs font-semibold text-red-300">
                {taskSyncError}
              </div>
            )}
            {tasksLoading && (
              <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3 text-xs text-[var(--text-muted)]">
                جارٍ تحميل المهام المحفوظة...
              </div>
            )}
            <TasksView 
              tasks={tasks}
              onToggleTaskStatus={handleToggleTaskStatus}
              onCreateTask={handleCreateTask}
              onBulkUpdateTaskStatus={handleBulkUpdateTaskStatus}
              taskMatterOptions={taskWorkspace?.matters ?? []}
              taskAssigneeLabel={taskWorkspace?.assigneeLabel ?? "المستخدم الحالي"}
              onNavigate={setActiveTab}
            />
          </>
        )}
        {activeTab === "documents" && (
          <DocumentsView
            clients={clients}
            matters={matters}
            documents={documents}
            onDocumentsChange={setDocuments}
            selectedDocId={selectedDocumentId}
            onCloseDocModal={() => setSelectedDocumentId(null)}
          />
        )}
        {activeTab === "finance" && <FinanceView />}
        {activeTab === "library" && <LibraryView />}
        {activeTab === "rajih" && <RajihAiView />}
        {activeTab === "team" && <TeamView />}
        {activeTab === "reports" && <ReportsView matters={matters} tasks={tasks} />}
        {activeTab === "administration" && <AdministrationView matters={matters} tasks={tasks} />}
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
        matters={matters}
        tasks={tasks}
      />
    </>
  );
}
