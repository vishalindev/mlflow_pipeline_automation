import React, { useState } from 'react';
import { UserProfile, UserRole } from '../../types/mlops';
import { USERS } from '../../data/mockData';
import { X, User, Shield, Cpu, Database, Key, Copy, Check, ExternalLink } from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchRole,
}) => {
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const handleCopyKubeconfig = () => {
    setCopiedToken(true);
    navigator.clipboard?.writeText(
      `kubectl config set-credentials ${currentUser.email} --token=eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`
    );
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const gpuUsagePercent = Math.round(
    (currentUser.gpuHoursQuota.used / currentUser.gpuHoursQuota.total) * 100
  );

  const storageUsagePercent = Math.round(
    (currentUser.storageQuotaTb.used / currentUser.storageQuotaTb.total) * 100
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-xl w-full p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow ${currentUser.avatarColor}`}
            >
              {currentUser.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{currentUser.name}</h3>
                <RoleBadge role={currentUser.role} />
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info & Department */}
        <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded border border-slate-800">
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Assigned Role</span>
            <span className="text-white font-medium">{currentUser.roleTitle}</span>
          </div>
          <div>
            <span className="text-slate-500 text-[10px] uppercase block">Department</span>
            <span className="text-slate-300">{currentUser.department}</span>
          </div>
        </div>

        {/* Cluster Resource Quotas */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Compute & Storage Quotas
          </h4>

          {/* GPU Hours Quota */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>GPU Compute Hours Quota</span>
              </span>
              <span className="text-slate-200">
                {currentUser.gpuHoursQuota.used} / {currentUser.gpuHoursQuota.total} hrs ({gpuUsagePercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  gpuUsagePercent > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${gpuUsagePercent}%` }}
              />
            </div>
          </div>

          {/* Storage Quota */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cloud Object Storage (GCS/Ceph)</span>
              </span>
              <span className="text-slate-200">
                {currentUser.storageQuotaTb.used} / {currentUser.storageQuotaTb.total} TB ({storageUsagePercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${storageUsagePercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Kubectl / API Access Token CLI */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Kubeflow API Token & Kubeconfig</span>
            </span>
            <button
              type="button"
              onClick={handleCopyKubeconfig}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-mono text-[11px]"
            >
              {copiedToken ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Auth Command</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto select-all">
            kubectl config set-credentials {currentUser.email.split('@')[0]} --token=eyJhbGciOiJSUzI1...
          </div>
        </div>

        {/* Switch Persona */}
        <div className="border-t border-slate-800 pt-4">
          <span className="text-xs text-slate-500 block mb-2 font-mono">Switch RBAC Persona:</span>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(USERS).map(([key, user]) => (
              <button
                key={key}
                onClick={() => onSwitchRole(user.role)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  currentUser.role === user.role
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {user.roleTitle.split(' ')[0]} {user.roleTitle.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
