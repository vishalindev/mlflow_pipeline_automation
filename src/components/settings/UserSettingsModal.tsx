import React, { useState } from 'react';
import { UserProfile } from '../../types/mlops';
import { X, Sliders, Server, Bell, Save, CheckCircle2, Lock, Terminal } from 'lucide-react';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
}

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
}) => {
  const [cvatEndpoint, setCvatEndpoint] = useState('https://cvat.nexus-mlops.internal:8080');
  const [mlflowUri, setMlflowUri] = useState('https://mlflow.nexus-mlops.internal:5000');
  const [kfNamespace, setKfNamespace] = useState('kubeflow-training-prod');
  const [slackAlerts, setSlackAlerts] = useState('#mlops-alerts-production');
  const [autoSyncCvat, setAutoSyncCvat] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const canEdit = currentUser.permissions.canEditSystemConfig;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cluster & Integration Settings</h3>
              <p className="text-xs text-slate-400">Platform endpoints, namespaces, and webhook notifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!canEdit && (
          <div className="p-3 rounded bg-amber-950/40 border border-amber-800 text-xs text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>
              Your role (<strong>{currentUser.roleTitle}</strong>) has read-only configuration access. Switch to Admin or MLOps Engineer to modify cluster settings.
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">
              CVAT Integration Server Endpoint
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={cvatEndpoint}
              onChange={(e) => setCvatEndpoint(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              MLflow Remote Tracking Server URI
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={mlflowUri}
              onChange={(e) => setMlflowUri(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Kubeflow Default Worker Namespace
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={kfNamespace}
              onChange={(e) => setKfNamespace(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Slack Notification Webhook Channel
            </label>
            <input
              type="text"
              disabled={!canEdit}
              value={slackAlerts}
              onChange={(e) => setSlackAlerts(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-xs text-white font-mono focus:outline-none focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!canEdit}
                checked={autoSyncCvat}
                onChange={(e) => setAutoSyncCvat(e.target.checked)}
                className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
              />
              <span className="text-slate-300">
                Automatically verify CVAT annotation SHA-256 checksums before initiating Kubeflow DAG
              </span>
            </label>
          </div>

          {savedSuccess && (
            <div className="p-2.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Settings successfully committed to cluster config map.</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-slate-300 hover:text-white bg-slate-800 rounded transition-colors"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={!canEdit}
              className={`px-4 py-2 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                canEdit
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
