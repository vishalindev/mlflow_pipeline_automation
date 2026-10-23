import React from 'react';
import { UserProfile, UserRole } from '../../types/mlops';
import { Shield, AlertCircle, CheckCircle2, Lock, Cpu, Database } from 'lucide-react';

interface RbacBannerProps {
  currentUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
}

export const RbacBanner: React.FC<RbacBannerProps> = ({ currentUser, onSwitchRole }) => {
  const getPermissionSummary = (user: UserProfile) => {
    switch (user.role) {
      case 'mlops_engineer':
        return 'Full training pipeline start, GPU node allocation, Kubeflow pod lifecycle & live streaming logs.';
      case 'lead_engineer':
        return 'Architecture overrides, training pipeline trigger, model registry promotion (Staging → Production).';
      case 'product_manager':
        return 'Executive monitoring view: model metrics, benchmark tracking, and delivery timelines (Launch locked).';
      case 'admin':
        return 'Superuser access: RBAC management, cluster quotas, endpoint config, and all training operations.';
      case 'test_user':
        return 'Auditor sandbox: View-only inspection of CVAT datasets and runs (Modifications disabled).';
    }
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-2.5 text-xs text-slate-300">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 font-medium text-slate-200">
            <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-slate-400">Authenticated:</span>
            <span className="text-white font-semibold">{currentUser.name}</span>
            <span className="text-slate-500">({currentUser.roleTitle})</span>
          </div>

          <span className="text-slate-600 hidden md:inline">·</span>

          <div className="text-slate-400 text-xs flex items-center gap-1.5">
            {currentUser.permissions.isReadOnly ? (
              <span className="inline-flex items-center gap-1 text-amber-400">
                <Lock className="w-3 h-3" />
                <span>Restricted Mode</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>Active Operator</span>
              </span>
            )}
            <span className="text-slate-500">·</span>
            <span>{getPermissionSummary(currentUser)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px] shrink-0">
          <div className="flex items-center gap-1.5" title="Allocated GPU Hours">
            <Cpu className="w-3 h-3 text-slate-400" />
            <span>GPU: {currentUser.gpuHoursQuota.used} / {currentUser.gpuHoursQuota.total} hrs</span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5" title="Object Storage Quota">
            <Database className="w-3 h-3 text-slate-400" />
            <span>Store: {currentUser.storageQuotaTb.used} / {currentUser.storageQuotaTb.total} TB</span>
          </div>
        </div>
      </div>
    </div>
  );
};
