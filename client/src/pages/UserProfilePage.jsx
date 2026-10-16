import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Mail, Calendar, CheckCircle2, History, FolderGit2 } from 'lucide-react';

export function UserProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await api.get('/auth/me');
        setProfile(res.data.user);
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMe();
  }, []);

  if (loading) return <LoadingSpinner message="Loading user profile..." />;

  const displayUser = profile || user;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-[#1E3A8A] tracking-tight">User Profile</h1>
        <p className="text-[#64748B] text-sm mt-1">
          Account details and platform participation records.
        </p>
      </div>

      <div className="bg-white border border-[#DBEAFE] rounded-2xl p-8 mb-8 space-y-6 shadow-sm">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-[#DBEAFE] border border-blue-200 flex items-center justify-center text-2xl font-black text-[#2563EB]">
            {displayUser?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[#1E3A8A]">{displayUser?.username}</h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                displayUser?.role === 'ADMIN'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-blue-100 text-[#2563EB] border border-blue-200'
              }`}>
                {displayUser?.role}
              </span>
            </div>
            <p className="text-[#64748B] text-xs mt-1 flex items-center gap-1.5 font-medium">
              <Mail className="w-3.5 h-3.5 text-[#2563EB]" /> {displayUser?.email}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#DBEAFE]">
          <div className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE]">
            <span className="text-xs text-[#64748B] font-medium flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Solved Questions
            </span>
            <span className="text-xl font-bold text-[#1E3A8A]">
              {displayUser?.stats?.totalSolved || 0}
            </span>
          </div>

          <div className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE]">
            <span className="text-xs text-[#64748B] font-medium flex items-center gap-1.5 mb-1">
              <History className="w-4 h-4 text-[#2563EB]" /> Total Submissions
            </span>
            <span className="text-xl font-bold text-[#1E3A8A]">
              {displayUser?.stats?.totalSubmissions || 0}
            </span>
          </div>

          <div className="p-4 bg-[#F5F9FF] rounded-xl border border-[#DBEAFE]">
            <span className="text-xs text-[#64748B] font-medium flex items-center gap-1.5 mb-1">
              <FolderGit2 className="w-4 h-4 text-purple-600" /> Contributed
            </span>
            <span className="text-xl font-bold text-[#1E3A8A]">
              {displayUser?.stats?.totalContributed || 0}
            </span>
          </div>
        </div>

        <div className="pt-2 text-xs text-[#64748B] flex items-center gap-1.5 font-medium">
          <Calendar className="w-3.5 h-3.5" />
          Member since: {displayUser?.createdAt ? new Date(displayUser.createdAt).toLocaleDateString() : 'Active Member'}
        </div>
      </div>
    </div>
  );
}
