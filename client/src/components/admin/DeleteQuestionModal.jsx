import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../common/Badge';

export function DeleteQuestionModal({
  isOpen,
  onClose,
  question,
  onConfirm,
  isLoading = false
}) {
  const [reason, setReason] = useState('');

  if (!isOpen || !question) return null;

  const isAlreadyRemoved = question.status === 'REMOVED';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-[#DBEAFE] rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-[#64748B] hover:text-[#172554] p-1.5 rounded-xl hover:bg-[#F5F9FF] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-[#2563EB] bg-[#F5F9FF] border border-[#DBEAFE] px-2 py-0.5 rounded-md">
                Question #{question.id}
              </span>
              <StatusBadge status={question.status} />
            </div>
            <h3 className="text-lg font-bold text-[#1E3A8A]">
              {isAlreadyRemoved ? 'Question is Already Removed' : 'Delete Question from Practice'}
            </h3>
          </div>
        </div>

        {/* Question Details Card */}
        <div className="p-4 rounded-2xl bg-[#F5F9FF] border border-[#DBEAFE] mb-4 space-y-2">
          <h4 className="text-sm font-bold text-[#172554] line-clamp-2">
            {question.title}
          </h4>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#DBEAFE] font-semibold text-[#1E3A8A]">
              {question.language_name || question.languageName || 'Language'}
            </span>
            <span>&bull;</span>
            <span className="px-2 py-0.5 rounded-md bg-white border border-[#DBEAFE] font-semibold text-[#1E3A8A]">
              Level {question.level_number || question.levelNumber || '1'} {question.level_title ? `(${question.level_title})` : ''}
            </span>
          </div>
        </div>

        {/* Warning or Status Message */}
        {isAlreadyRemoved ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 mb-4">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              This question has already been soft-deleted and removed from active practice. Historical records, submissions, and audit trails remain preserved.
            </span>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div>
              <p className="font-bold">Warning: Question will be removed from practice.</p>
              <p className="mt-0.5 text-rose-600">
                The question will be marked as <strong>REMOVED</strong> and immediately blocked from user practice, random selection, search results, and code execution. All historical submissions, test cases, and audit logs are safely preserved.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAlreadyRemoved && (
            <div>
              <label className="block text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-1.5">
                Reason for Removal (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Duplicate question, deprecated test cases, low quality..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#172554] text-xs focus:outline-none focus:border-[#2563EB]"
                disabled={isLoading}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172554] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors disabled:opacity-50"
            >
              {isAlreadyRemoved ? 'Close' : 'Cancel'}
            </button>
            {!isAlreadyRemoved && (
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading && (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                )}
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Soft-Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default DeleteQuestionModal;
