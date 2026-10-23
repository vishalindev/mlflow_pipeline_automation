import React, { useState } from 'react';
import { CvatDataset, UserProfile } from '../../types/mlops';
import { Database, Search, RefreshCw, Layers, CheckCircle2, ExternalLink, Play, Filter } from 'lucide-react';

interface CvatDatasetManagerProps {
  datasets: CvatDataset[];
  currentUser: UserProfile;
  onSelectDatasetForTraining: (dataset: CvatDataset) => void;
  onPreviewDataset: (dataset: CvatDataset) => void;
}

export const CvatDatasetManager: React.FC<CvatDatasetManagerProps> = ({
  datasets,
  currentUser,
  onSelectDatasetForTraining,
  onPreviewDataset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<string>('All');
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredDatasets = datasets.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.classes.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesFormat = formatFilter === 'All' || ds.format === formatFilter;

    return matchesSearch && matchesFormat;
  });

  const handleSyncRemote = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
    }, 600);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>CVAT Annotation Repositories & Lineage</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise computer vision annotation tasks, bounding box/segmentation ontologies, and training split manifests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search datasets, classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-52"
            />
          </div>

          <button
            type="button"
            onClick={handleSyncRemote}
            disabled={isSyncing}
            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sync CVAT Host</span>
          </button>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDatasets.map((ds) => (
          <div
            key={ds.id}
            className="bg-slate-900/60 border border-slate-800 rounded-lg p-5 space-y-4 hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white">{ds.name}</h3>
                <p className="text-xs text-slate-400">{ds.project} · {ds.version}</p>
              </div>

              <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-950 border border-slate-800 text-emerald-400">
                {ds.format}
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-950 p-2.5 rounded border border-slate-800/80">
              <div>
                <div className="text-slate-500 text-[10px]">FRAMES</div>
                <div className="text-white font-semibold tabular-nums">{ds.totalImages.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">CLASSES</div>
                <div className="text-indigo-400 font-semibold tabular-nums">{ds.classesCount}</div>
              </div>
              <div>
                <div className="text-slate-500 text-[10px]">SPLIT</div>
                <div className="text-slate-300 tabular-nums">{ds.splits.train}/{ds.splits.val}/{ds.splits.test}</div>
              </div>
            </div>

            {/* Classes pills */}
            <div className="flex flex-wrap gap-1">
              {ds.classes.map((c, i) => (
                <span key={i} className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {c}
                </span>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px] font-mono">{ds.checksum.slice(0, 16)}...</span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPreviewDataset(ds)}
                  className="px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 rounded border border-slate-700 transition-colors"
                >
                  Inspect
                </button>
                <button
                  type="button"
                  onClick={() => onSelectDatasetForTraining(ds)}
                  className="px-3 py-1 font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded flex items-center gap-1 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Pipeline</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
