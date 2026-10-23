export type UserRole = 'mlops_engineer' | 'lead_engineer' | 'product_manager' | 'admin' | 'test_user';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  avatarInitials: string;
  avatarColor: string;
  gpuHoursQuota: {
    used: number;
    total: number;
  };
  storageQuotaTb: {
    used: number;
    total: number;
  };
  permissions: {
    canStartPipeline: boolean;
    canOverrideHyperparams: boolean;
    canKillTasks: boolean;
    canPromoteModels: boolean;
    canEditSystemConfig: boolean;
    canManageUsers: boolean;
    isReadOnly: boolean;
  };
}

export interface MLFramework {
  id: string;
  name: string;
  version: string;
  category: 'Computer Vision' | 'Transformers / LLM' | 'Multimodal' | 'Tabular / Classical';
  defaultRuntime: string;
  supportedRuntimes: string[];
  recommendedOptimizers: string[];
}

export interface CvatDataset {
  id: string;
  name: string;
  project: string;
  format: 'COCO 1.0' | 'YOLOv8 Darknet' | 'Pascal VOC' | 'CVAT XML 1.1' | 'TFRecord';
  version: string;
  totalImages: number;
  annotatedFrames: number;
  classesCount: number;
  classes: string[];
  splits: {
    train: number;
    val: number;
    test: number;
  };
  lastSynced: string;
  status: 'Ready' | 'Validating' | 'Syncing';
  checksum: string;
}

export interface HyperparametersConfig {
  architecture: string;
  learningRate: number;
  lrScheduler: 'cosine_with_restarts' | 'linear_warmup' | 'polynomial' | 'step_decay' | 'constant';
  warmupEpochs: number;
  batchSize: number;
  epochs: number;
  optimizer: 'AdamW' | 'SGD' | 'Lion' | 'RMSprop' | 'Adafactor';
  weightDecay: number;
  precision: 'bf16' | 'fp16' | 'tf32' | 'fp32' | 'int8';
  distributedStrategy: 'torchrun (DDP)' | 'DeepSpeed ZeRO-2' | 'DeepSpeed ZeRO-3' | 'FSDP' | 'Single-Node';
  gpuType: 'NVIDIA A100-80GB' | 'NVIDIA H100-80GB' | 'NVIDIA L40S' | 'NVIDIA RTX 4090';
  gpuCount: number;
  cpuCores: number;
  ramGb: number;
  customParameters: { key: string; value: string }[];
}

export type TaskStatus = 'Running' | 'Completed' | 'Failed' | 'Pending' | 'Terminated';

export interface PipelineStep {
  id: string;
  name: string;
  stepType: 'data-ingest' | 'preprocess' | 'train' | 'evaluate' | 'register';
  status: TaskStatus;
  duration: string;
  podName: string;
  workerCount?: number;
}

export interface KubeflowTask {
  id: string;
  runName: string;
  experimentName: string;
  framework: string;
  cvatDatasetId: string;
  cvatDatasetName: string;
  status: TaskStatus;
  progressPercent: number;
  currentEpoch: number;
  totalEpochs: number;
  startTime: string;
  duration: string;
  initiatedBy: string;
  initiatorRole: string;
  cluster: string;
  gpuType: string;
  gpuCount: number;
  gpuUtilization: number;
  cpuUtilization: number;
  vramUsedGb: number;
  vramTotalGb: number;
  steps: PipelineStep[];
  logs: string[];
  metricsCurrent: {
    loss: number;
    valLoss: number;
    accuracyOrMap: number;
  };
  mlflowRunId: string;
}

export interface MetricDataPoint {
  epoch: number;
  trainLoss: number;
  valLoss: number;
  primaryMetric: number; // mAP@50 or Accuracy
  learningRate: number;
}

export interface MlflowRun {
  runId: string;
  runName: string;
  experimentName: string;
  framework: string;
  cvatDataset: string;
  status: 'FINISHED' | 'RUNNING' | 'FAILED';
  user: string;
  startTime: string;
  duration: string;
  parameters: Record<string, string | number>;
  metrics: {
    trainLoss: number;
    valLoss: number;
    primaryMetric: number;
    primaryMetricName: string;
    throughputSamplesSec: number;
    inferenceLatencyMs: number;
  };
  metricHistory: MetricDataPoint[];
  artifactsCount: number;
  modelRegistered: boolean;
  registeredModelName?: string;
  modelStage?: 'Production' | 'Staging' | 'Archived' | 'None';
  modelVersion?: string;
}

export interface ModelRegistryEntry {
  modelName: string;
  currentVersion: string;
  stage: 'Production' | 'Staging' | 'Archived';
  framework: string;
  sourceRunId: string;
  cvatDataset: string;
  metricSummary: string;
  lastUpdated: string;
  promotedBy: string;
  approvalStatus: 'Approved' | 'Pending Review' | 'Rejected';
}

export interface DataValidationReport {
  checksumValid: boolean;
  totalFrames: number;
  corruptedFrames: number;
  unlabeledFrames: number;
  splitsRatioValid: boolean;
  classDistributionBalanced: boolean;
  classesDetected: string[];
  validationErrors: string[];
}

export interface TrainingValidationReport {
  epoch: number;
  valLoss: number;
  map50: number;
  precision: number;
  recall: number;
  f1Score: number;
  confusionMatrixGenerated: boolean;
  overfittingDetected: boolean;
}

export interface MetricsGateConfig {
  gateMode: 'auto' | 'manual_approval';
  minMap50: number;
  minPrecision: number;
  minRecall: number;
  approvalStatus: 'Pending' | 'Auto-Approved' | 'Approved' | 'Rejected';
  approvedBy?: string;
  notes?: string;
}

export type E2EStageKey =
  | 'data_ingest'
  | 'data_validation'
  | 'training'
  | 'training_validation'
  | 'metrics_gate'
  | 'mlflow_promotion';

export interface E2EStageState {
  key: E2EStageKey;
  title: string;
  subtitle: string;
  status: 'Pending' | 'In Progress' | 'Passed' | 'Failed' | 'Awaiting Approval';
  duration?: string;
  logs?: string[];
}

