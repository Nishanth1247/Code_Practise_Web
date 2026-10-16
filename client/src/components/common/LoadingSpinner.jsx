import React from 'react';
import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ message = 'Loading...', size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-10 h-10' : 'w-7 h-7';

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Loader2 className={`${sizeClasses} text-[#2563EB] animate-spin mb-3`} />
      {message && <p className="text-[#64748B] text-sm font-medium">{message}</p>}
    </div>
  );
}
