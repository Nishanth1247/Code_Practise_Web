import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDanger = false,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white border border-[#DBEAFE] rounded-2xl shadow-xl p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#172554] transition-colors p-1 rounded-lg hover:bg-[#F5F9FF]"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl shrink-0 ${isDanger ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-blue-50 text-[#2563EB] border border-[#DBEAFE]'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">{title}</h3>
            <p className="text-sm text-[#64748B] mt-1">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172554] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-xl transition-all shadow-sm flex items-center gap-2 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
            } disabled:opacity-50`}
          >
            {isLoading && <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
