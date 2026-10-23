import React from 'react';
import { UserRole, UserProfile } from '../../types/mlops';
import { USERS } from '../../data/mockData';
import { ShieldCheck, Check, X, AlertCircle, Cpu, Database, User } from 'lucide-react';
import { RoleBadge } from '../common/RoleBadge';

interface RbacMatrixViewProps {
  currentUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
}

export const RbacMatrixView: React.FC<RbacMatrixViewProps> = ({
  currentUser,
  onSwitchRole,
}) => {
  const rolesList: { role: UserRole; title: string; desc: string; user: UserProfile }[] = [
    {
      role: 'mlops_engineer',
      title: 'MLOps Engineer',
      desc: 'Infra operator responsible for distributed GPU nodes, container runtimes, pipeline scheduling, and log debugging.',
      user: USERS.mlops_engineer,
    },
    {
      role: 'lead_engineer',
      title: 'Lead Engineer',
      desc: 'Architect responsible for algorithmic oversight, model promotion to production, and cluster quota approvals.',
      user: USERS.lead_engineer,
    },
    {
      role: 'product_manager',
      title: 'Product Manager',
      desc: 'Executive stakeholder monitoring release timelines, accuracy metrics, and cloud compute budget spend.',
      user: USERS.product_manager,
    },
    {
      role: 'admin',
      title: 'Admin',
      desc: 'System administrator managing team member credentials, global cloud endpoints, secrets, and security policies.',
      user: USERS.admin,
    },
    {
      role: 'test_user',
      title: 'Test User',
      desc: 'Auditor & sandbox user with strictly read-only observation capabilities across datasets and training history.',
      user: USERS.test_user,
    },
  ];

  const permissionsMatrix = [
    {
      capability: 'Start Training Pipeline',
      description: 'Trigger distributed Kubeflow training jobs with custom framework and hyperparameters',
      mlops_engineer: true,
      lead_engineer: true,
      product_manager: false,
      admin: true,
      test_user: false,
    },
    {
      capability: 'Terminate / Cancel Pod Tasks',
      description: 'Send SIGTERM/SIGKILL signals to active Kubeflow worker pods and release GPU memory',
      mlops_engineer: true,
      lead_engineer: true,
      product_manager: false,
      admin: true,
      test_user: false,
    },
    {
      capability: 'Live Log Streaming & Shell Access',
      description: 'Stream stdout/stderr logs from distributed ranks and view task manifest specifications',
      mlops_engineer: true,
      lead_engineer: true,
      product_manager: true,
      admin: true,
      test_user: true,
    },
    {
      capability: 'Promote Models (Staging → Production)',
      description: 'Sign off and transition candidate models in the MLflow Model Registry to live serving',
      mlops_engineer: false,
      lead_engineer: true,
      product_manager: false,
      admin: true,
      test_user: false,
    },
    {
      capability: 'Adjust Cluster Quota & GPU Allocations',
      description: 'Increase maximum GPU hours, expand object storage TBs, and provision new node pools',
      mlops_engineer: true,
      lead_engineer: true,
      product_manager: false,
      admin: true,
      test_user: false,
    },
    {
      capability: 'Manage Users & RBAC Assignments',
      description: 'Assign or revoke roles, regenerate team API tokens, and configure SSO / IAM policies',
      mlops_engineer: false,
      lead_engineer: false,
      product_manager: false,
      admin: true,
      test_user: false,
    },
    {
      capability: 'Configure CVAT & MLflow Endpoints',
      description: 'Update remote tracking URIs, CVAT integration tokens, and Slack alert webhooks',
      mlops_engineer: true,
      lead_engineer: true,
      product_manager: false,
      admin: true,
      test_user: false,
    },
    {
      capability: 'View Metrics & Historical Experiments',
      description: 'Browse loss curves, mAP benchmarks, and dataset splits across all past pipeline runs',
      mlops_engineer: true,
      lead_engineer: true,
      product_manager: true,
      admin: true,
      test_user: true,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Role-Based Access Control (RBAC) Architecture</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard enterprise permission governance across MLOps Engineers, Lead Engineers, Product Managers, Administrators, and Test Auditors.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Current Role:</span>
          <RoleBadge role={currentUser.role} />
        </div>
      </div>

      {/* Role Personas Quick Switch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {rolesList.map((item) => {
          const isActive = currentUser.role === item.role;
          return (
            <div
              key={item.role}
              onClick={() => onSwitchRole(item.role)}
              className={`p-3.5 rounded-lg border cursor-pointer transition-colors flex flex-col justify-between ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/80 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold text-white ${item.user.avatarColor}`}>
                    {item.user.avatarInitials}
                  </div>
                  {isActive ? (
                    <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Active</span>
                  ) : (
                    <span className="text-[10px] text-slate-500 hover:text-slate-300">Click to switch</span>
                  )}
                </div>

                <div className="font-semibold text-white text-xs">{item.title}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.user.name}</div>
                <p className="text-[11px] text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
                <span>GPU: {item.user.gpuHoursQuota.total}h</span>
                <span>{item.user.permissions.isReadOnly ? 'Read-Only' : 'Operator'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Permissions Matrix Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              System Capability Matrix
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enforced by client router and server authorization proxies
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="px-5 py-3 w-80">Platform Capability</th>
                <th className="px-3 py-3 text-center">MLOps Engineer</th>
                <th className="px-3 py-3 text-center">Lead Engineer</th>
                <th className="px-3 py-3 text-center">Product Manager</th>
                <th className="px-3 py-3 text-center">Admin</th>
                <th className="px-3 py-3 text-center">Test User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {permissionsMatrix.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-white">{row.capability}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{row.description}</div>
                  </td>

                  {/* MLOps Engineer */}
                  <td className="px-3 py-3.5 text-center">
                    {row.mlops_engineer ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-slate-600 border border-slate-800">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Lead Engineer */}
                  <td className="px-3 py-3.5 text-center">
                    {row.lead_engineer ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-slate-600 border border-slate-800">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Product Manager */}
                  <td className="px-3 py-3.5 text-center">
                    {row.product_manager ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-slate-600 border border-slate-800">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Admin */}
                  <td className="px-3 py-3.5 text-center">
                    {row.admin ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-slate-600 border border-slate-800">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>

                  {/* Test User */}
                  <td className="px-3 py-3.5 text-center">
                    {row.test_user ? (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-slate-950 text-slate-600 border border-slate-800">
                        <X className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
