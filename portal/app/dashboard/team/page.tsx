'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/lib/utils/formatters';
import InviteUserModal from '@/components/users/InviteUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  email: string;
  name: string;
  title?: string;
  role: string;
  company_id?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
}

interface Company {
  id: string;
  company_name: string;
}

export default function TeamPage() {
  const { user } = useAuthStore();
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // For global admin
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  useEffect(() => {
    if (user?.role === 'global_admin') {
      fetchCompanies();
    } else if (user?.role === 'company_admin' && user?.company_id) {
      fetchTeamMembers(user.company_id);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await apiClient.get('companies');
      const data = response.data || response;
      
      if (data?.companies && Array.isArray(data.companies)) {
        setCompanies(data.companies);
      } else {
        setCompanies([]);
      }
    } catch (error: any) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
      setLoading(false);
    }
  };

const fetchTeamMembers = async (companyId?: string) => {
  setLoading(true);
  try {
    const params: any = {};
    
    if (user?.role === 'global_admin') {
      if (!selectedCompanyId && !companyId) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }
      params.company_id = selectedCompanyId || companyId;
    } else if (companyId) {
      params.company_id = companyId;
    }

    const { data } = await apiClient.get('/users', { params });
    
    const typedUsers: User[] = data.users.map((u: any) => ({
      ...u,
      role: u.role as 'global_admin' | 'company_admin' | 'manager'
    }));
    
    setTeamMembers(typedUsers);
  } catch (error: any) {
    toast.error('Failed to fetch team members');
  } finally {
    setLoading(false);
  }
};



  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (companyId) {
      fetchTeamMembers(companyId);
    } else {
      setTeamMembers([]);
    }
  };

const handleEdit = (member: User) => {
  // Create a properly typed user object
  const typedUser: User = {
    ...member,
    role: member.role as 'global_admin' | 'company_admin' | 'manager'
  };
  setEditingUser(typedUser);
  setIsEditModalOpen(true);
};


  const handleDeactivate = async (userId: string, isActive: boolean) => {
    if (!confirm(`Are you sure you want to ${isActive ? 'deactivate' : 'activate'} this user?`)) {
      return;
    }

    try {
      await apiClient.put(`users/${userId}`, { is_active: !isActive });
      toast.success(`User ${isActive ? 'deactivated' : 'activated'} successfully`);
      
      // ✅ FIX: Use company_id with underscore
      if (user?.role === 'global_admin') {
        fetchTeamMembers(selectedCompanyId);
      } else if (user?.company_id) {
        fetchTeamMembers(user.company_id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`users/${userId}`);
      toast.success('User deleted successfully');
      
      // ✅ FIX: Use company_id with underscore
      if (user?.role === 'global_admin') {
        fetchTeamMembers(selectedCompanyId);
      } else if (user?.company_id) {
        fetchTeamMembers(user.company_id);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  if (user?.role !== 'company_admin' && user?.role !== 'global_admin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Only company administrators can access this page.</p>
      </div>
    );
  }

  if (loading && user?.role !== 'global_admin') {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Team Members</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage administrators and managers for{' '}
            {user?.role === 'global_admin' 
              ? 'selected company' 
              : 'your company'}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            disabled={user?.role === 'global_admin' && !selectedCompanyId}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Invite User
          </button>
        </div>
      </div>

      {/* Company Selector for Global Admin */}
      {user?.role === 'global_admin' && (
        <div className="mt-6 max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Company
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => handleCompanyChange(e.target.value)}
            disabled={loadingCompanies}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm disabled:opacity-50"
          >
            <option value="">
              {loadingCompanies ? 'Loading companies...' : 'Select a company...'}
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Team Members Table */}
      {(user?.role === 'company_admin' || selectedCompanyId) && (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                {loading ? (
                  <div className="py-12 text-center text-gray-500">
                    Loading team members...
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Name
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Title
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Role
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Last Login
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {teamMembers && teamMembers.length > 0 ? (
                        teamMembers.map((member) => (
                          <tr key={member.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {member.name}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {member.email}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {member.title || '-'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                {member.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {member.last_login ? formatDateTime(member.last_login) : 'Never'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${member.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {member.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              {/* Edit Button */}
                              <button
                                onClick={() => handleEdit(member)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                                title="Edit user"
                              >
                                <PencilIcon className="h-5 w-5 inline" />
                              </button>
                              
                              {/* Deactivate/Activate Button */}
                              <button
                                onClick={() => handleDeactivate(member.id, member.is_active)}
                                className="text-yellow-600 hover:text-yellow-900 mr-4"
                                title={member.is_active ? 'Deactivate' : 'Activate'}
                              >
                                {member.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                              
                              {/* Delete Button */}
                              <button
                                onClick={() => handleDelete(member.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete user"
                              >
                                <TrashIcon className="h-5 w-5 inline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                            {user?.role === 'global_admin' && !selectedCompanyId
                              ? 'Please select a company to view team members'
                              : 'No team members yet. Click "Invite User" to add managers or admins.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          if (user?.role === 'global_admin') {
            fetchTeamMembers(selectedCompanyId);
          } else if (user?.company_id) {
            fetchTeamMembers(user.company_id);
          }
        }}
      />

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          onSuccess={() => {
            fetchTeamMembers();
            setIsEditModalOpen(false);
            setEditingUser(null);
          }}
          user={{
                ...editingUser,
                role: editingUser.role as 'global_admin' | 'company_admin' | 'manager'
              }}
        />
      )}
    </div>
  );
}
