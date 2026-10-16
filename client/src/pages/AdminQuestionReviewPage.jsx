import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatusBadge } from '../components/common/Badge';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import {
  ArrowLeft,
  Trash2,
  RotateCcw,
  Flag,
  FileCode,
  ShieldCheck,
  History,
  Eye
} from 'lucide-react';

export function AdminQuestionReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState('');

  // Modals
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

  // Active section tab
  const [activeTab, setActiveTab] = useState('review'); // 'review', 'reports', 'testcases', 'audit'

  const loadDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/questions/${id}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load admin question review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [id]);

  if (loading) return <LoadingSpinner message="Loading question audit and inspection details..." />;
  if (!data) return <div className="text-center py-12 text-[#64748B]">Question not found.</div>;

  const { question, samples, testCases, reports, auditLogs } = data;

  // Handle Remove Question
  const handleRemove = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/questions/${id}/remove`, {
        reason: actionReason || 'Removed by administrator after verification'
      });
      setIsRemoveModalOpen(false);
      setActionReason('');
      await loadDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to remove question.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Restore Question
  const handleRestore = async () => {
    setActionLoading(true);
    try {
      await api.patch(`/admin/questions/${id}/restore`, {
        reason: actionReason || 'Reviewed and restored by administrator'
      });
      setIsRestoreModalOpen(false);
      setActionReason('');
      await loadDetails();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to restore question.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div>
        <Link
          to="/admin/reported"
          className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#2563EB] mb-3 font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Moderation Queue
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#DBEAFE]">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
              <StatusBadge status={question.status} />
              <span className="text-xs font-mono font-bold text-[#1E3A8A] bg-[#F5F9FF] border border-[#DBEAFE] px-2.5 py-0.5 rounded-md">
                {question.language_name} &bull; Level {question.level_number}
              </span>
              <h1 className="text-2xl font-bold text-[#1E3A8A]">{question.title}</h1>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#64748B]">
              <span>Question ID: <strong className="text-[#172554]">#{question.id}</strong></span>
              <span>&bull;</span>
              <span>Contributor: <strong className="text-[#172554]">{question.contributor_username}</strong></span>
              <span>&bull;</span>
              <span className="text-amber-800 font-bold">
                {question.distinct_report_count} Distinct Reports
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {question.status !== 'REMOVED' && (
              <button
                onClick={() => setIsRemoveModalOpen(true)}
                className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Remove Question
              </button>
            )}

            {question.status !== 'ACTIVE' && (
              <button
                onClick={() => setIsRestoreModalOpen(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Restore to Active
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center border-b border-[#DBEAFE] gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('review')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
            activeTab === 'review'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#172554]'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" /> Statement & Samples
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
            activeTab === 'reports'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#172554]'
          }`}
        >
          <Flag className="w-3.5 h-3.5 text-amber-500" /> Community Reports ({reports?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('testcases')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
            activeTab === 'testcases'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#172554]'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-purple-600" /> Hidden Test Cases ({testCases?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors shrink-0 ${
            activeTab === 'audit'
              ? 'border-[#2563EB] text-[#2563EB]'
              : 'border-transparent text-[#64748B] hover:text-[#172554]'
          }`}
        >
          <History className="w-3.5 h-3.5 text-[#2563EB]" /> Status Audit Trail ({auditLogs?.length || 0})
        </button>
      </div>

      {/* Tab 1: Statement & Samples */}
      {activeTab === 'review' && (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-[#1E3A8A]">Problem Statement</h3>
            <div className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] text-sm whitespace-pre-wrap text-[#172554]">
              {question.statement}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase block mb-1">Input Format:</span>
                <p className="text-xs text-[#172554] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                  {question.input_format}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase block mb-1">Output Format:</span>
                <p className="text-xs text-[#172554] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE]">
                  {question.output_format}
                </p>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold text-[#64748B] uppercase block mb-1">Constraints:</span>
              <pre className="text-xs font-mono text-[#1E3A8A] bg-[#F5F9FF] p-3 rounded-lg border border-[#DBEAFE] whitespace-pre-wrap">
                {question.constraints_text}
              </pre>
            </div>
          </div>

          <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-base font-bold text-[#1E3A8A]">Visible Sample Cases ({samples.length})</h3>
            {samples.map((s, idx) => (
              <div key={s.id || idx} className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] space-y-2 text-xs">
                <span className="font-bold text-[#2563EB]">Sample #{idx + 1}</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase block mb-1">Input:</span>
                    <pre className="p-2.5 bg-white border border-[#DBEAFE] rounded-lg text-[#172554] overflow-x-auto">{s.sample_input}</pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase block mb-1">Expected Output:</span>
                    <pre className="p-2.5 bg-white border border-emerald-200 rounded-lg text-emerald-800 font-bold overflow-x-auto">{s.expected_output}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Community Reports */}
      {activeTab === 'reports' && (
        <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-[#1E3A8A] mb-2">Detailed Community Reports</h3>
          {reports.length === 0 ? (
            <p className="text-xs text-[#64748B]">No reports recorded for this question.</p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => (
                <div key={rep.id} className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">{rep.reason}</span>
                    <span className="text-[#64748B]">{new Date(rep.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-[#64748B]">
                    Reported by: <strong className="text-[#172554]">{rep.reporter_username}</strong>
                  </div>
                  {rep.details && (
                    <div className="p-2.5 bg-white rounded-lg border border-[#DBEAFE] text-[#172554]">
                      Note: {rep.details}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Hidden Test Cases (ADMIN ONLY) */}
      {activeTab === 'testcases' && (
        <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                Private Test Cases (Admin Evaluation View)
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                These test cases are securely stored and never exposed to standard practice learners.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {testCases.map((tc, idx) => (
              <div key={tc.id || idx} className="p-4 bg-[#F5F9FF] rounded-xl border border-purple-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-800">
                    Test Case #{idx + 1} {tc.is_hidden ? '(Hidden)' : '(Public)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono">
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase block mb-1">Standard Input:</span>
                    <pre className="p-2.5 bg-white border border-[#DBEAFE] rounded-lg text-[#172554] overflow-x-auto">{tc.test_input}</pre>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#64748B] uppercase block mb-1">Expected Output:</span>
                    <pre className="p-2.5 bg-white border border-purple-200 rounded-lg text-purple-800 font-bold overflow-x-auto">{tc.expected_output}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Status Audit Trail */}
      {activeTab === 'audit' && (
        <div className="p-6 bg-white border border-[#DBEAFE] rounded-2xl space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-[#1E3A8A]">Status Transition History</h3>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-[#64748B]">No status transitions logged yet for this question.</p>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE] text-xs space-y-1">
                  <div className="flex items-center gap-2 mb-1">
                    <StatusBadge status={log.previous_status} />
                    <span className="text-[#64748B]">&rarr;</span>
                    <StatusBadge status={log.new_status} />
                    <span className="text-[#64748B] ml-auto">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-[#64748B]">
                    Reason: <span className="text-[#172554] font-medium">{log.reason}</span>
                  </div>
                  <div className="text-[#64748B] text-[11px]">
                    Action by: {log.admin_username || 'System Automation'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remove Confirmation Modal */}
      <ConfirmationModal
        isOpen={isRemoveModalOpen}
        onClose={() => setIsRemoveModalOpen(false)}
        onConfirm={handleRemove}
        title="Remove Question from Practice"
        message="This question will be set to REMOVED status and excluded globally from practice lists. All reports, submissions, and contributor records remain fully preserved."
        confirmText="Remove Question"
        isDanger={true}
        isLoading={actionLoading}
      />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={handleRestore}
        title="Restore Question to Practice"
        message="This question will return to ACTIVE status and become available for community practice again."
        confirmText="Restore to ACTIVE"
        isLoading={actionLoading}
      />
    </div>
  );
}
