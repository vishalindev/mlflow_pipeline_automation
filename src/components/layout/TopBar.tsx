import React from 'react';
import { UserProfile, UserRole } from '../../types/mlops';
import { User, ShieldCheck, ChevronDown, Bell, Terminal } from 'lucide-react';

export type NavTab = 'training' | 'flow' | 'kubeflow' | 'mlflow' | 'cvat' | 'rbac' | 'docs';

interface TopBarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  currentUser: UserProfile;
  onSwitchRole: (role: UserRole) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  runningTasksCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onSwitchRole,
  onOpenSettings,
  onOpenProfile,
  runningTasksCount,
}) => {
  const [roleDropdownOpen, setRoleDropdownOpen] = React.useState(false);

  const roles: { role: UserRole; label: string; user: string }[] = [
    { role: 'mlops_engineer', label: 'MLOps Engineer', user: 'Sarah Jenkins' },
    { role: 'lead_engineer', label: 'Lead Engineer', user: 'Dr. Marcus Vance' },
    { role: 'product_manager', label: 'Product Manager', user: 'Elena Rostova' },
    { role: 'admin', label: 'Admin', user: 'Arthur Sterling' },
    { role: 'test_user', label: 'Test User (Sandbox)', user: 'Alex Rivera' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      {/* Zone 1: Brand title, single line text element */}
      <div className="flex items-center gap-3">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('training');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-indigo-400 transition-colors flex items-center gap-2"
        >
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center text-white text-xs font-mono font-bold shadow-sm">
            Nx
          </div>
          <span>NexusML</span>
        </a>
        <span className="hidden sm:inline text-xs text-slate-500 font-mono">v2.8-prod</span>
      </div>

      {/* Zone 2: 4-6 text navigation links */}
      <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
        <button
          onClick={() => setActiveTab('flow')}
          className={`px-2.5 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'flow'
              ? 'text-white bg-indigo-600 shadow-sm'
              : 'text-indigo-300 hover:text-white hover:bg-slate-900 border border-indigo-900/60'
          }`}
        >
          <span>Pipeline Flow</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        </button>

        <button
          onClick={() => setActiveTab('training')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'training'
              ? 'text-white bg-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Training Pipeline
        </button>

        <button
          onClick={() => setActiveTab('kubeflow')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'kubeflow'
              ? 'text-white bg-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <span>Kubeflow Tracker</span>
          {runningTasksCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono flex items-center justify-center font-bold">
              {runningTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('mlflow')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'mlflow'
              ? 'text-white bg-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          MLflow Dashboard
        </button>

        <button
          onClick={() => setActiveTab('cvat')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'cvat'
              ? 'text-white bg-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          CVAT Datasets
        </button>

        <button
          onClick={() => setActiveTab('rbac')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'rbac'
              ? 'text-white bg-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          RBAC Matrix
        </button>

        <button
          onClick={() => setActiveTab('docs')}
          className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
            activeTab === 'docs'
              ? 'text-white bg-slate-800 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Instructions
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        {/* Role Switcher Menu */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs transition-colors"
            title="Switch RBAC Persona"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <div className="text-left hidden sm:block">
              <span className="text-slate-400 text-[11px] block leading-none">Role</span>
              <span className="font-semibold text-slate-200 leading-tight block">{currentUser.roleTitle.split(' ')[0]} {currentUser.roleTitle.split(' ')[1]}</span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-md shadow-xl py-1 z-50">
              <div className="px-3 py-2 border-b border-slate-800">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Switch Active RBAC Persona</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Test permissions & visibility across roles</p>
              </div>
              {roles.map((r) => (
                <button
                  key={r.role}
                  onClick={() => {
                    onSwitchRole(r.role);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    currentUser.role === r.role ? 'bg-indigo-950/40 text-indigo-300 font-medium' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-medium">{r.label}</div>
                    <div className="text-[11px] text-slate-500">{r.user}</div>
                  </div>
                  {currentUser.role === r.role && (
                    <span className="text-xs text-indigo-400 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Profile trigger */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1 pl-2 pr-2.5 rounded hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          title="User Profile & Quota"
        >
          <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold text-white ${currentUser.avatarColor}`}>
            {currentUser.avatarInitials}
          </div>
          <span className="text-xs font-medium text-slate-200 hidden lg:inline">{currentUser.name}</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
          title="Cluster & API Settings"
        >
          <Terminal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
