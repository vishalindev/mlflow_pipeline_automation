import React from 'react';
import { UserRole } from '../../types/mlops';

interface RoleBadgeProps {
  role: UserRole;
  showDot?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role, showDot = true }) => {
  const getRoleDetails = (r: UserRole) => {
    switch (r) {
      case 'mlops_engineer':
        return { label: 'MLOps Engineer', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
      case 'lead_engineer':
        return { label: 'Lead Engineer', color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60' };
      case 'product_manager':
        return { label: 'Product Manager', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' };
      case 'admin':
        return { label: 'Admin', color: 'text-violet-400 bg-violet-950/60 border-violet-800/60' };
      case 'test_user':
        return { label: 'Test User (Sandbox)', color: 'text-slate-400 bg-slate-900 border-slate-700/60' };
    }
  };

  const details = getRoleDetails(role);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border ${details.color} tabular-nums whitespace-nowrap`}>
      {showDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      )}
      {details.label}
    </span>
  );
};
