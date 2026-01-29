'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils/formatters';
import InviteUserModal from '@/components/users/InviteUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import { User } from '@/types';

interface Company {
  id: string;
  company_name: string;
  subdomain: string;
}

export default function TeamPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.company_slug as string;
  
  const [isHydrated, setIsHydrated] = useState(false);
  const user = useAuthStore((state) => state.user);
  
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Hydrate Zustand store first
  useEffect(() => {
    useAuthStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  // Check authentication and authorization after hydration
  useEffect(() => {
    if (!isHydrated) return;

    if (!user) {
      router.push(`/${companySlug}/login`);
      return;
    }

    if (user.role !== 'company_admin' && user.role !== 'global_admin') {
      toast.error('Access denied. Only administrators can view this page.');
      router.push(`/${companySlug}/dashboard`);
      return;
    }

    // If company admin, auto-select their company
    if (user.role === 'company_admin' && user.company_id) {
      setSelectedCompanyId(user.company_id);
    }

    // If global admin, fetch list of companies for dropdown
    if (user.role === 'global_admin') {
      fetchCompanies();
    }
  }, [isHydrated, user, router, companySlug]);

  // Fetch team members when company is selected
  useEffect(() => {
    if (isHydrated && user && selectedCompanyId) {
      fetchTeamMembers();
    }
  }, [isHydrated, user, selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const { data } = await apiClient.get('/companies');
      setCompanies(data.companies);
    } catch (error: any) {
      toast.error('Failed to fetch companies');
    }
  };

const fetchTeamMembers = async () => {
  if (!selectedCompanyId) return;

  try {
    setLoading(true);
    
    // Use /users endpoint instead of /users/team
    const { data } = await apiClient.get('/users', {
      params: { company_id: selectedCompanyId }
    });
    
    // Filter to only show admins and managers (not agents)
    const teamOnly = (data.users || data || []).filter((u: User) => 
      u.role === 'company_admin' || u.role === 'manager' || u.role === 'global_admin'
    );
    
    setTeamMembers(teamOnly);
  } catch (error: any) {
    console.error('Failed to fetch team members:', error);
    toast.error(error.response?.data?.error || 'Failed to fetch team members');
  } finally {
    setLoading(false);
  }
};


  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/users/${userId}`, {
        is_active: !currentStatus,
      });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchTeamMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiClient.delete(`/users/${userId}`);
      toast.success('User deleted successfully');
      fetchTeamMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // After hydration, if no user, redirect will happen
  if (!user) {
    return null;
  }

  // Check authorization
  if (user.role !== 'company_admin' && user.role !== 'global_admin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Access denied. Only administrators can view this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Team</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage administrators and managers for{' '}
            {user?.role === 'global_admin' ? 'selected company' : 'your company'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            disabled={user?.role === 'global_admin' && !selectedCompanyId}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Invite User
          </button>
        </div>
      </div>

      {/* Company Selector for Global Admin */}
      {user?.role === 'global_admin' && (
        <div className="bg-white p-4 rounded-lg shadow">
          <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Company
          </label>
          <select
            id="company-select"
            value={selectedCompanyId || ''}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">Choose a company...</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Team Members Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading team members...</div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {user?.role === 'global_admin' && !selectedCompanyId
                ? 'Please select a company to view team members'
                : 'No team members yet'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {user?.role === 'global_admin' && !selectedCompanyId
                ? ''
                : 'Click "Invite User" to add managers or admins.'}
            </p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teamMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.title || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.role.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {member.last_login ? formatDateTime(member.last_login) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        member.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button
                      onClick={() => setEditingUser(member)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(member.id, member.is_active)}
                      className={
                        member.is_active
                          ? 'text-orange-600 hover:text-orange-900'
                          : 'text-green-600 hover:text-green-900'
                      }
                    >
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(member.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite User Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchTeamMembers}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={fetchTeamMembers}
          user={editingUser}
        />
      )}
    </div>
  );
}
