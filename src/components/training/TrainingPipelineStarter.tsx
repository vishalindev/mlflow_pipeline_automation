import React, { useState } from 'react';
import {
  MLFramework,
  CvatDataset,
  HyperparametersConfig,
  UserProfile,
  KubeflowTask,
} from '../../types/mlops';
import {
  Play,
  Layers,
  Database,
  Sliders,
  Server,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Lock,
  ExternalLink,
  RefreshCw,
  Terminal,
} from 'lucide-react';

interface TrainingPipelineStarterProps {
  frameworks: MLFramework[];
  cvatDatasets: CvatDataset[];
  defaultHyperparams: HyperparametersConfig;
  currentUser: UserProfile;
  onLaunchTask: (newTask: Omit<KubeflowTask, 'id'>) => void;
  onViewDatasetModal: (dataset: CvatDataset) => void;
}

export const TrainingPipelineStarter: React.FC<TrainingPipelineStarterProps> = ({
  frameworks,
  cvatDatasets,
  defaultHyperparams,
  currentUser,
  onLaunchTask,
  onViewDatasetModal,
}) => {
  // Form State
  const [pipelineRunName, setPipelineRunName] = useState(
    `train-run-${new Date().toISOString().slice(5, 10).replace('-', '')}-${Math.floor(Math.random() * 899 + 100)}`
  );
  const [experimentName, setExperimentName] = useState('Perception-Obstacle-Detection');
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>(frameworks[0].id);
  const [selectedRuntime, setSelectedRuntime] = useState<string>(frameworks[0].defaultRuntime);
  const [selectedCvatId, setSelectedCvatId] = useState<string>(cvatDatasets[0].id);

  // Hyperparameters
  const [hyperparams, setHyperparams] = useState<HyperparametersConfig>({ ...defaultHyperparams });

  // Custom key-value params
  const [customParams, setCustomParams] = useState<{ key: string; value: string }[]>([
    ...defaultHyperparams.customParameters,
  ]);

  // Validation & dry run state
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunPassed, setDryRunPassed] = useState<boolean | null>(null);
  const [dryRunMessages, setDryRunMessages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'architecture' | 'optimization' | 'hardware' | 'custom'>('architecture');

  const selectedFramework = frameworks.find((f) => f.id === selectedFrameworkId) || frameworks[0];
  const selectedCvat = cvatDatasets.find((d) => d.id === selectedCvatId) || cvatDatasets[0];

  const canStartPipeline = currentUser.permissions.canStartPipeline;

  // Presets
  const applyPreset = (presetName: string) => {
    if (presetName === 'yolo_seg') {
      setSelectedFrameworkId('pytorch');
      setSelectedRuntime('CUDA 12.4 · FlashAttention-2');
      setHyperparams({
        ...hyperparams,
        architecture: 'yolov8x-seg-head',
        learningRate: 0.0001,
        lrScheduler: 'cosine_with_restarts',
        batchSize: 32,
        epochs: 50,
        optimizer: 'AdamW',
        weightDecay: 0.005,
        precision: 'bf16',
        distributedStrategy: 'torchrun (DDP)',
        gpuType: 'NVIDIA A100-80GB',
        gpuCount: 4,
      });
    } else if (presetName === 'vit_transformer') {
      setSelectedFrameworkId('transformers');
      setSelectedRuntime('CUDA 12.4 · Accelerate · DeepSpeed ZeRO-3');
      setHyperparams({
        ...hyperparams,
        architecture: 'swin-transformer-base-patch4',
        learningRate: 0.00005,
        lrScheduler: 'linear_warmup',
        batchSize: 16,
        epochs: 40,
        optimizer: 'Lion',
        weightDecay: 0.01,
        precision: 'bf16',
        distributedStrategy: 'DeepSpeed ZeRO-3',
        gpuType: 'NVIDIA H100-80GB',
        gpuCount: 4,
      });
    } else if (presetName === 'resnet_baseline') {
      setSelectedFrameworkId('tensorflow');
      setSelectedRuntime('CUDA 12.2 · XLA JIT');
      setHyperparams({
        ...hyperparams,
        architecture: 'resnet50-v2-fpn',
        learningRate: 0.001,
        lrScheduler: 'step_decay',
        batchSize: 64,
        epochs: 30,
        optimizer: 'SGD',
        weightDecay: 0.0001,
        precision: 'fp16',
        distributedStrategy: 'torchrun (DDP)',
        gpuType: 'NVIDIA A100-80GB',
        gpuCount: 2,
      });
    }
  };

  const handleFrameworkChange = (fId: string) => {
    setSelectedFrameworkId(fId);
    const fw = frameworks.find((f) => f.id === fId);
    if (fw) {
      setSelectedRuntime(fw.defaultRuntime);
      if (!fw.recommendedOptimizers.includes(hyperparams.optimizer)) {
        setHyperparams((prev) => ({
          ...prev,
          optimizer: fw.recommendedOptimizers[0] as any,
        }));
      }
    }
  };

  const addCustomParam = () => {
    setCustomParams([...customParams, { key: '', value: '' }]);
  };

  const removeCustomParam = (index: number) => {
    setCustomParams(customParams.filter((_, i) => i !== index));
  };

  const updateCustomParam = (index: number, field: 'key' | 'value', val: string) => {
    const updated = [...customParams];
    updated[index][field] = val;
    setCustomParams(updated);
  };

  // Perform dry run checks
  const runDryRunCheck = () => {
    setIsDryRunning(true);
    setDryRunPassed(null);
    setDryRunMessages([]);

    setTimeout(() => {
      const messages: string[] = [];
      let passed = true;

      // Check GPU quota
      const requestedGpuHoursEst = (hyperparams.epochs * 0.04 * hyperparams.gpuCount).toFixed(1);
      const remainingQuota = currentUser.gpuHoursQuota.total - currentUser.gpuHoursQuota.used;

      if (parseFloat(requestedGpuHoursEst) > remainingQuota) {
        messages.push(`Cluster quota warning: Estimated GPU hours (${requestedGpuHoursEst}h) exceeds remaining quota (${remainingQuota}h).`);
        passed = false;
      } else {
        messages.push(`GPU quota verified: Estimated ~${requestedGpuHoursEst} GPU-hours against ${remainingQuota} available.`);
      }

      // Check CVAT dataset
      if (selectedCvat.status !== 'Ready') {
        messages.push(`CVAT Dataset ${selectedCvat.name} is not in 'Ready' state.`);
        passed = false;
      } else {
        messages.push(`CVAT Data valid: ${selectedCvat.annotatedFrames.toLocaleString()} frames, checksum ${selectedCvat.checksum} verified.`);
      }

      // Check framework and precision compatibility
      messages.push(`Container image: ${selectedFramework.name} with ${selectedRuntime} validated on node pool.`);
      messages.push(`Distributed topology: ${hyperparams.distributedStrategy} on ${hyperparams.gpuCount}x ${hyperparams.gpuType} initialized.`);

      setDryRunPassed(passed);
      setDryRunMessages(messages);
      setIsDryRunning(false);
    }, 450);
  };

  // Dispatch launch
  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canStartPipeline) return;

    const newTaskData: Omit<KubeflowTask, 'id'> = {
      runName: pipelineRunName,
      experimentName: experimentName,
      framework: selectedFramework.name,
      cvatDatasetId: selectedCvat.id,
      cvatDatasetName: selectedCvat.name,
      status: 'Running',
      progressPercent: 2,
      currentEpoch: 1,
      totalEpochs: hyperparams.epochs,
      startTime: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
      duration: '00m 05s',
      initiatedBy: currentUser.name,
      initiatorRole: currentUser.roleTitle,
      cluster: `gke-ml-cluster-us-east4-a (Node Pool: ${hyperparams.gpuType.toLowerCase().replace(/\s+/g, '-')})`,
      gpuType: hyperparams.gpuType,
      gpuCount: hyperparams.gpuCount,
      gpuUtilization: 98.4,
      cpuUtilization: 72.1,
      vramUsedGb: Math.min(hyperparams.batchSize * 1.8, 76.5),
      vramTotalGb: 80.0,
      steps: [
        { id: 'st-1', name: 'data-ingest-cvat', stepType: 'data-ingest', status: 'Running', duration: '0m 05s', podName: `kf-pod-cvat-${pipelineRunName}` },
        { id: 'st-2', name: 'data-preprocess-aug', stepType: 'preprocess', status: 'Pending', duration: '--', podName: `kf-pod-prep-${pipelineRunName}` },
        { id: 'st-3', name: 'distributed-training-worker', stepType: 'train', status: 'Pending', duration: '--', podName: `kf-pod-train-${pipelineRunName}`, workerCount: hyperparams.gpuCount },
        { id: 'st-4', name: 'model-eval-benchmark', stepType: 'evaluate', status: 'Pending', duration: '--', podName: `kf-pod-eval-${pipelineRunName}` },
        { id: 'st-5', name: 'mlflow-log-register', stepType: 'register', status: 'Pending', duration: '--', podName: `kf-pod-mlflow-${pipelineRunName}` },
      ],
      logs: [
        `[${new Date().toISOString().slice(11, 19)}] [KubeFlow-Orchestrator] Initializing DAG for pipeline run: ${pipelineRunName}`,
        `[${new Date().toISOString().slice(11, 19)}] [KubeFlow-Orchestrator] Provisioning ${hyperparams.gpuCount}x ${hyperparams.gpuType} nodes on Kubeflow namespace: kubeflow-training-prod`,
        `[${new Date().toISOString().slice(11, 19)}] [data-ingest-cvat] Fetching annotations from CVAT Project: ${selectedCvat.project} (Format: ${selectedCvat.format})`,
      ],
      metricsCurrent: {
        loss: 0.68,
        valLoss: 0.69,
        accuracyOrMap: 0.42,
      },
      mlflowRunId: `mlf-run-${Math.floor(Math.random() * 8999 + 1000)}`,
    };

    onLaunchTask(newTaskData);
  };

  const effectiveBatchSize = hyperparams.batchSize * hyperparams.gpuCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header zone with title & quick presets */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Training Start Pipeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure framework runtime, bind validated CVAT annotation sets, tune distributed hyperparameters, and dispatch to Kubeflow.
          </p>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Quick Presets:</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => applyPreset('yolo_seg')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              YOLOv8 Seg
            </button>
            <button
              type="button"
              onClick={() => applyPreset('vit_transformer')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              Swin ViT
            </button>
            <button
              type="button"
              onClick={() => applyPreset('resnet_baseline')}
              className="px-2.5 py-1 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-colors"
            >
              ResNet Baseline
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleLaunch} className="space-y-6">
        {/* Top Identification Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Pipeline Run Name <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              value={pipelineRunName}
              onChange={(e) => setPipelineRunName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
              placeholder="e.g. train-yolov8-obstacle-exp05"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              MLflow Experiment Tag <span className="text-indigo-400">*</span>
            </label>
            <input
              type="text"
              required
              value={experimentName}
              onChange={(e) => setExperimentName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Perception-Obstacle-Detection"
            />
          </div>
        </div>

        {/* 2-Column Core: Framework Selection & CVAT Data Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Module 1: Framework Selection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-semibold text-white">1. Framework & Runtime Selection</h2>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">CUDA 12.4+ Ready</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Deep Learning Framework
                </label>
                <select
                  value={selectedFrameworkId}
                  onChange={(e) => handleFrameworkChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {frameworks.map((fw) => (
                    <option key={fw.id} value={fw.id}>
                      {fw.name} ({fw.version}) · {fw.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Execution Container Runtime & Acceleration
                </label>
                <select
                  value={selectedRuntime}
                  onChange={(e) => setSelectedRuntime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {selectedFramework.supportedRuntimes.map((rt) => (
                    <option key={rt} value={rt}>
                      {rt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Framework Specs Quick Info */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800/70 text-xs space-y-1.5 font-mono">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Engine:</span>
                  <span className="text-slate-200">{selectedFramework.name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Target Kernel:</span>
                  <span className="text-emerald-400">{selectedRuntime}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Supported Optimizers:</span>
                  <span className="text-slate-300">{selectedFramework.recommendedOptimizers.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module 2: CVAT Data Selection */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">2. CVAT Annotation Dataset Selection</h2>
              </div>
              <button
                type="button"
                onClick={() => onViewDatasetModal(selectedCvat)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Inspect Dataset</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  CVAT Project Dataset Task
                </label>
                <select
                  value={selectedCvatId}
                  onChange={(e) => setSelectedCvatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  {cvatDatasets.map((ds) => (
                    <option key={ds.id} value={ds.id}>
                      {ds.name} · {ds.format} ({ds.totalImages.toLocaleString()} frames)
                    </option>
                  ))}
                </select>
              </div>

              {/* CVAT Data Metadata Panel */}
              <div className="bg-slate-950 p-3 rounded border border-slate-800/70 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Project Lineage:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[240px]">{selectedCvat.project}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Annotation Format:</span>
                  <span className="font-mono text-emerald-400">{selectedCvat.format}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Dataset Split:</span>
                  <span className="font-mono text-slate-300">
                    {selectedCvat.splits.train}% Train · {selectedCvat.splits.val}% Val · {selectedCvat.splits.test}% Test
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Class Categories ({selectedCvat.classesCount}):</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[240px]">
                    {selectedCvat.classes.join(', ')}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
                  <span className="text-slate-500 font-mono">{selectedCvat.checksum}</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Synced
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Hyperparameters Input */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-semibold text-white">3. Hyperparameters & Distributed Execution</h2>
            </div>

            {/* Hyperparameter Tab Filter */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('architecture')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'architecture' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Model Backbone
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('optimization')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'optimization' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Optimization
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hardware')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'hardware' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Compute & Nodes
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeTab === 'custom' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Key-Values ({customParams.length})
              </button>
            </div>
          </div>

          {/* Tab 1: Architecture */}
          {activeTab === 'architecture' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Backbone / Architecture Identifier
                </label>
                <input
                  type="text"
                  value={hyperparams.architecture}
                  onChange={(e) => setHyperparams({ ...hyperparams, architecture: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. yolov8x-seg-head"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Pre-trained weights initialized</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Mixed Precision Format
                </label>
                <select
                  value={hyperparams.precision}
                  onChange={(e) => setHyperparams({ ...hyperparams, precision: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="bf16">bfloat16 (Ampere / Hopper Native)</option>
                  <option value="fp16">float16 (Standard Mixed Precision)</option>
                  <option value="tf32">TF32 (TensorFloat-32)</option>
                  <option value="fp32">float32 (Full Precision Single)</option>
                  <option value="int8">int8 (Quantized QLoRA)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">Auto Mixed Precision (AMP)</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Distributed Topology
                </label>
                <select
                  value={hyperparams.distributedStrategy}
                  onChange={(e) => setHyperparams({ ...hyperparams, distributedStrategy: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="torchrun (DDP)">torchrun (PyTorch Distributed Data Parallel)</option>
                  <option value="DeepSpeed ZeRO-2">DeepSpeed ZeRO-2 (Optimizer + Gradient Shard)</option>
                  <option value="DeepSpeed ZeRO-3">DeepSpeed ZeRO-3 (Full Parameter Sharding)</option>
                  <option value="FSDP">PyTorch FSDP (Fully Sharded Data Parallel)</option>
                  <option value="Single-Node">Single-Node Worker (No Ring Sync)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">NCCL backend inter-GPU</span>
              </div>
            </div>
          )}

          {/* Tab 2: Optimization */}
          {activeTab === 'optimization' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Learning Rate
                </label>
                <input
                  type="number"
                  step="0.00001"
                  value={hyperparams.learningRate}
                  onChange={(e) => setHyperparams({ ...hyperparams, learningRate: parseFloat(e.target.value) || 0.0001 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Base LR: {hyperparams.learningRate.toExponential()}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  LR Scheduler
                </label>
                <select
                  value={hyperparams.lrScheduler}
                  onChange={(e) => setHyperparams({ ...hyperparams, lrScheduler: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="cosine_with_restarts">Cosine Annealing w/ Restarts</option>
                  <option value="linear_warmup">Linear Decay w/ Warmup</option>
                  <option value="step_decay">MultiStep LR Decay</option>
                  <option value="polynomial">Polynomial Decay</option>
                  <option value="constant">Constant LR</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">Warmup: {hyperparams.warmupEpochs} epochs</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Batch Size Per GPU
                </label>
                <input
                  type="number"
                  min="1"
                  max="1024"
                  value={hyperparams.batchSize}
                  onChange={(e) => setHyperparams({ ...hyperparams, batchSize: parseInt(e.target.value) || 32 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
                <span className="text-[11px] text-indigo-400 mt-1 block font-mono">
                  Effective Batch Size: {effectiveBatchSize}
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Max Training Epochs
                </label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={hyperparams.epochs}
                  onChange={(e) => setHyperparams({ ...hyperparams, epochs: parseInt(e.target.value) || 50 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Est. 25,000 steps</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Optimizer Engine
                </label>
                <select
                  value={hyperparams.optimizer}
                  onChange={(e) => setHyperparams({ ...hyperparams, optimizer: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="AdamW">AdamW (Decoupled Weight Decay)</option>
                  <option value="SGD">SGD + Nesterov Momentum</option>
                  <option value="Lion">Lion (EvoLved Sign Momentum)</option>
                  <option value="RMSprop">RMSprop</option>
                  <option value="Adafactor">Adafactor (Memory Adaptive)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Weight Decay (L2 Penalty)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={hyperparams.weightDecay}
                  onChange={(e) => setHyperparams({ ...hyperparams, weightDecay: parseFloat(e.target.value) || 0.005 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Warmup Epochs
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={hyperparams.warmupEpochs}
                  onChange={(e) => setHyperparams({ ...hyperparams, warmupEpochs: parseInt(e.target.value) || 3 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
              </div>
            </div>
          )}

          {/* Tab 3: Hardware & Cluster Allocation */}
          {activeTab === 'hardware' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  GPU Accelerator Type
                </label>
                <select
                  value={hyperparams.gpuType}
                  onChange={(e) => setHyperparams({ ...hyperparams, gpuType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="NVIDIA A100-80GB">NVIDIA A100-80GB SXM4</option>
                  <option value="NVIDIA H100-80GB">NVIDIA H100-80GB SXM5</option>
                  <option value="NVIDIA L40S">NVIDIA L40S 48GB</option>
                  <option value="NVIDIA RTX 4090">NVIDIA RTX 4090 24GB</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block">Cluster: gke-ml-cluster-us-east4</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  GPU Worker Count
                </label>
                <select
                  value={hyperparams.gpuCount}
                  onChange={(e) => setHyperparams({ ...hyperparams, gpuCount: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                >
                  <option value={1}>1 GPU (Single-Node Dev)</option>
                  <option value={2}>2 GPUs (DDP Dual)</option>
                  <option value={4}>4 GPUs (DDP Quad Pod)</option>
                  <option value={8}>8 GPUs (Full Node Slice)</option>
                  <option value={16}>16 GPUs (Multi-Node SuperPOD)</option>
                </select>
                <span className="text-[11px] text-slate-500 mt-1 block font-mono">
                  Total VRAM: {hyperparams.gpuCount * 80} GB
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Host CPU Cores
                </label>
                <input
                  type="number"
                  min="4"
                  max="128"
                  value={hyperparams.cpuCores}
                  onChange={(e) => setHyperparams({ ...hyperparams, cpuCores: parseInt(e.target.value) || 32 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">DataLoader workers: {Math.floor(hyperparams.cpuCores / 4)}</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Host System RAM (GB)
                </label>
                <input
                  type="number"
                  min="16"
                  max="1024"
                  value={hyperparams.ramGb}
                  onChange={(e) => setHyperparams({ ...hyperparams, ramGb: parseInt(e.target.value) || 128 })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 tabular-nums"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">Shared memory (/dev/shm: 32GB)</span>
              </div>
            </div>
          )}

          {/* Tab 4: Custom Key-Values */}
          {activeTab === 'custom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Pass arbitrary CLI flags or environment variables to the trainer script:</span>
                <button
                  type="button"
                  onClick={addCustomParam}
                  className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </div>

              {customParams.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-800 rounded text-xs text-slate-500">
                  No custom parameters defined. Click "Add Parameter" to configure custom flags (e.g. --ema_decay, --iou_threshold).
                </div>
              ) : (
                <div className="space-y-2">
                  {customParams.map((cp, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Parameter Name (e.g. clip_grad_norm)"
                        value={cp.key}
                        onChange={(e) => updateCustomParam(idx, 'key', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <span className="text-slate-500 font-mono text-xs">=</span>
                      <input
                        type="text"
                        placeholder="Value (e.g. 1.0)"
                        value={cp.value}
                        onChange={(e) => updateCustomParam(idx, 'value', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomParam(idx)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remove parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dry-Run Pre-Flight Status */}
        {dryRunMessages.length > 0 && (
          <div className={`p-4 rounded-lg border text-xs font-mono space-y-1.5 ${
            dryRunPassed ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-rose-950/40 border-rose-800 text-rose-300'
          }`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {dryRunPassed ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
              <span>Pre-Flight Validation {dryRunPassed ? 'Passed' : 'Failed'}</span>
            </div>
            {dryRunMessages.map((msg, i) => (
              <div key={i} className="text-[11px] opacity-90 pl-6">
                • {msg}
              </div>
            ))}
          </div>
        )}

        {/* Action Bar & RBAC Permission Enforcer */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/90 p-4 rounded-lg border border-slate-800">
          <div className="text-xs text-slate-400">
            {!canStartPipeline ? (
              <div className="flex items-center gap-2 text-amber-400">
                <Lock className="w-4 h-4 shrink-0" />
                <span>
                  Role Restricted: <strong>{currentUser.roleTitle}</strong> has read-only privileges. Switch to MLOps Engineer, Lead Engineer, or Admin to dispatch runs.
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Operator: <strong>{currentUser.name}</strong> · Training will register directly to Kubeflow Pipeline orchestrator & MLflow server.
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Dry Run Button */}
            <button
              type="button"
              onClick={runDryRunCheck}
              disabled={isDryRunning}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors flex items-center gap-2"
            >
              {isDryRunning ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : (
                <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span>Dry-Run Pre-Flight</span>
            </button>

            {/* Launch Training Pipeline Button */}
            <button
              type="submit"
              disabled={!canStartPipeline}
              className={`px-5 py-2 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${
                canStartPipeline
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Pipeline on Kubeflow</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
