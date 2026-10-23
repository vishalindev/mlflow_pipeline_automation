import React, { useState } from 'react';
import {
  BookOpen,
  GitCommit,
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Database,
  Terminal,
  Layers,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Code,
  Sliders,
  Award,
} from 'lucide-react';

export const InstructionManualPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'lifecycle' | 'validation' | 'rbac' | 'cli' | 'troubleshoot'>('lifecycle');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight text-white">
              Platform Instructions & Standard Operating Procedures
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete technical guide for operators, architects, product managers, and auditors on NexusML pipeline standards.
          </p>
        </div>

        {/* Section Navigation */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveSection('lifecycle')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'lifecycle' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Pipeline Lifecycle
          </button>
          <button
            onClick={() => setActiveSection('validation')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'validation' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Validation Gates
          </button>
          <button
            onClick={() => setActiveSection('rbac')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'rbac' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            RBAC Governance
          </button>
          <button
            onClick={() => setActiveSection('cli')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'cli' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            CLI Reference
          </button>
          <button
            onClick={() => setActiveSection('troubleshoot')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === 'troubleshoot' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Troubleshooting
          </button>
        </div>
      </div>

      {/* Section 1: Pipeline Lifecycle */}
      {activeSection === 'lifecycle' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <GitCommit className="w-5 h-5 text-indigo-400" />
              <span>1. End-to-End Pipeline Architectural Flow</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              NexusML strictly enforces a sequential validation architecture. Before expensive GPU clusters are provisioned or model candidates are pushed to production, verification gates must be cleared.
            </p>

            {/* Architecture Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold text-sm">Step 01: CVAT Data Mount</div>
                <p className="text-slate-400 font-sans text-xs">
                  Connects to the enterprise CVAT server. Pulls annotation manifests in standardized formats (COCO 1.0 JSON, YOLOv8 Darknet, Pascal VOC XML) and binds them with raw frame volumes.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold text-sm">Step 02: Data Validation Gate</div>
                <p className="text-slate-400 font-sans text-xs">
                  Validates SHA-256 data digests, image corruptions, bounding box normalized coordinates, zero-area polygon anomalies, and split partitions (Train / Val / Test).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="text-indigo-400 font-bold text-sm">Step 03: Kubeflow Training</div>
                <p className="text-slate-400 font-sans text-xs">
                  Launches a multi-GPU PyTorchJob or TFJob on GKE cluster. Distributes batches with torchrun NCCL ring synchronization and bfloat16 mixed precision.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="text-emerald-400 font-bold text-sm">Step 04: Training Validation</div>
                <p className="text-slate-400 font-sans text-xs">
                  Executes forward pass benchmark against the held-out validation partition. Computes mAP@50, Precision, Recall, and Confusion Matrix artifacts.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="text-amber-400 font-bold text-sm">Step 05: Quality Decision Gate</div>
                <p className="text-slate-400 font-sans text-xs">
                  Compares metrics against preset thresholds. Can execute in <strong>Auto-Pass</strong> mode (if criteria met) or pause for <strong>Lead Engineer Sign-Off</strong> under RBAC.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <div className="text-violet-400 font-bold text-sm">Step 06: MLflow Promotion</div>
                <p className="text-slate-400 font-sans text-xs">
                  Registers trained weights into MLflow Model Registry, stamps semantic version tag, sets deployment stage (Staging/Production), and stores CVAT data lineage.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 2: Validation Gates */}
      {activeSection === 'validation' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>2. Validation Gates & Metric Tolerances</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every stage has rigorous checks designed to prevent corrupted data, training anomalies, and subpar model releases.
            </p>

            <div className="space-y-4 pt-2">
              {/* Gate 1 */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-emerald-400 font-mono uppercase tracking-wider">
                  Gate 1: Pre-Training Data Integrity Validation
                </h3>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li><strong>Checksum Match:</strong> SHA-256 digest of annotation archive must match the CVAT remote manifest.</li>
                  <li><strong>Image Integrity:</strong> Pillow / OpenCV header checks confirm 0 corrupted or truncated JPEG/PNG frames.</li>
                  <li><strong>Coordinate Clamping:</strong> Bounding boxes must strictly lie within $[0.0, 1.0]$ with positive area.</li>
                  <li><strong>Split Disjointness:</strong> Hash keys guarantee zero data leakage between train and validation partitions.</li>
                </ul>
              </div>

              {/* Gate 2 */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-indigo-400 font-mono uppercase tracking-wider">
                  Gate 2: Post-Training Model Evaluation Gate
                </h3>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                  <li><strong>Mean Average Precision (mAP@50):</strong> Defaults to minimum threshold &ge; 82.0% for vision tasks.</li>
                  <li><strong>Macro Precision:</strong> Minimum &ge; 85.0% to limit false positive detections.</li>
                  <li><strong>Macro Recall:</strong> Minimum &ge; 80.0% to prevent missed obstacle detections.</li>
                  <li><strong>Overfitting Ratio:</strong> |Val Loss - Train Loss| &le; 0.05 ensures generalizability.</li>
                </ul>
              </div>

              {/* Gate 3 */}
              <div className="bg-slate-950 p-4 rounded border border-slate-800 space-y-2">
                <h3 className="text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider">
                  Gate 3: Decision Gate (Auto-Pass vs. Lead Sign-Off)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In <strong>Auto-Pass</strong> mode, models clearing all metric thresholds are automatically registered into the Staging phase of MLflow. In <strong>Manual Approval</strong> mode, the Lead Engineer or Admin must review the precision/recall trade-off and sign off.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 3: RBAC Governance */}
      {activeSection === 'rbac' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <span>3. Role-Based Access Control (RBAC) Standards</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Enterprise governance enforces separation of duties across 5 distinct platform personas.
            </p>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs border border-slate-800 rounded">
                <thead className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Primary Persona</th>
                    <th className="px-4 py-2.5">Permissions Granted</th>
                    <th className="px-4 py-2.5">Restrictions & Boundaries</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono text-xs">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-emerald-400">MLOps Engineer</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Sarah Jenkins</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Pipeline trigger, GPU node sizing, pod logs, termination</td>
                    <td className="px-4 py-3 text-slate-400 font-sans">Cannot promote models to Production without Lead sign-off</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-indigo-400">Lead Engineer</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Dr. Marcus Vance</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Hyperparameter overrides, Model promotion, Quota adjustments</td>
                    <td className="px-4 py-3 text-slate-400 font-sans">Cannot modify IAM user privileges or global server secrets</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-amber-400">Product Manager</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Elena Rostova</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Experiment metrics inspection, budget burn, model card review</td>
                    <td className="px-4 py-3 text-slate-400 font-sans">Read-only on infrastructure; cannot start jobs or kill pods</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-violet-400">Admin</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Arthur Sterling</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Full administrative control, endpoint configuration, user management</td>
                    <td className="px-4 py-3 text-slate-400 font-sans">All actions audited and retained in compliance logs</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-400">Test User</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Alex Rivera</td>
                    <td className="px-4 py-3 text-slate-300 font-sans">Sandbox inspection of public CVAT datasets and runs</td>
                    <td className="px-4 py-3 text-slate-400 font-sans">Read-only sandbox; no pipeline executions or data modifications</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Section 4: CLI Reference */}
      {activeSection === 'cli' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-indigo-400" />
              <span>4. Developer CLI & API Reference</span>
            </h2>
            <p className="text-xs text-slate-300">
              Useful shell commands for programmatic interaction with the Kubeflow orchestrator, CVAT exports, and MLflow tracking server.
            </p>

            <div className="space-y-3 pt-2 font-mono text-xs">
              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">// Query running Kubeflow PyTorch jobs</span>
                <span className="text-emerald-400 block mt-1">kubectl get pytorchjobs -n kubeflow-training-prod</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">// Stream distributed worker rank 0 logs</span>
                <span className="text-emerald-400 block mt-1">kubectl logs -f kf-pod-torch-ddp-worker-0 -n kubeflow-training-prod</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">// Query registered models in MLflow</span>
                <span className="text-emerald-400 block mt-1">mlflow models list --tracking-uri http://mlflow.internal:5000</span>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">// Verify dataset checksum via CVAT CLI</span>
                <span className="text-emerald-400 block mt-1">cvat-cli dataset check-integrity --task-id 402 --format "COCO 1.0"</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section 5: Troubleshooting */}
      {activeSection === 'troubleshoot' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-6 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span>5. Troubleshooting & Anomaly Remediation</span>
            </h2>
            <div className="space-y-3 pt-2 text-xs">
              <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
                <div className="font-semibold text-rose-400 font-mono">CUDA Out of Memory (OOM) Runtime Error</div>
                <p className="text-slate-300">
                  Occurs when effective batch size exceeds GPU VRAM capacity. Remediation: Lower batch size per GPU from 64 to 32, enable mixed precision (<code className="text-indigo-400">bf16</code>), or switch distributed topology to <code className="text-indigo-400">DeepSpeed ZeRO-3</code> full parameter sharding.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
                <div className="font-semibold text-amber-400 font-mono">NCCL Ring Sync Timeout / Worker Rank Disconnect</div>
                <p className="text-slate-300">
                  Occurs when worker ranks take longer than <code className="text-indigo-400">NCCL_TIMEOUT</code> (default 1800s) to rendezvous. Remediation: Verify host network interfaces and set <code className="text-indigo-400">NCCL_DEBUG=INFO</code> in custom hyperparameters.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded border border-slate-800 space-y-1">
                <div className="font-semibold text-indigo-400 font-mono">Model Metric Quality Gate Failure</div>
                <p className="text-slate-300">
                  If validation mAP@50 or Recall falls below minimum threshold, inspect class distribution in the CVAT dataset for rare underrepresented labels or introduce data augmentation.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
