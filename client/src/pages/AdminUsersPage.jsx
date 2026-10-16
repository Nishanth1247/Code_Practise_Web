import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { RoleBadge, AccountStatusBadge } from '../components/common/Badge';
import {
  Users,
  Search,
  Filter,
  Edit2,
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
  User,
  Calendar,
  Code2,
  Check,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Info,
  Trash2
} from 'lucide-react';

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ totalAll: 0, totalAdmins: 0, totalUsers: 0 });
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Notifications
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Edit Modal State
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({ username: '', email: '', role: 'USER', status: 'ACTIVE' });
  const [modalError, setModalError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal State
  const [deletingUser, setDeletingUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Clear top-level notifications automatically after 5s
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
        setErrorMsg('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users', {
        params: {
          search: debouncedSearch || undefined,
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          sort,
          page,
          limit: 15
        }
      });

      setUsers(res.data.users || []);
      setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 });
      if (res.data.counts) {
        setCounts(res.data.counts);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      setErrorMsg(err.response?.data?.error || 'Failed to load user records.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, roleFilter, statusFilter, sort, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setSort('newest');
    setPage(1);
  };

  // Open Edit Modal
  const handleOpenEdit = (targetUser) => {
    setEditingUser(targetUser);
    setEditFormData({
      username: targetUser.username,
      email: targetUser.email,
      role: targetUser.role,
      status: targetUser.status || 'ACTIVE'
    });
    setModalError('');
  };

  // Close Edit Modal
  const handleCloseEdit = () => {
    setEditingUser(null);
    setModalError('');
  };

  // Submit Edit Form
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setModalError('');

    // Client-side validations
    const trimmedUsername = editFormData.username.trim();
    const trimmedEmail = editFormData.email.trim();

    if (!trimmedUsername) {
      setModalError('Username is required.');
      return;
    }
    if (trimmedUsername.length < 3 || trimmedUsername.length > 50) {
      setModalError('Username must be between 3 and 50 characters.');
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setModalError('Username may only contain letters, numbers, and underscores.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      setModalError('Please enter a valid email address.');
      return;
    }

    if (currentUser?.id === editingUser.id && editFormData.role !== 'ADMIN') {
      setModalError('You cannot remove administrator privileges from your own account.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.patch(`/admin/users/${editingUser.id}`, {
        username: trimmedUsername,
        email: trimmedEmail,
        role: editFormData.role
      });

      setSuccessMsg(res.data.message || `User '${trimmedUsername}' updated successfully.`);
      handleCloseEdit();
      fetchUsers();
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to update user. Please verify all fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Delete Modal
  const handleOpenDelete = (targetUser) => {
    setDeletingUser(targetUser);
    setDeleteModalError('');
  };

  // Close Delete Modal
  const handleCloseDelete = () => {
    setDeletingUser(null);
    setDeleteModalError('');
  };

  // Confirm Delete User
  const handleConfirmDelete = async () => {
    if (!deletingUser) return;
    try {
      setIsDeleting(true);
      setDeleteModalError('');
      const res = await api.delete(`/admin/users/${deletingUser.id}`);
      setSuccessMsg(res.data.message || `User '${deletingUser.username}' has been deleted.`);
      handleCloseDelete();
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setDeleteModalError(err.response?.data?.error || 'Failed to delete user account.');
    } finally {
      setIsDeleting(false);
    }
  };

  const isFiltering = search || roleFilter || statusFilter || sort !== 'newest';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">User Management</h1>
          <p className="text-[#64748B] text-sm mt-1">
            Search, inspect, and manage community coder accounts and administrator roles.
          </p>
        </div>

        {/* Action button / quick indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-[#2563EB] border border-[#DBEAFE] rounded-xl flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {counts.totalAll} Registered Accounts
          </span>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider block">Total Users</span>
            <span className="text-2xl font-black text-[#1E3A8A] mt-0.5 block">{counts.totalAll}</span>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#2563EB] rounded-xl border border-blue-200">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider block">Standard Coders</span>
            <span className="text-2xl font-black text-emerald-700 mt-0.5 block">{counts.totalUsers}</span>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-200">
            <User className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 bg-white border border-[#DBEAFE] rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider block">Administrators</span>
            <span className="text-2xl font-black text-purple-700 mt-0.5 block">{counts.totalAdmins}</span>
          </div>
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-200">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-600 hover:text-rose-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-[#DBEAFE] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by username or email address..."
              className="w-full pl-10 pr-9 py-2 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl text-xs text-[#172554] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#172554]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-1.5">
              <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="USER">User (Standard)</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-1.5">
              <Filter className="w-3.5 h-3.5 text-[#2563EB]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
              </select>
            </div>

            {/* Sort order */}
            <div className="flex items-center gap-1.5 bg-[#F5F9FF] border border-[#DBEAFE] rounded-xl px-3 py-1.5">
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-semibold text-[#172554] focus:outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="username_asc">Username (A-Z)</option>
                <option value="username_desc">Username (Z-A)</option>
                <option value="email_asc">Email (A-Z)</option>
              </select>
            </div>

            {/* Reset button */}
            {isFiltering && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563EB] hover:bg-[#F5F9FF] border border-dashed border-[#CBD5E1] rounded-xl flex items-center gap-1 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Users Content */}
      {loading ? (
        <LoadingSpinner message="Loading user directory..." />
      ) : users.length === 0 ? (
        <EmptyState
          title="No users found"
          description={
            isFiltering
              ? "No registered accounts match your current search and filter criteria."
              : "No users currently registered in the database."
          }
          icon={Users}
          actionText={isFiltering ? "Clear Filters" : undefined}
          onAction={isFiltering ? handleResetFilters : undefined}
        />
      ) : (
        <div className="bg-white border border-[#DBEAFE] rounded-2xl shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F9FF] border-b border-[#DBEAFE] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16">ID</th>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Activity</th>
                  <th className="py-3.5 px-4">Registered</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DBEAFE] text-xs text-[#172554]">
                {users.map((u) => {
                  const isCurrentAuthUser = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#64748B]">
                        #{u.id}
                      </td>

                      {/* Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            u.role === 'ADMIN'
                              ? 'bg-purple-100 text-purple-700 border border-purple-200'
                              : 'bg-blue-100 text-[#2563EB] border border-blue-200'
                          }`}>
                            {u.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-[#1E3A8A] flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isCurrentAuthUser && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-100 text-[#2563EB]">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#64748B] md:hidden block">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-[#172554] truncate max-w-xs">
                        {u.email}
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        <RoleBadge role={u.role} />
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <AccountStatusBadge status={u.status} />
                      </td>

                      {/* Activity Metrics */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2 text-[11px] font-semibold text-[#64748B] bg-[#F5F9FF] border border-[#DBEAFE] px-2.5 py-1 rounded-lg">
                          <span title="Questions Solved" className="text-emerald-700">
                            {u.solvedCount} solved
                          </span>
                          <span>&bull;</span>
                          <span title="Questions Contributed" className="text-[#2563EB]">
                            {u.contributedCount} contributed
                          </span>
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 text-[#64748B] text-[11px] whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#94A3B8]" />
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2563EB] bg-blue-50 hover:bg-blue-100 border border-[#DBEAFE] rounded-xl transition-all shadow-2xs hover:shadow-xs"
                            title={`Edit user ${u.username}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            onClick={() => handleOpenDelete(u)}
                            disabled={isCurrentAuthUser || u.email === 'admin@example.com'}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all shadow-2xs hover:shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                            title={
                              isCurrentAuthUser
                                ? "Cannot delete your own administrator account"
                                : u.email === 'admin@example.com'
                                ? "Cannot delete primary root admin account"
                                : `Delete user ${u.username}`
                            }
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-[#F5F9FF] border-t border-[#DBEAFE] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
            <div>
              Showing <strong className="text-[#172554]">{users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}</strong> to{' '}
              <strong className="text-[#172554]">{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> of{' '}
              <strong className="text-[#172554]">{pagination.total}</strong> accounts
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1 || loading}
                className="px-3 py-1.5 bg-white border border-[#DBEAFE] rounded-xl font-semibold text-[#172554] hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>

              <span className="font-bold text-[#1E3A8A] px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="px-3 py-1.5 bg-white border border-[#DBEAFE] rounded-xl font-semibold text-[#172554] hover:bg-blue-50 disabled:opacity-40 disabled:hover:bg-white flex items-center gap-1 transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg bg-white border border-[#DBEAFE] rounded-2xl shadow-xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 bg-[#F5F9FF] border-b border-[#DBEAFE] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 text-[#2563EB] rounded-xl border border-blue-200">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1E3A8A]">Edit User Account</h3>
                  <p className="text-xs text-[#64748B]">Update profile information, email, and platform role.</p>
                </div>
              </div>
              <button
                onClick={handleCloseEdit}
                disabled={isSubmitting}
                className="text-[#64748B] hover:text-[#172554] p-1.5 rounded-lg hover:bg-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Informational alert for self-editing */}
              {currentUser?.id === editingUser.id && (
                <div className="p-3 rounded-xl bg-blue-50 border border-[#DBEAFE] text-xs text-[#1E3A8A] flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>You are editing your own administrator account. Admin role cannot be removed.</span>
                </div>
              )}

              {/* User ID (Read-only) */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  value={`#${editingUser.id}`}
                  disabled
                  className="w-full bg-slate-100 border border-[#DBEAFE] rounded-xl px-3.5 py-2 text-xs font-mono text-[#64748B] cursor-not-allowed"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  placeholder="e.g. coder_alex"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#DBEAFE] rounded-xl px-3.5 py-2 text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
                <span className="text-[10px] text-[#94A3B8] mt-1 block">Letters, numbers, and underscores only.</span>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  placeholder="e.g. alex@example.com"
                  disabled={isSubmitting}
                  className="w-full bg-white border border-[#DBEAFE] rounded-xl px-3.5 py-2 text-xs text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                  required
                />
                <span className="text-[10px] text-[#94A3B8] mt-1 block">Must be unique across all user accounts.</span>
              </div>

              {/* Role */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Platform Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                  disabled={isSubmitting || currentUser?.id === editingUser.id}
                  className="w-full bg-white border border-[#DBEAFE] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#172554] focus:outline-none focus:ring-2 focus:ring-[#2563EB] disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="USER">USER (Standard Practice Access)</option>
                  <option value="ADMIN">ADMIN (Full Platform & Moderation Access)</option>
                </select>
                {currentUser?.id === editingUser.id && (
                  <span className="text-[10px] text-amber-700 mt-1 block">
                    Self-demotion disabled to protect admin console access.
                  </span>
                )}
              </div>

              {/* Account Status */}
              <div>
                <label className="block text-[11px] font-bold text-[#64748B] uppercase mb-1">
                  Account Status
                </label>
                <input
                  type="text"
                  value="ACTIVE (Normal Operation)"
                  disabled
                  className="w-full bg-slate-100 border border-[#DBEAFE] rounded-xl px-3.5 py-2 text-xs font-semibold text-emerald-700 cursor-not-allowed"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#DBEAFE]">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172554] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white border border-rose-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-6 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-rose-950">Delete User Account</h3>
                  <p className="text-xs text-rose-700">Permanent account deactivation & removal from user directory</p>
                </div>
              </div>
              <button
                onClick={handleCloseDelete}
                disabled={isDeleting}
                className="text-rose-500 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {deleteModalError && (
                <div className="p-3.5 rounded-xl bg-rose-100 border border-rose-300 text-rose-900 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                  <span>{deleteModalError}</span>
                </div>
              )}

              <p className="text-xs text-[#475569] leading-relaxed">
                Are you sure you want to delete this account? The user will be immediately logged out and blocked from logging in again.
              </p>

              {/* Target User Summary Card */}
              <div className="p-3.5 bg-[#F8FAFC] border border-[#DBEAFE] rounded-xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-semibold">User:</span>
                  <span className="font-bold text-[#1E3A8A]">@{deletingUser.username} (#{deletingUser.id})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-semibold">Email:</span>
                  <span className="font-mono text-[#172554]">{deletingUser.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#64748B] font-semibold">Role:</span>
                  <RoleBadge role={deletingUser.role} />
                </div>
              </div>

              {/* Preservation notice */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Data Preservation:</strong> Submissions, solutions, contributed questions, and audit logs are safely preserved in the database for platform integrity.
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-semibold text-[#64748B] hover:text-[#172554] bg-[#F5F9FF] hover:bg-[#DBEAFE] border border-[#DBEAFE] rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      Deleting User...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Confirm & Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
