import React from 'react';
import { CvatDataset } from '../../types/mlops';
import { X, Database, CheckCircle2, ShieldCheck, Tag, Layers, RefreshCw } from 'lucide-react';

interface CvatPreviewModalProps {
  dataset: CvatDataset | null;
  onClose: () => void;
  onSelectForPipeline?: (dataset: CvatDataset) => void;
}

export const CvatPreviewModal: React.FC<CvatPreviewModalProps> = ({
  dataset,
  onClose,
  onSelectForPipeline,
}) => {
  if (!dataset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-950/70 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{dataset.name}</h3>
              <p className="text-xs text-slate-400">{dataset.project} · {dataset.version}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dataset Key Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Total Frames</div>
            <div className="text-base font-bold text-white mt-0.5 tabular-nums">
              {dataset.totalImages.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Format</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">
              {dataset.format}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Labeled Classes</div>
            <div className="text-base font-bold text-indigo-400 mt-0.5 tabular-nums">
              {dataset.classesCount}
            </div>
          </div>
          <div className="bg-slate-950 p-3 rounded border border-slate-800">
            <div className="text-slate-500 text-[10px] uppercase">Sync Status</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready
            </div>
          </div>
        </div>

        {/* Annotation Classes List */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-indigo-400" />
            <span>Annotated Ontology Classes ({dataset.classes.length})</span>
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {dataset.classes.map((cls, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono"
              >
                {cls}
              </span>
            ))}
          </div>
        </div>

        {/* Train / Val / Test Split Breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>Dataset Partition Splitting</span>
          </h4>
          <div className="space-y-2">
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex">
              <div style={{ width: `${dataset.splits.train}%` }} className="bg-indigo-600" title="Train Split" />
              <div style={{ width: `${dataset.splits.val}%` }} className="bg-emerald-600" title="Validation Split" />
              <div style={{ width: `${dataset.splits.test}%` }} className="bg-amber-600" title="Test Split" />
            </div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Train: {dataset.splits.train}% ({Math.round((dataset.totalImages * dataset.splits.train) / 100).toLocaleString()} frames)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Val: {dataset.splits.val}% ({Math.round((dataset.totalImages * dataset.splits.val) / 100).toLocaleString()} frames)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Test: {dataset.splits.test}% ({Math.round((dataset.totalImages * dataset.splits.test) / 100).toLocaleString()} frames)
              </span>
            </div>
          </div>
        </div>

        {/* Verification Checksum */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>CVAT Source Digest:</span>
            <span className="text-slate-200">{dataset.checksum}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Last Remote Sync:</span>
            <span className="text-slate-300">{dataset.lastSynced}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
          >
            Close
          </button>
          {onSelectForPipeline && (
            <button
              type="button"
              onClick={() => {
                onSelectForPipeline(dataset);
                onClose();
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded transition-colors"
            >
              Use in Training Pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
