import React from 'react';
import { FolderOpen } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'There are no items matching your criteria.',
  action = null,
  icon: Icon = FolderOpen
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-[#DBEAFE] bg-white shadow-xs">
      <div className="p-3.5 bg-[#F5F9FF] rounded-full text-[#2563EB] mb-4 border border-[#DBEAFE]">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-[#1E3A8A] mb-1">{title}</h3>
      <p className="text-sm text-[#64748B] max-w-sm mb-5">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
