import React from 'react';

export function StatusBadge({ status }) {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
          Active
        </span>
      );
    case 'PENDING_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-pulse"></span>
          Pending Review
        </span>
      );
    case 'REMOVED':
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
          Removed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 border border-slate-200">
          {status}
        </span>
      );
  }
}

export function VerdictBadge({ verdict }) {
  switch (verdict) {
    case 'Accepted':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          Accepted
        </span>
      );
    case 'Wrong Answer':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          Wrong Answer
        </span>
      );
    case 'Compilation Error':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          Compilation Error
        </span>
      );
    case 'Time Limit Exceeded':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-50 text-orange-800 border border-orange-200">
          Time Limit Exceeded
        </span>
      );
    case 'Runtime Error':
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Runtime Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {verdict || 'Executed'}
        </span>
      );
  }
}

export function RoleBadge({ role }) {
  if (role === 'ADMIN') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-700 border border-purple-200">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-600"></span>
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-[#2563EB] border border-[#DBEAFE]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]"></span>
      User
    </span>
  );
}

export function AccountStatusBadge({ status = 'ACTIVE' }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 border border-slate-200">
      <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
      {status}
    </span>
  );
}
