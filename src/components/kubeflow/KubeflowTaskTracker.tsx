import React, { useState, useEffect, useRef } from 'react';
import { KubeflowTask, UserProfile, TaskStatus } from '../../types/mlops';
import {
  Activity,
  Terminal,
  Cpu,
  StopCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCode,
  Filter,
  Search,
  ExternalLink,
  ChevronRight,
  Maximize2,
  Zap,
  Lock,
} from 'lucide-react';

interface KubeflowTaskTrackerProps {
  tasks: KubeflowTask[];
  currentUser: UserProfile;
  onCancelTask: (taskId: string) => void;
  onRerunTask: (task: KubeflowTask) => void;
  onSelectMlflowRun: (runId: string) => void;
}

export const KubeflowTaskTracker: React.FC<KubeflowTaskTrackerProps> = ({
  tasks,
  currentUser,
  onCancelTask,
  onRerunTask,
  onSelectMlflowRun,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [activeFilter, setActiveFilter] = useState<'All' | 'Running' | 'Completed' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [logFilterRank, setLogFilterRank] = useState<'all' | 'rank0' | 'orchestrator'>('all');
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [showManifest, setShowManifest] = useState(false);

  const logsEndRef = useRef<HTMLDivElement>(null);

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || tasks[0];

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter =
      activeFilter === 'All' ||
      (activeFilter === 'Running' && task.status === 'Running') ||
      (activeFilter === 'Completed' && task.status === 'Completed') ||
      (activeFilter === 'Failed' && task.status === 'Failed');

    const matchesSearch =
      task.runName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.experimentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.cvatDatasetName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  useEffect(() => {
    if (isAutoScroll && logsEndRef.current) {
      logsEndRef.current.scrollTop = logsEndRef.current.scrollHeight;
    }
  }, [selectedTask?.logs, isAutoScroll]);

  const canKillTasks = currentUser.permissions.canKillTasks;

  const getStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case 'Running':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Running
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-300 font-medium font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
            Completed
          </span>
        );
      case 'Failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            Failed
          </span>
        );
      case 'Terminated':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium font-mono">
            <StopCircle className="w-3.5 h-3.5 text-slate-500" />
            Terminated
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium font-mono">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending
          </span>
        );
    }
  };

  const getFilteredLogs = (logs: string[]) => {
    if (logFilterRank === 'rank0') {
      return logs.filter((l) => l.includes('rank0') || l.includes('torchrun'));
    }
    if (logFilterRank === 'orchestrator') {
      return logs.filter((l) => l.includes('KubeFlow') || l.includes('ingest') || l.includes('eval'));
    }
    return logs;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <span>Kubeflow Running Training Task Track</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time pipeline orchestration DAG, worker pod telemetry, NCCL distributed sync logs, and lifecycle controls.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search runs, models, datasets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-56"
            />
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800 text-xs">
            {(['All', 'Running', 'Completed', 'Failed'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeFilter === filter ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Tasks Table, Right Active Pod Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Task list & Pipeline DAG */}
        <div className="lg:col-span-7 space-y-6">
          {/* Active Task DAG Visualizer */}
          {selectedTask && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold text-white">Kubeflow Pipeline DAG:</span>
                  <span className="font-mono text-slate-300">{selectedTask.runName}</span>
                </div>
                <div className="text-slate-400 font-mono">
                  Epoch {selectedTask.currentEpoch}/{selectedTask.totalEpochs} ({selectedTask.progressPercent}%)
                </div>
              </div>

              {/* Visual Pipeline DAG Flow */}
              <div className="grid grid-cols-5 gap-2 pt-2 pb-1">
                {selectedTask.steps.map((step, idx) => {
                  const isCurrent = step.status === 'Running';
                  const isDone = step.status === 'Completed';
                  const isFailed = step.status === 'Failed' || step.status === 'Terminated';

                  return (
                    <div
                      key={step.id}
                      className={`relative p-2.5 rounded border text-xs flex flex-col justify-between transition-colors ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-emerald-500/80 text-emerald-200'
                          : isDone
                          ? 'bg-slate-950 border-indigo-900/50 text-slate-300'
                          : isFailed
                          ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div>
                        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                          Step 0{idx + 1}
                        </div>
                        <div className="font-medium text-[11px] leading-tight truncate" title={step.name}>
                          {step.name.replace(/-/g, ' ')}
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                        <span>{step.duration}</span>
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />}
                        {isDone && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                        {isFailed && <AlertCircle className="w-3 h-3 text-rose-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    selectedTask.status === 'Failed'
                      ? 'bg-rose-500'
                      : selectedTask.status === 'Completed'
                      ? 'bg-indigo-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${selectedTask.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Tasks Table */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Orchestrated Pipeline Runs ({filteredTasks.length})
              </h2>
              <span className="text-[11px] text-slate-500">Namespace: kubeflow-training-prod</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-4 py-2.5">Pipeline Task / Model</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Progress</th>
                    <th className="px-3 py-2.5">Hardware</th>
                    <th className="px-3 py-2.5">Duration</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredTasks.map((t) => {
                    const isSelected = t.id === selectedTaskId;
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedTaskId(t.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white truncate max-w-[200px]" title={t.runName}>
                            {t.runName}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                            {t.experimentName} · {t.framework}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate max-w-[200px]">
                            CVAT: {t.cvatDatasetName}
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          {getStatusBadge(t.status)}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-mono tabular-nums text-slate-200">
                            {t.currentEpoch}/{t.totalEpochs} ({t.progressPercent}%)
                          </div>
                          <div className="w-16 bg-slate-800 h-1 rounded-full mt-1">
                            <div
                              className="bg-indigo-500 h-1 rounded-full"
                              style={{ width: `${t.progressPercent}%` }}
                            />
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-300">
                          <div>{t.gpuCount}x A100</div>
                          <div className="text-[11px] text-slate-500">
                            {t.status === 'Running' ? `${t.gpuUtilization}% load` : 'Idle'}
                          </div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono text-slate-400">
                          <div>{t.duration}</div>
                          <div className="text-[10px] text-slate-500">{t.initiatedBy.split(' ')[0]}</div>
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {t.status === 'Running' && (
                              <button
                                type="button"
                                disabled={!canKillTasks}
                                onClick={() => onCancelTask(t.id)}
                                className={`p-1.5 rounded transition-colors ${
                                  canKillTasks
                                    ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                                    : 'text-slate-600 cursor-not-allowed'
                                }`}
                                title={canKillTasks ? 'Terminate Kubeflow Job' : 'Insufficient permission to kill task'}
                              >
                                <StopCircle className="w-4 h-4" />
                              </button>
                            )}

                            {t.status === 'Failed' && (
                              <button
                                type="button"
                                disabled={!currentUser.permissions.canStartPipeline}
                                onClick={() => onRerunTask(t)}
                                className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded transition-colors"
                                title="Rerun pipeline task"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => onSelectMlflowRun(t.mlflowRunId)}
                              className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                              title="Inspect in MLflow"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Pod Inspector & Terminal Logs */}
        <div className="lg:col-span-5 space-y-6">
          {selectedTask ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Pod Telemetry & Live Logs</h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowManifest(!showManifest)}
                    className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>{showManifest ? 'View Logs' : 'Manifest YAML'}</span>
                  </button>
                </div>
              </div>

              {/* Pod Resource Gauges */}
              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase">GPU Utilization</div>
                  <div className="text-base font-bold text-emerald-400 mt-1 tabular-nums">
                    {selectedTask.status === 'Running' ? `${selectedTask.gpuUtilization}%` : '0.0%'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{selectedTask.gpuCount}x A100-80GB</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase">VRAM Allocation</div>
                  <div className="text-base font-bold text-indigo-400 mt-1 tabular-nums">
                    {selectedTask.status === 'Running' ? `${selectedTask.vramUsedGb} GB` : '0 GB'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Limit: {selectedTask.vramTotalGb} GB</div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-800/80">
                  <div className="text-slate-400 text-[10px] uppercase">Current Loss</div>
                  <div className="text-base font-bold text-amber-400 mt-1 tabular-nums">
                    {selectedTask.metricsCurrent.loss}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">mAP: {selectedTask.metricsCurrent.accuracyOrMap}</div>
                </div>
              </div>

              {/* Log filter controls */}
              {!showManifest && (
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">Rank filter:</span>
                    <select
                      value={logFilterRank}
                      onChange={(e) => setLogFilterRank(e.target.value as any)}
                      className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-200"
                    >
                      <option value="all">All Workers & Orchestrator</option>
                      <option value="rank0">Worker Rank 0 (Master)</option>
                      <option value="orchestrator">Kubeflow Controller</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={isAutoScroll}
                      onChange={(e) => setIsAutoScroll(e.target.checked)}
                      className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                    />
                    <span>Auto-scroll</span>
                  </label>
                </div>
              )}

              {/* Log Terminal Screen or Manifest YAML */}
              {showManifest ? (
                <div className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] text-slate-300 max-h-80 overflow-y-auto leading-relaxed">
                  <pre>{`apiVersion: kubeflow.org/v1
kind: PyTorchJob
metadata:
  name: ${selectedTask.runName}
  namespace: kubeflow-training-prod
spec:
  pytorchReplicaSpecs:
    Master:
      replicas: 1
      restartPolicy: OnFailure
      template:
        spec:
          containers:
          - name: pytorch
            image: nvidia/pytorch:25.01-py3
            resources:
              limits:
                nvidia.com/gpu: ${selectedTask.gpuCount}
            env:
            - name: CVAT_DATASET_ID
              value: "${selectedTask.cvatDatasetId}"
            - name: MLFLOW_TRACKING_URI
              value: "http://mlflow.internal:5000"
            - name: RUN_ID
              value: "${selectedTask.mlflowRunId}"`}</pre>
                </div>
              ) : (
                <div
                  ref={logsEndRef}
                  className="bg-slate-950 border border-slate-800 rounded p-3 font-mono text-[11px] max-h-80 overflow-y-auto space-y-1 select-text"
                >
                  {getFilteredLogs(selectedTask.logs).map((log, idx) => {
                    const isError = log.includes('ERROR') || log.includes('FAILED') || log.includes('OOM');
                    const isWarning = log.includes('warning') || log.includes('WARNING');
                    const isSuccess = log.includes('PASSED') || log.includes('successfully');

                    return (
                      <div
                        key={idx}
                        className={`leading-relaxed break-all ${
                          isError
                            ? 'text-rose-400 font-semibold'
                            : isWarning
                            ? 'text-amber-400'
                            : isSuccess
                            ? 'text-emerald-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {log}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Cluster & Initiator Metadata footer */}
              <div className="border-t border-slate-800 pt-3 text-xs text-slate-400 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Initiated By:</span>
                  <span className="text-slate-200">{selectedTask.initiatedBy} ({selectedTask.initiatorRole})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>MLflow Linked Run:</span>
                  <button
                    type="button"
                    onClick={() => onSelectMlflowRun(selectedTask.mlflowRunId)}
                    className="text-indigo-400 hover:text-indigo-300 font-mono text-[11px] underline"
                  >
                    {selectedTask.mlflowRunId}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span>Node Pool:</span>
                  <span className="text-slate-300 font-mono text-[11px] truncate max-w-[220px]">
                    {selectedTask.cluster.split('(')[1]?.replace(')', '') || 'gpu-pool-a100'}
                  </span>
                </div>
              </div>

              {/* RBAC Action Enforcement for selected task */}
              {selectedTask.status === 'Running' && (
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={!canKillTasks}
                    onClick={() => onCancelTask(selectedTask.id)}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded flex items-center justify-center gap-2 transition-colors ${
                      canKillTasks
                        ? 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800 text-rose-200'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    {!canKillTasks && <Lock className="w-3.5 h-3.5" />}
                    <StopCircle className="w-3.5 h-3.5" />
                    <span>
                      {canKillTasks ? 'Terminate Active Training Pod' : 'Pod Kill Locked (Requires MLOps / Lead Eng / Admin)'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No task selected. Select a pipeline run to inspect live logs.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
