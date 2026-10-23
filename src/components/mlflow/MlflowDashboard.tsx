import React, { useState } from 'react';
import { MlflowRun, ModelRegistryEntry, UserProfile } from '../../types/mlops';
import {
  TrendingUp,
  GitBranch,
  Layers,
  Award,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Sliders,
  FileText,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface MlflowDashboardProps {
  runs: MlflowRun[];
  modelRegistry: ModelRegistryEntry[];
  currentUser: UserProfile;
  initialSelectedRunId?: string;
  onPromoteModel: (modelName: string, targetStage: 'Production' | 'Staging' | 'Archived') => void;
  onRegisterRunAsModel: (runId: string, modelName: string) => void;
}

export const MlflowDashboard: React.FC<MlflowDashboardProps> = ({
  runs,
  modelRegistry,
  currentUser,
  initialSelectedRunId,
  onPromoteModel,
  onRegisterRunAsModel,
}) => {
  const [activeTab, setActiveTab] = useState<'runs' | 'charts' | 'registry' | 'compare'>('runs');
  const [selectedRunId, setSelectedRunId] = useState<string>(initialSelectedRunId || runs[0]?.runId || '');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([
    runs[0]?.runId || '',
    runs[1]?.runId || '',
  ]);
  const [activeChartMetric, setActiveChartMetric] = useState<'loss' | 'primary' | 'lr'>('loss');
  const [hoveredEpochIndex, setHoveredEpochIndex] = useState<number | null>(null);

  // Model Promotion Modal
  const [promotionModalModel, setPromotionModalModel] = useState<ModelRegistryEntry | null>(null);
  const [targetStage, setTargetStage] = useState<'Production' | 'Staging' | 'Archived'>('Production');

  const selectedRun = runs.find((r) => r.runId === selectedRunId) || runs[0];

  const canPromote = currentUser.permissions.canPromoteModels;

  const toggleCompareRun = (runId: string) => {
    if (selectedForCompare.includes(runId)) {
      if (selectedForCompare.length > 1) {
        setSelectedForCompare(selectedForCompare.filter((id) => id !== runId));
      }
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare([...selectedForCompare, runId]);
      } else {
        setSelectedForCompare([selectedForCompare[1], runId]);
      }
    }
  };

  const comparedRuns = runs.filter((r) => selectedForCompare.includes(r.runId));

  // Compute SVG chart coordinates for metricHistory
  const renderMetricSvg = () => {
    if (!selectedRun || !selectedRun.metricHistory || selectedRun.metricHistory.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-xs text-slate-500 font-mono">
          No epoch metric telemetry logged for this run.
        </div>
      );
    }

    const data = selectedRun.metricHistory;
    const width = 640;
    const height = 220;
    const padding = { top: 20, right: 30, bottom: 30, left: 50 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const minX = data[0].epoch;
    const maxX = data[data.length - 1].epoch;

    let minY = 0;
    let maxY = 1;

    if (activeChartMetric === 'loss') {
      const allLosses = data.flatMap((d) => [d.trainLoss, d.valLoss]);
      minY = Math.max(0, Math.min(...allLosses) * 0.8);
      maxY = Math.max(...allLosses) * 1.15;
    } else if (activeChartMetric === 'primary') {
      const allMetrics = data.map((d) => d.primaryMetric);
      minY = Math.max(0, Math.min(...allMetrics) * 0.85);
      maxY = Math.min(1.0, Math.max(...allMetrics) * 1.1);
    } else {
      const allLrs = data.map((d) => d.learningRate);
      minY = 0;
      maxY = Math.max(...allLrs) * 1.2;
    }

    const getX = (epoch: number) =>
      padding.left + ((epoch - minX) / (maxX - minX || 1)) * chartW;
    const getY = (val: number) =>
      padding.top + chartH - ((val - minY) / (maxY - minY || 1)) * chartH;

    const trainLossPath = data.reduce(
      (acc, d, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(d.epoch)} ${getY(d.trainLoss)}`,
      ''
    );

    const valLossPath = data.reduce(
      (acc, d, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(d.epoch)} ${getY(d.valLoss)}`,
      ''
    );

    const primaryPath = data.reduce(
      (acc, d, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(d.epoch)} ${getY(d.primaryMetric)}`,
      ''
    );

    const lrPath = data.reduce(
      (acc, d, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${getX(d.epoch)} ${getY(d.learningRate)}`,
      ''
    );

    const hoveredPoint = hoveredEpochIndex !== null ? data[hoveredEpochIndex] : null;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible select-none">
          {/* Horizontal gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const yVal = padding.top + chartH * (1 - pct);
            const labelVal = (minY + (maxY - minY) * pct).toFixed(activeChartMetric === 'lr' ? 6 : 3);
            return (
              <g key={idx}>
                <line
                  x1={padding.left}
                  y1={yVal}
                  x2={width - padding.right}
                  y2={yVal}
                  stroke="#334155"
                  strokeDasharray="3 3"
                  strokeWidth="0.8"
                />
                <text
                  x={padding.left - 8}
                  y={yVal + 3}
                  textAnchor="end"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Epoch axis ticks */}
          {data.map((d, i) => {
            if (i % Math.ceil(data.length / 5) === 0 || i === data.length - 1) {
              const xPos = getX(d.epoch);
              return (
                <text
                  key={i}
                  x={xPos}
                  y={height - 10}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono"
                >
                  Ep {d.epoch}
                </text>
              );
            }
            return null;
          })}

          {/* Lines depending on selected metric */}
          {activeChartMetric === 'loss' && (
            <>
              <path d={trainLossPath} fill="none" stroke="#6366f1" strokeWidth="2.5" />
              <path d={valLossPath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 2" />
            </>
          )}

          {activeChartMetric === 'primary' && (
            <path d={primaryPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
          )}

          {activeChartMetric === 'lr' && (
            <path d={lrPath} fill="none" stroke="#f59e0b" strokeWidth="2.5" />
          )}

          {/* Interactive hover points */}
          {data.map((d, idx) => {
            const xPos = getX(d.epoch);
            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredEpochIndex(idx)}
                className="cursor-pointer"
              >
                <rect
                  x={xPos - 12}
                  y={padding.top}
                  width={24}
                  height={chartH}
                  fill="transparent"
                />
                {hoveredEpochIndex === idx && (
                  <line
                    x1={xPos}
                    y1={padding.top}
                    x2={xPos}
                    y2={padding.top + chartH}
                    stroke="#818cf8"
                    strokeWidth="1.5"
                    strokeDasharray="2 2"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Box */}
        {hoveredPoint && (
          <div className="absolute top-2 right-4 bg-slate-950/95 border border-slate-700 p-2.5 rounded shadow-lg text-xs font-mono space-y-1 z-10 pointer-events-none">
            <div className="text-white font-semibold border-b border-slate-800 pb-1">
              Epoch {hoveredPoint.epoch} / {selectedRun.parameters.epochs || 50}
            </div>
            {activeChartMetric === 'loss' && (
              <>
                <div className="text-indigo-400">Train Loss: {hoveredPoint.trainLoss.toFixed(4)}</div>
                <div className="text-emerald-400">Val Loss: {hoveredPoint.valLoss.toFixed(4)}</div>
              </>
            )}
            {activeChartMetric === 'primary' && (
              <div className="text-emerald-400">
                {selectedRun.metrics.primaryMetricName}: {(hoveredPoint.primaryMetric * 100).toFixed(2)}%
              </div>
            )}
            {activeChartMetric === 'lr' && (
              <div className="text-amber-400">
                Learning Rate: {hoveredPoint.learningRate.toExponential()}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <span>MLflow Experiment Tracking & Model Registry</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track metrics across epochs, compare hyperparameter runs side-by-side, and manage production model registry stages.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'runs' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Experiments & Runs ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab('charts')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'charts' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Metric Curves
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'compare' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Run Compare ({selectedForCompare.length})
          </button>
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeTab === 'registry' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Model Registry ({modelRegistry.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Runs Table */}
      {activeTab === 'runs' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Logged MLflow Runs
              </h2>
              <span className="text-[11px] text-slate-500 font-mono">Server: mlflow.internal:5000</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-3 py-2.5 w-10 text-center">Compare</th>
                    <th className="px-4 py-2.5">Run Name / Experiment</th>
                    <th className="px-3 py-2.5">CVAT Dataset</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">Train Loss</th>
                    <th className="px-3 py-2.5">Primary Metric</th>
                    <th className="px-3 py-2.5">Latency</th>
                    <th className="px-3 py-2.5">User</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {runs.map((r) => {
                    const isChecked = selectedForCompare.includes(r.runId);
                    const isSelected = r.runId === selectedRunId;

                    return (
                      <tr
                        key={r.runId}
                        onClick={() => setSelectedRunId(r.runId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-3 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCompareRun(r.runId)}
                            className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        <td className="px-4 py-3">
                          <div className="font-semibold text-white truncate max-w-[220px]" title={r.runName}>
                            {r.runName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[220px]">
                            {r.experimentName} · {r.framework}
                          </div>
                        </td>

                        <td className="px-3 py-3 text-slate-300 font-mono text-[11px] truncate max-w-[160px]">
                          {r.cvatDataset}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono text-xs">
                          {r.status === 'RUNNING' ? (
                            <span className="text-emerald-400 font-medium">RUNNING</span>
                          ) : r.status === 'FINISHED' ? (
                            <span className="text-indigo-300 font-medium">FINISHED</span>
                          ) : (
                            <span className="text-rose-400 font-medium">FAILED</span>
                          )}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono tabular-nums text-slate-200">
                          {r.metrics.trainLoss.toFixed(3)}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono tabular-nums text-emerald-400 font-semibold">
                          {(r.metrics.primaryMetric * 100).toFixed(1)}% ({r.metrics.primaryMetricName})
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap font-mono tabular-nums text-slate-300">
                          {r.metrics.inferenceLatencyMs} ms
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-slate-400 text-[11px]">
                          {r.user}
                        </td>

                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRunId(r.runId);
                              setActiveTab('charts');
                            }}
                            className="px-2.5 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors"
                          >
                            View Curves
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Metric Curves Chart */}
      {activeTab === 'charts' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Inspecting Run:</span>
                  <span className="text-sm font-semibold text-white font-mono">{selectedRun.runName}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Framework: {selectedRun.framework} · CVAT: {selectedRun.cvatDataset}
                </div>
              </div>

              {/* Metric Type Selector */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('loss')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeChartMetric === 'loss' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Train vs Val Loss
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('primary')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeChartMetric === 'primary' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {selectedRun.metrics.primaryMetricName} Curve
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartMetric('lr')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    activeChartMetric === 'lr' ? 'bg-slate-800 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Learning Rate Decay
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs font-mono">
              {activeChartMetric === 'loss' && (
                <>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-indigo-500 rounded" />
                    <span className="text-indigo-400">Train Loss</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-500 rounded border-dashed" />
                    <span className="text-emerald-400">Validation Loss</span>
                  </div>
                </>
              )}
              {activeChartMetric === 'primary' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-emerald-500 rounded" />
                  <span className="text-emerald-400">{selectedRun.metrics.primaryMetricName}</span>
                </div>
              )}
              {activeChartMetric === 'lr' && (
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-amber-500 rounded" />
                  <span className="text-amber-400">Learning Rate (cosine_with_restarts)</span>
                </div>
              )}
            </div>

            {/* SVG Visualizer */}
            <div className="bg-slate-950 p-4 rounded border border-slate-800/80">
              {renderMetricSvg()}
            </div>

            {/* Run Hyperparameters Summary Grid */}
            <div className="border-t border-slate-800 pt-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Run Hyperparameters & Config
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                {Object.entries(selectedRun.parameters).map(([key, val]) => (
                  <div key={key} className="bg-slate-950 p-2 rounded border border-slate-800/70">
                    <div className="text-slate-500 text-[10px]">{key}</div>
                    <div className="text-slate-200 mt-0.5 truncate">{String(val)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Run Comparison */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Side-by-Side Run Comparison ({comparedRuns.length} runs selected)</span>
              </h2>
              <span className="text-xs text-slate-400">Select runs from the Experiments table to compare diffs</span>
            </div>

            {comparedRuns.length < 2 ? (
              <div className="text-center py-10 border border-dashed border-slate-800 rounded text-xs text-slate-500">
                Please select at least 2 runs from the "Experiments & Runs" tab using checkboxes to see side-by-side comparison.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono">
                    <tr>
                      <th className="px-4 py-2.5 w-48">Parameter / Metric</th>
                      {comparedRuns.map((r) => (
                        <th key={r.runId} className="px-4 py-2.5 text-white">
                          <div>{r.runName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">{r.runId}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                    <tr className="bg-slate-950/30">
                      <td className="px-4 py-2 font-semibold text-slate-400">Framework</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-slate-200">{r.framework}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold text-slate-400">Architecture</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-slate-200">{String(r.parameters.architecture)}</td>
                      ))}
                    </tr>
                    <tr className="bg-slate-950/30">
                      <td className="px-4 py-2 font-semibold text-slate-400">Learning Rate</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-amber-400">{String(r.parameters.learning_rate)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold text-slate-400">Optimizer</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-slate-200">{String(r.parameters.optimizer)}</td>
                      ))}
                    </tr>
                    <tr className="bg-slate-950/30">
                      <td className="px-4 py-2 font-semibold text-slate-400">Precision</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-slate-200">{String(r.parameters.precision)}</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold text-slate-400">Train Loss</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-indigo-400 font-bold">{r.metrics.trainLoss.toFixed(4)}</td>
                      ))}
                    </tr>
                    <tr className="bg-slate-950/30">
                      <td className="px-4 py-2 font-semibold text-slate-400">Validation Score</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-emerald-400 font-bold">
                          {(r.metrics.primaryMetric * 100).toFixed(1)}% ({r.metrics.primaryMetricName})
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-semibold text-slate-400">Inference Latency</td>
                      {comparedRuns.map((r) => (
                        <td key={r.runId} className="px-4 py-2 text-slate-300">{r.metrics.inferenceLatencyMs} ms</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Model Registry */}
      {activeTab === 'registry' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Enterprise Model Registry
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Production gates require Lead Engineer or Admin sign-off under RBAC compliance.
                </p>
              </div>

              {!canPromote && (
                <div className="text-xs text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Promotion Locked ({currentUser.roleTitle})</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono">
                  <tr>
                    <th className="px-4 py-2.5">Registered Model</th>
                    <th className="px-3 py-2.5">Version</th>
                    <th className="px-3 py-2.5">Current Stage</th>
                    <th className="px-3 py-2.5">Performance Benchmark</th>
                    <th className="px-3 py-2.5">CVAT Lineage</th>
                    <th className="px-3 py-2.5">Promoted By</th>
                    <th className="px-3 py-2.5 text-right">Stage Lifecycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {modelRegistry.map((m) => (
                    <tr key={m.modelName} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white font-sans text-sm">{m.modelName}</div>
                        <div className="text-[11px] text-slate-400">{m.framework}</div>
                      </td>

                      <td className="px-3 py-3 text-slate-300">
                        {m.currentVersion}
                      </td>

                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium ${
                            m.stage === 'Production'
                              ? 'text-emerald-400 bg-emerald-950/80 border border-emerald-800/70'
                              : m.stage === 'Staging'
                              ? 'text-indigo-400 bg-indigo-950/80 border border-indigo-800/70'
                              : 'text-slate-400 bg-slate-900 border border-slate-800'
                          }`}
                        >
                          {m.stage}
                        </span>
                      </td>

                      <td className="px-3 py-3 text-slate-200">
                        {m.metricSummary}
                      </td>

                      <td className="px-3 py-3 text-slate-400 text-[11px] truncate max-w-[180px]">
                        {m.cvatDataset}
                      </td>

                      <td className="px-3 py-3 text-slate-400 text-[11px] font-sans">
                        <div>{m.promotedBy}</div>
                        <div className="text-slate-500 font-mono text-[10px]">{m.lastUpdated}</div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <button
                          type="button"
                          disabled={!canPromote}
                          onClick={() => {
                            setPromotionModalModel(m);
                            setTargetStage(m.stage === 'Production' ? 'Archived' : 'Production');
                          }}
                          className={`px-3 py-1.5 text-xs font-semibold rounded transition-colors ${
                            canPromote
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          Change Stage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Model Stage Promotion Modal */}
      {promotionModalModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <span>Promote Model Stage</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Updating stage for <strong>{promotionModalModel.modelName}</strong> ({promotionModalModel.currentVersion})
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Production">Production (Live serving cluster)</option>
                  <option value="Staging">Staging (Integration & shadow evaluation)</option>
                  <option value="Archived">Archived (Deprecated version)</option>
                </select>
              </div>

              <div className="bg-slate-950 p-3 rounded border border-slate-800 font-mono text-[11px] space-y-1">
                <div className="text-slate-400">Current Stage: <span className="text-white">{promotionModalModel.stage}</span></div>
                <div className="text-slate-400">Authorizing Lead: <span className="text-indigo-400">{currentUser.name}</span></div>
                <div className="text-slate-400">Compliance Role: <span className="text-emerald-400">{currentUser.roleTitle}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPromotionModalModel(null)}
                className="px-4 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onPromoteModel(promotionModalModel.modelName, targetStage);
                  setPromotionModalModel(null);
                }}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded"
              >
                Confirm Stage Transition
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
