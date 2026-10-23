import React, { useState } from 'react';
import {
  UserRole,
  UserProfile,
  KubeflowTask,
  MlflowRun,
  ModelRegistryEntry,
  CvatDataset,
} from './types/mlops';
import {
  USERS,
  FRAMEWORKS,
  CVAT_DATASETS,
  DEFAULT_HYPERPARAMETERS,
  INITIAL_KUBEFLOW_TASKS,
  INITIAL_MLFLOW_RUNS,
  INITIAL_MODEL_REGISTRY,
} from './data/mockData';
import { TopBar, NavTab } from './components/layout/TopBar';
import { RbacBanner } from './components/layout/RbacBanner';
import { EndToEndPipelineFlow } from './components/flow/EndToEndPipelineFlow';
import { InstructionManualPage } from './components/docs/InstructionManualPage';
import { TrainingPipelineStarter } from './components/training/TrainingPipelineStarter';
import { KubeflowTaskTracker } from './components/kubeflow/KubeflowTaskTracker';
import { MlflowDashboard } from './components/mlflow/MlflowDashboard';
import { CvatDatasetManager } from './components/cvat/CvatDatasetManager';
import { RbacMatrixView } from './components/rbac/RbacMatrixView';
import { CvatPreviewModal } from './components/cvat/CvatPreviewModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { UserSettingsModal } from './components/settings/UserSettingsModal';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  // Active RBAC Persona state
  const [currentUser, setCurrentUser] = useState<UserProfile>(USERS.mlops_engineer);

  // Active Main Navigation Tab
  const [activeTab, setActiveTab] = useState<NavTab>('flow');

  // Kubeflow Tasks state
  const [tasks, setTasks] = useState<KubeflowTask[]>(INITIAL_KUBEFLOW_TASKS);

  // MLflow Runs state
  const [mlflowRuns, setMlflowRuns] = useState<MlflowRun[]>(INITIAL_MLFLOW_RUNS);
  const [selectedMlflowRunId, setSelectedMlflowRunId] = useState<string>(INITIAL_MLFLOW_RUNS[0]?.runId);

  // Model Registry state
  const [modelRegistry, setModelRegistry] = useState<ModelRegistryEntry[]>(INITIAL_MODEL_REGISTRY);

  // CVAT Datasets state
  const [cvatDatasets, setCvatDatasets] = useState<CvatDataset[]>(CVAT_DATASETS);
  const [previewDataset, setPreviewDataset] = useState<CvatDataset | null>(null);

  // Modal Dialogs state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleSwitchRole = (newRole: UserRole) => {
    const user = USERS[newRole];
    if (user) {
      setCurrentUser(user);
      showToast(`Switched active RBAC persona to: ${user.name} (${user.roleTitle})`);
    }
  };

  const handleLaunchTask = (newTaskData: Omit<KubeflowTask, 'id'>) => {
    const newTaskId = `kf-run-${Math.floor(Math.random() * 8999 + 1000)}`;
    const fullTask: KubeflowTask = {
      ...newTaskData,
      id: newTaskId,
    };

    // Add to Kubeflow tasks
    setTasks([fullTask, ...tasks]);

    // Also register an MLflow run
    const newMlflowRun: MlflowRun = {
      runId: fullTask.mlflowRunId,
      runName: fullTask.runName,
      experimentName: fullTask.experimentName,
      framework: fullTask.framework,
      cvatDataset: fullTask.cvatDatasetName,
      status: 'RUNNING',
      user: currentUser.email.split('@')[0],
      startTime: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      duration: '00m 05s',
      parameters: {
        architecture: 'yolov8x-seg-head',
        learning_rate: 0.0001,
        gpus: `${fullTask.gpuCount}x ${fullTask.gpuType}`,
        epochs: fullTask.totalEpochs,
      },
      metrics: {
        trainLoss: fullTask.metricsCurrent.loss,
        valLoss: fullTask.metricsCurrent.valLoss,
        primaryMetric: fullTask.metricsCurrent.accuracyOrMap,
        primaryMetricName: 'mAP@50',
        throughputSamplesSec: 410,
        inferenceLatencyMs: 14.5,
      },
      metricHistory: [
        { epoch: 1, trainLoss: 0.68, valLoss: 0.69, primaryMetric: 0.42, learningRate: 0.00003 },
      ],
      artifactsCount: 2,
      modelRegistered: false,
    };

    setMlflowRuns([newMlflowRun, ...mlflowRuns]);

    // Switch view to Kubeflow Tracker
    setActiveTab('kubeflow');
    showToast(`Pipeline ${fullTask.runName} dispatched to Kubeflow cluster!`);
  };

  const handleCancelTask = (taskId: string) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === taskId) {
          return {
            ...t,
            status: 'Terminated',
            logs: [
              ...t.logs,
              `[${new Date().toISOString().slice(11, 19)}] [KubeFlow-Orchestrator] SIGTERM received from ${currentUser.name}. Worker pods gracefully drained.`,
            ],
            steps: t.steps.map((s) => (s.status === 'Running' ? { ...s, status: 'Terminated' } : s)),
          };
        }
        return t;
      })
    );
    showToast(`Task ${taskId} terminated.`);
  };

  const handleRerunTask = (task: KubeflowTask) => {
    setTasks(
      tasks.map((t) => {
        if (t.id === task.id) {
          return {
            ...t,
            status: 'Running',
            progressPercent: 5,
            currentEpoch: 1,
            logs: [
              ...t.logs,
              `[${new Date().toISOString().slice(11, 19)}] [KubeFlow-Orchestrator] Rerun requested by ${currentUser.name}. Rescheduling pods.`,
            ],
            steps: t.steps.map((s, idx) => ({
              ...s,
              status: idx === 0 ? 'Running' : 'Pending',
            })),
          };
        }
        return t;
      })
    );
    showToast(`Rerun scheduled for task ${task.id}.`);
  };

  const handleSelectMlflowRun = (runId: string) => {
    setSelectedMlflowRunId(runId);
    setActiveTab('mlflow');
  };

  const handlePromoteModel = (modelName: string, targetStage: 'Production' | 'Staging' | 'Archived') => {
    setModelRegistry(
      modelRegistry.map((m) => {
        if (m.modelName === modelName) {
          return {
            ...m,
            stage: targetStage,
            promotedBy: `${currentUser.name} (${currentUser.roleTitle})`,
            lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
            approvalStatus: 'Approved',
          };
        }
        return m;
      })
    );
    showToast(`Model ${modelName} transitioned to stage ${targetStage}.`);
  };

  const handleSelectDatasetForTraining = (dataset: CvatDataset) => {
    setActiveTab('training');
    showToast(`Selected dataset "${dataset.name}" for new training pipeline.`);
  };

  const runningTasksCount = tasks.filter((t) => t.status === 'Running').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* 3-Zone Top Navigation Bar */}
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenProfile={() => setProfileModalOpen(true)}
        runningTasksCount={runningTasksCount}
      />

      {/* Contextual RBAC Status Banner */}
      <RbacBanner currentUser={currentUser} onSwitchRole={handleSwitchRole} />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeTab === 'flow' && (
          <EndToEndPipelineFlow
            currentUser={currentUser}
            cvatDatasets={cvatDatasets}
            frameworks={FRAMEWORKS}
            onPromoteSuccess={(newModelEntry) => {
              setModelRegistry([newModelEntry, ...modelRegistry]);
              showToast(`Model ${newModelEntry.modelName} (${newModelEntry.currentVersion}) promoted to Production in MLflow!`);
            }}
            onNavigateToMlflow={() => setActiveTab('mlflow')}
          />
        )}

        {activeTab === 'training' && (
          <TrainingPipelineStarter
            frameworks={FRAMEWORKS}
            cvatDatasets={cvatDatasets}
            defaultHyperparams={DEFAULT_HYPERPARAMETERS}
            currentUser={currentUser}
            onLaunchTask={handleLaunchTask}
            onViewDatasetModal={(ds) => setPreviewDataset(ds)}
          />
        )}

        {activeTab === 'kubeflow' && (
          <KubeflowTaskTracker
            tasks={tasks}
            currentUser={currentUser}
            onCancelTask={handleCancelTask}
            onRerunTask={handleRerunTask}
            onSelectMlflowRun={handleSelectMlflowRun}
          />
        )}

        {activeTab === 'mlflow' && (
          <MlflowDashboard
            runs={mlflowRuns}
            modelRegistry={modelRegistry}
            currentUser={currentUser}
            initialSelectedRunId={selectedMlflowRunId}
            onPromoteModel={handlePromoteModel}
            onRegisterRunAsModel={(runId, modelName) => {
              showToast(`Model ${modelName} registered from run ${runId}`);
            }}
          />
        )}

        {activeTab === 'cvat' && (
          <CvatDatasetManager
            datasets={cvatDatasets}
            currentUser={currentUser}
            onSelectDatasetForTraining={handleSelectDatasetForTraining}
            onPreviewDataset={(ds) => setPreviewDataset(ds)}
          />
        )}

        {activeTab === 'rbac' && (
          <RbacMatrixView
            currentUser={currentUser}
            onSwitchRole={handleSwitchRole}
          />
        )}

        {activeTab === 'docs' && (
          <InstructionManualPage />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <div>
            <span>NexusML Pipeline Platform</span>
            <span className="mx-2">·</span>
            <span>Kubeflow v1.9.0</span>
            <span className="mx-2">·</span>
            <span>MLflow v2.16.2</span>
            <span className="mx-2">·</span>
            <span>CVAT REST v2</span>
          </div>
          <div>
            Connected cluster: <span className="text-slate-400">gke-ml-cluster-us-east4-a</span>
          </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <CvatPreviewModal
        dataset={previewDataset}
        onClose={() => setPreviewDataset(null)}
        onSelectForPipeline={(ds) => {
          setPreviewDataset(null);
          handleSelectDatasetForTraining(ds);
        }}
      />

      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onSwitchRole={handleSwitchRole}
      />

      <UserSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-slate-700 text-slate-200 text-xs px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2 font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
