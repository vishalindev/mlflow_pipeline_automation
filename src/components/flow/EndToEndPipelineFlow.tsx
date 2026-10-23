import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  CvatDataset,
  MLFramework,
  DataValidationReport,
  TrainingValidationReport,
  MetricsGateConfig,
  E2EStageKey,
  ModelRegistryEntry,
} from '../../types/mlops';
import {
  GitCommit,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Award,
  ChevronRight,
  Database,
  Cpu,
  Layers,
  FileCheck,
  TrendingUp,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

interface EndToEndPipelineFlowProps {
  currentUser: UserProfile;
  cvatDatasets: CvatDataset[];
  frameworks: MLFramework[];
  onPromoteSuccess: (entry: ModelRegistryEntry) => void;
  onNavigateToMlflow: () => void;
}

export const EndToEndPipelineFlow: React.FC<EndToEndPipelineFlowProps> = ({
  currentUser,
  cvatDatasets,
  frameworks,
  onPromoteSuccess,
  onNavigateToMlflow,
}) => {
  // Active selection
  const [selectedDataset, setSelectedDataset] = useState<CvatDataset>(cvatDatasets[0]);
  const [selectedFramework, setSelectedFramework] = useState<MLFramework>(frameworks[0]);
  const [modelTargetName, setModelTargetName] = useState('PerceptionObstacleDetector');
  const [targetVersion, setTargetVersion] = useState('v3.3.0');

  // Gate configuration
  const [gateMode, setGateMode] = useState<'auto' | 'manual_approval'>('manual_approval');
  const [minMap, setMinMap] = useState<number>(0.82);
  const [minPrecision, setMinPrecision] = useState<number>(0.85);
  const [minRecall, setMinRecall] = useState<number>(0.80);

  // Flow Execution State
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTabInspection, setActiveTabInspection] = useState<E2EStageKey>('data_validation');

  // Simulation metrics
  const [currentEpoch, setCurrentEpoch] = useState<number>(0);
  const [totalEpochs] = useState<number>(20);
  const [currentTrainLoss, setCurrentTrainLoss] = useState<number>(0.68);
  const [actualMap, setActualMap] = useState<number>(0.865);
  const [actualPrecision, setActualPrecision] = useState<number>(0.892);
  const [actualRecall, setActualRecall] = useState<number>(0.847);
  const [approvalStatus, setApprovalStatus] = useState<'Pending' | 'Auto-Approved' | 'Approved' | 'Rejected'>('Pending');
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // Data Validation Report
  const dataValidationReport: DataValidationReport = {
    checksumValid: true,
    totalFrames: selectedDataset.totalImages,
    corruptedFrames: 0,
    unlabeledFrames: 0,
    splitsRatioValid: true,
    classDistributionBalanced: true,
    classesDetected: selectedDataset.classes,
    validationErrors: [],
  };

  // Training Validation Report
  const trainingValidationReport: TrainingValidationReport = {
    epoch: totalEpochs,
    valLoss: 0.188,
    map50: actualMap,
    precision: actualPrecision,
    recall: actualRecall,
    f1Score: parseFloat(((2 * actualPrecision * actualRecall) / (actualPrecision + actualRecall)).toFixed(3)),
    confusionMatrixGenerated: true,
    overfittingDetected: false,
  };

  // Stage definitions
  const stages: {
    key: E2EStageKey;
    title: string;
    stageNumber: string;
    shortDesc: string;
  }[] = [
    { key: 'data_ingest', title: 'Data Ingestion Started', stageNumber: '01', shortDesc: 'Mount CVAT raw frames & format' },
    { key: 'data_validation', title: 'Data Validation Step', stageNumber: '02', shortDesc: 'Schema & bounding box integrity' },
    { key: 'training', title: 'Distributed Training', stageNumber: '03', shortDesc: 'Multi-GPU torchrun DDP cluster' },
    { key: 'training_validation', title: 'Training Validation Step', stageNumber: '04', shortDesc: 'mAP@50, Precision, Recall benchmark' },
    { key: 'metrics_gate', title: 'Metrics Gate (Auto/Approval)', stageNumber: '05', shortDesc: 'Quality threshold decision gate' },
    { key: 'mlflow_promotion', title: 'Promote to MLflow', stageNumber: '06', shortDesc: 'Model Registry version registration' },
  ];

  const canApprove = currentUser.permissions.canPromoteModels;

  // Step progression simulator
  useEffect(() => {
    let timer: any;
    if (isRunning) {
      if (currentStageIndex === 0) {
        // Data Ingestion
        timer = setTimeout(() => {
          setCurrentStageIndex(1);
          setActiveTabInspection('data_validation');
        }, 1200);
      } else if (currentStageIndex === 1) {
        // Data Validation
        timer = setTimeout(() => {
          setCurrentStageIndex(2);
          setActiveTabInspection('training');
        }, 1400);
      } else if (currentStageIndex === 2) {
        // Training Loop simulation
        if (currentEpoch < totalEpochs) {
          timer = setTimeout(() => {
            setCurrentEpoch((prev) => prev + 4);
            setCurrentTrainLoss((prev) => Math.max(0.12, parseFloat((prev - 0.1).toFixed(3))));
          }, 350);
        } else {
          setCurrentStageIndex(3);
          setActiveTabInspection('training_validation');
        }
      } else if (currentStageIndex === 3) {
        // Training Validation Step
        timer = setTimeout(() => {
          setCurrentStageIndex(4);
          setActiveTabInspection('metrics_gate');
          if (gateMode === 'auto') {
            const passed =
              actualMap >= minMap &&
              actualPrecision >= minPrecision &&
              actualRecall >= minRecall;
            if (passed) {
              setApprovalStatus('Auto-Approved');
              setTimeout(() => {
                setCurrentStageIndex(5);
                setActiveTabInspection('mlflow_promotion');
                setIsRunning(false);
              }, 1200);
            } else {
              setApprovalStatus('Rejected');
              setIsRunning(false);
            }
          } else {
            // Manual approval mode pauses execution here
            setIsRunning(false);
          }
        }, 1200);
      }
    }
    return () => clearTimeout(timer);
  }, [isRunning, currentStageIndex, currentEpoch, totalEpochs, gateMode, actualMap, actualPrecision, actualRecall, minMap, minPrecision, minRecall]);

  const handleStartFlow = () => {
    setCurrentStageIndex(0);
    setCurrentEpoch(0);
    setCurrentTrainLoss(0.68);
    setApprovalStatus('Pending');
    setRejectionReason('');
    setIsRunning(true);
    setActiveTabInspection('data_ingest');
  };

  const handleResetFlow = () => {
    setIsRunning(false);
    setCurrentStageIndex(0);
    setCurrentEpoch(0);
    setCurrentTrainLoss(0.68);
    setApprovalStatus('Pending');
    setRejectionReason('');
    setActiveTabInspection('data_validation');
  };

  const handleManualApprove = () => {
    if (!canApprove) return;
    setApprovalStatus('Approved');
    setCurrentStageIndex(5);
    setActiveTabInspection('mlflow_promotion');

    // Register into MLflow
    onPromoteSuccess({
      modelName: modelTargetName,
      currentVersion: targetVersion,
      stage: 'Production',
      framework: selectedFramework.name,
      sourceRunId: `kf-flow-${Math.floor(Math.random() * 8999 + 1000)}`,
      cvatDataset: selectedDataset.name,
      metricSummary: `mAP@50: ${(actualMap * 100).toFixed(1)}% · Prec: ${(actualPrecision * 100).toFixed(1)}% · Rec: ${(actualRecall * 100).toFixed(1)}%`,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC',
      promotedBy: `${currentUser.name} (${currentUser.roleTitle})`,
      approvalStatus: 'Approved',
    });
  };

  const handleManualReject = () => {
    if (!canApprove) return;
    setApprovalStatus('Rejected');
    setRejectionReason('Recall falls below minimum margin for edge-case pedestrian occlusion.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Page Title & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitCommit className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              End-to-End MLOps Pipeline Flow
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete sequential lifecycle: Training Started → Data Validation → Training → Training Validation → Metrics Auto/Approval Gate → MLflow Promotion.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetFlow}
            disabled={isRunning}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 border border-slate-700 rounded transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Pipeline</span>
          </button>

          <button
            type="button"
            onClick={handleStartFlow}
            disabled={isRunning}
            className={`px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-colors ${
              isRunning
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
            }`}
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Pipeline In Progress...' : 'Run End-to-End Pipeline'}</span>
          </button>
        </div>
      </div>

      {/* Pipeline Config Bar: Framework, CVAT Data, Gate Mode */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900/60 p-4 rounded-lg border border-slate-800 text-xs">
        <div>
          <label className="text-slate-400 font-medium block mb-1">Target Framework</label>
          <select
            value={selectedFramework.id}
            onChange={(e) => {
              const fw = frameworks.find((f) => f.id === e.target.value);
              if (fw) setSelectedFramework(fw);
            }}
            disabled={isRunning}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200"
          >
            {frameworks.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 font-medium block mb-1">CVAT Annotation Source</label>
          <select
            value={selectedDataset.id}
            onChange={(e) => {
              const ds = cvatDatasets.find((d) => d.id === e.target.value);
              if (ds) setSelectedDataset(ds);
            }}
            disabled={isRunning}
            className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 truncate"
          >
            {cvatDatasets.map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d.format})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 font-medium block mb-1">Metrics Gate Decision Mode</label>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-700">
            <button
              type="button"
              onClick={() => setGateMode('auto')}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                gateMode === 'auto' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Auto-Pass Gate
            </button>
            <button
              type="button"
              onClick={() => setGateMode('manual_approval')}
              className={`flex-1 py-1 rounded text-xs transition-colors ${
                gateMode === 'manual_approval' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
              }`}
            >
              Lead Sign-Off
            </button>
          </div>
        </div>

        <div>
          <label className="text-slate-400 font-medium block mb-1">Target Model & Version</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={modelTargetName}
              onChange={(e) => setModelTargetName(e.target.value)}
              className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono"
            />
            <input
              type="text"
              value={targetVersion}
              onChange={(e) => setTargetVersion(e.target.value)}
              className="w-16 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-200 font-mono text-center"
            />
          </div>
        </div>
      </div>

      {/* Visual Roadmap / Stepper */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          {stages.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx && isRunning;
            const isSelected = activeTabInspection === stage.key;
            const isPending = currentStageIndex < idx;

            return (
              <div
                key={stage.key}
                onClick={() => setActiveTabInspection(stage.key)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/40 shadow-sm'
                    : isCompleted
                    ? 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                    : isCurrent
                    ? 'border-emerald-500 bg-emerald-950/30'
                    : 'border-slate-900 bg-slate-950/40 opacity-70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                    <span>STEP {stage.stageNumber}</span>
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isCurrent ? (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-white leading-tight">
                    {stage.title}
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {stage.shortDesc}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono flex items-center justify-between">
                  <span className={`${isCompleted ? 'text-emerald-400' : isCurrent ? 'text-amber-400' : 'text-slate-500'}`}>
                    {isCompleted ? 'Passed' : isCurrent ? 'Running...' : 'Pending'}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-600" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage Inspection Details Panel */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-6">
        {/* Inspection Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-400" />
              <span>Stage Inspector: {stages.find((s) => s.key === activeTabInspection)?.title}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Review telemetry, data integrity checks, and validation artifacts at this specific lifecycle step.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Pipeline Position:</span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-950 border border-slate-800 text-indigo-300">
              Stage 0{currentStageIndex + 1} / 06
            </span>
          </div>
        </div>

        {/* View 1: Data Ingestion */}
        {activeTabInspection === 'data_ingest' && (
          <div className="space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">SOURCE CVAT REPO</span>
                <span className="text-white font-semibold text-xs mt-1 block">{selectedDataset.name}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ANNOTATION EXPORT FORMAT</span>
                <span className="text-emerald-400 font-semibold text-xs mt-1 block">{selectedDataset.format}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">TOTAL IMAGES MOUNTED</span>
                <span className="text-indigo-400 font-semibold text-xs mt-1 block tabular-nums">{selectedDataset.totalImages.toLocaleString()} frames</span>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded border border-slate-800 text-slate-300 text-[11px] space-y-1">
              <div className="text-slate-500">// Ingestion worker pod logs:</div>
              <div>[00:00:01] Initializing CVAT REST client mount from s3://nexus-cvat-exports/{selectedDataset.id}/</div>
              <div>[00:00:03] Extracted {selectedDataset.annotatedFrames.toLocaleString()} annotation records with zero compression errors.</div>
              <div>[00:00:04] Formatted dataset splits: Train ({selectedDataset.splits.train}%), Val ({selectedDataset.splits.val}%), Test ({selectedDataset.splits.test}%).</div>
            </div>
          </div>
        )}

        {/* View 2: Data Validation Step (Validation Step 1) */}
        {activeTabInspection === 'data_validation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Pre-Training Data Quality & Integrity Validation
              </h3>
              <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Data Gate: PASSED
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">SHA-256 CHECKSUM</div>
                <div className="text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified Match
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{selectedDataset.checksum}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">CORRUPTED ASSETS</div>
                <div className="text-emerald-400 font-semibold mt-1 tabular-nums">0 Corrupt Frames</div>
                <div className="text-[10px] text-slate-500 mt-1">100% readable PNG/JPEG</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">BBOX / POLYGON SANITY</div>
                <div className="text-emerald-400 font-semibold mt-1">Bounds Valid [0, 1]</div>
                <div className="text-[10px] text-slate-500 mt-1">Zero zero-area polygons</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">SPLIT LEAKAGE CHECK</div>
                <div className="text-emerald-400 font-semibold mt-1">0% Train/Val Overlap</div>
                <div className="text-[10px] text-slate-500 mt-1">Hash disjoint verification</div>
              </div>
            </div>

            {/* Validation Checklist Items */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Annotation Schema Conformance ({selectedDataset.format})</span>
                </span>
                <span className="text-emerald-400">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Class Ontology Mapping ({selectedDataset.classes.length} distinct classes found)</span>
                </span>
                <span className="text-emerald-400">PASSED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Minimum Samples Per Class Threshold (&gt; 250 instances/class)</span>
                </span>
                <span className="text-emerald-400">PASSED</span>
              </div>
            </div>
          </div>
        )}

        {/* View 3: Distributed Training */}
        {activeTabInspection === 'training' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider">
                PyTorch DDP Cluster Execution (4x NVIDIA A100-80GB)
              </span>
              <span className="font-mono text-indigo-400">
                Epoch {currentEpoch}/{totalEpochs}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">CURRENT TRAINING LOSS</div>
                <div className="text-xl font-bold text-amber-400 mt-1 tabular-nums">
                  {currentTrainLoss.toFixed(3)}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Converging steadily</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">GPU THROUGHPUT</div>
                <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                  428 samples/sec
                </div>
                <div className="text-[10px] text-slate-500 mt-1">NCCL ring latency: 1.1ms</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">PRECISION MODE</div>
                <div className="text-xl font-bold text-indigo-400 mt-1">
                  bfloat16 AMP
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Optimizer: AdamW</div>
              </div>
            </div>

            {/* Epoch progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Training Progress</span>
                <span>{Math.round((currentEpoch / totalEpochs) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300"
                  style={{ width: `${(currentEpoch / totalEpochs) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* View 4: Training Validation Step (Validation Step 2) */}
        {activeTabInspection === 'training_validation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Post-Training Evaluation & Metric Extraction (Validation Split)
              </h3>
              <span className="text-xs text-indigo-400 font-mono font-semibold">
                Evaluation Set: {Math.round(selectedDataset.totalImages * 0.2).toLocaleString()} frames
              </span>
            </div>

            {/* Primary Benchmarks: mAP, Precision, Recall */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">mAP@50 BENCHMARK</div>
                <div className="text-xl font-bold text-emerald-400 mt-1 tabular-nums">
                  {(actualMap * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Target threshold: &ge; {(minMap * 100).toFixed(0)}%</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">PRECISION (MACRO)</div>
                <div className="text-xl font-bold text-indigo-400 mt-1 tabular-nums">
                  {(actualPrecision * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Target threshold: &ge; {(minPrecision * 100).toFixed(0)}%</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">RECALL (MACRO)</div>
                <div className="text-xl font-bold text-amber-400 mt-1 tabular-nums">
                  {(actualRecall * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Target threshold: &ge; {(minRecall * 100).toFixed(0)}%</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">HARMONIC F1-SCORE</div>
                <div className="text-xl font-bold text-white mt-1 tabular-nums">
                  {trainingValidationReport.f1Score}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Balanced precision/recall</div>
              </div>
            </div>

            {/* Overfitting & Generalization Checks */}
            <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Validation Loss Delta: <strong className="text-white">0.188</strong> (Train Loss: <strong className="text-white">0.182</strong>)</span>
                <span className="text-emerald-400">NO OVERFITTING DETECTED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Confusion Matrix Generation</span>
                <span className="text-indigo-400">ARTIFACT GENERATED (matrix.png)</span>
              </div>
            </div>
          </div>
        )}

        {/* View 5: Metrics Auto or Approval Gate */}
        {activeTabInspection === 'metrics_gate' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Quality Gate: Auto-Pass vs. Lead Sign-Off
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Decide whether this checkpoint qualifies for production candidate promotion in MLflow.
                </p>
              </div>

              <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                approvalStatus === 'Approved' || approvalStatus === 'Auto-Approved'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : approvalStatus === 'Rejected'
                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                  : 'bg-amber-950 text-amber-400 border border-amber-800'
              }`}>
                {approvalStatus.toUpperCase()}
              </span>
            </div>

            {/* Metric Thresholds Comparison Table */}
            <div className="bg-slate-950 rounded border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Evaluation Metric</th>
                    <th className="px-4 py-2.5">Actual Measured Score</th>
                    <th className="px-4 py-2.5">Configured Threshold</th>
                    <th className="px-4 py-2.5 text-right">Gate Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="px-4 py-2.5 text-slate-200 font-semibold">Mean Average Precision (mAP@50)</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-bold tabular-nums">{(actualMap * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">&ge; {(minMap * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-bold">MEETS TARGET</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-200 font-semibold">Detection Precision</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-bold tabular-nums">{(actualPrecision * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">&ge; {(minPrecision * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-bold">MEETS TARGET</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 text-slate-200 font-semibold">Recall Benchmark</td>
                    <td className="px-4 py-2.5 text-emerald-400 font-bold tabular-nums">{(actualRecall * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-slate-400 tabular-nums">&ge; {(minRecall * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5 text-right text-emerald-400 font-bold">MEETS TARGET</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Approval Action Box */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs">
                  <span className="text-slate-400">Current Mode: </span>
                  <span className="text-white font-semibold font-mono">
                    {gateMode === 'auto' ? 'Automatic Gate (Self-Executing)' : 'Manual Lead Sign-Off Required'}
                  </span>
                  {gateMode === 'manual_approval' && (
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      Lead Engineer (Dr. Marcus Vance) or Admin (Arthur Sterling) must authorize promotion to MLflow Registry.
                    </div>
                  )}
                </div>

                {gateMode === 'manual_approval' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={!canApprove || approvalStatus !== 'Pending'}
                      onClick={handleManualReject}
                      className="px-3 py-1.5 text-xs text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900 border border-rose-800 rounded disabled:opacity-50 transition-colors"
                    >
                      Reject Model
                    </button>

                    <button
                      type="button"
                      disabled={!canApprove || approvalStatus !== 'Pending'}
                      onClick={handleManualApprove}
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded disabled:opacity-50 transition-colors flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Approve & Promote to MLflow</span>
                    </button>
                  </div>
                )}
              </div>

              {!canApprove && gateMode === 'manual_approval' && (
                <div className="p-2.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 shrink-0" />
                  <span>
                    Your current role (<strong>{currentUser.roleTitle}</strong>) cannot authorize promotion. Switch to <strong>Lead Engineer</strong> or <strong>Admin</strong> in the top bar to test sign-off!
                  </span>
                </div>
              )}

              {rejectionReason && (
                <div className="p-2.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                  Rejection Note: {rejectionReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 6: Promote to MLflow */}
        {activeTabInspection === 'mlflow_promotion' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Model Registered in MLflow Model Registry
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model weights, lineage metadata, and inference runtime artifacts registered.
                </p>
              </div>

              <button
                type="button"
                onClick={onNavigateToMlflow}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1.5 transition-colors"
              >
                <span>View in MLflow Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">REGISTERED MODEL</div>
                <div className="text-base font-bold text-white mt-1">{modelTargetName}</div>
                <div className="text-[10px] text-indigo-400 mt-0.5">Version {targetVersion}</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">DEPLOYMENT STAGE</div>
                <div className="text-base font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Production
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Live serving ready</div>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <div className="text-slate-500 text-[10px]">AUTHORIZING LEAD</div>
                <div className="text-base font-bold text-slate-200 mt-1 truncate">{currentUser.name}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{currentUser.roleTitle}</div>
              </div>
            </div>

            <div className="bg-slate-950 p-3.5 rounded border border-slate-800 text-xs font-mono space-y-1.5">
              <div className="text-slate-400">Artifact URI: <span className="text-slate-200">s3://nexus-mlflow-artifacts/models/{modelTargetName}/{targetVersion}/model.onnx</span></div>
              <div className="text-slate-400">Dataset Lineage: <span className="text-emerald-400">{selectedDataset.name} ({selectedDataset.checksum.slice(0, 16)}...)</span></div>
              <div className="text-slate-400">Registered Metrics: <span className="text-slate-200">mAP@50: {(actualMap * 100).toFixed(1)}% · Precision: {(actualPrecision * 100).toFixed(1)}% · Recall: {(actualRecall * 100).toFixed(1)}%</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
