'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import InviteUserModal from '@/components/users/InviteUserModal';
import EditUserModal from '@/components/users/EditUserModal';
import EditInvitationModal from '@/components/users/EditInvitationModal';
import { User } from '@/types';

interface Company {
  id: string;
  company_name: string;
  subdomain: string;
}

interface Invitation {
  id: string;
  email: string;
  name: string | null;
  role: 'company_admin' | 'manager';
  token: string;
  invited_by: string;
  expires_at: string;
  accepted: boolean;
  accepted_at: string | null;
  last_sent_at: string;
  send_count: number;
  created_at: string;
  company: {
    company_name: string;
    subdomain: string;
  };
  status: 'pending' | 'expired' | 'accepted';
}

 type ViewMode = 'users' | 'invitations';
 const formatDateTimeLocal = (date: string | null): string => {
  if (!date) return 'Never';
  
  try {
    const dateObj = new Date(date);
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      console.error('Invalid date:', date);
      return 'Invalid Date';
    }
    
    // Format to show only the date (no time)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(dateObj);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Error';
  }
};

export default function TeamPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.company_slug as string;
  
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('users');
  const [teamMembers, setTeamMembers] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [filteredInvitations, setFilteredInvitations] = useState<Invitation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<Invitation | null>(null);
  // Format UTC time to local timezone
  // Check authentication and authorization
  useEffect(() => {
    if (!user) {
      router.push(`/${companySlug}/login`);
      return;
    }

    if (user.role !== 'company_admin' && user.role !== 'global_admin') {
      toast.error('Access denied. Only administrators can view this page.');
      router.push(`/${companySlug}/dashboard`);
      return;
    }

    if (user.role === 'company_admin' && user.company_id) {
      setSelectedCompanyId(user.company_id);
    }

    if (user.role === 'global_admin') {
      fetchCompanies();
    }
  }, [user, router, companySlug]);

  // Fetch data when company is selected or view mode changes
  useEffect(() => {
    if (user && selectedCompanyId) {
      if (viewMode === 'users') {
        fetchTeamMembers();
      } else {
        fetchInvitations();
      }
    }
  }, [user, selectedCompanyId, viewMode]);

  // Filter invitations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Filter out accepted invitations
      setFilteredInvitations(invitations.filter(inv => inv.status !== 'accepted'));
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = invitations.filter((inv) => {
        // Exclude accepted invitations
        if (inv.status === 'accepted') return false;
        
        const matchesName = inv.name?.toLowerCase().includes(query);
        const matchesEmail = inv.email.toLowerCase().includes(query);
        return matchesName || matchesEmail;
      });
      setFilteredInvitations(filtered);
    }
  }, [searchQuery, invitations]);

  const fetchCompanies = async () => {
    try {
      const { data } = await apiClient.get('/api/portal/companies');
      setCompanies(data.companies);
    } catch (error: any) {
      toast.error('Failed to fetch companies');
    }
  };

  const fetchTeamMembers = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      
      const { data } = await apiClient.get('/api/portal/users', {
        params: { company_id: selectedCompanyId }
      });
      
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

  const fetchInvitations = async () => {
    if (!selectedCompanyId) return;

    try {
      setLoading(true);
      
      const { data } = await apiClient.get('/api/portal/users/invitations', {
        params: { company_id: selectedCompanyId }
      });
      
      setInvitations(data.invitations || []);
    } catch (error: any) {
      console.error('Failed to fetch invitations:', error);
      toast.error(error.response?.data?.error || 'Failed to fetch invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await apiClient.patch(`/api/portal/users/${userId}`, {
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
      await apiClient.delete(`/api/portal/users/${userId}`);
      toast.success('User deleted successfully');
      fetchTeamMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      await apiClient.post(`/api/portal/users/${invitationId}/resend-invitation`);
      toast.success('Invitation resent successfully!');
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to resend invitation');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return;

    try {
      await apiClient.delete(`/api/portal/users/invitations/${invitationId}`);
      toast.success('Invitation canceled successfully');
      fetchInvitations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to cancel invitation');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800',
      accepted: 'bg-green-100 text-green-800',
    };

    return (
      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!user) {
    return null;
  }

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
          <h1 className="text-2xl font-semibold text-gray-900">Team Management</h1>
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

      {/* View Toggle Buttons */}
      {selectedCompanyId && (
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('users')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                viewMode === 'users'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Team Members
            </button>
            <button
              onClick={() => setViewMode('invitations')}
              className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                viewMode === 'invitations'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Pending Invitations
            </button>
          </div>
        </div>
      )}

      {/* Team Members Table */}
      {viewMode === 'users' && (
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
                      {member.last_login ? formatDateTimeLocal(member.last_login) : 'Never'}
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
      )}

      {/* Invitations Cards Grid */}
      {viewMode === 'invitations' && (
        <div className="space-y-4">
          {/* Search Box */}
          <div className="bg-white p-4 rounded-lg shadow">
            <label htmlFor="search-invitations" className="block text-sm font-medium text-gray-700 mb-2">
              Search Invitations
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <input
                type="text"
                id="search-invitations"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Type a name or email address to filter pending invitations
            </p>
          </div>

          {/* Cards Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12 bg-white rounded-lg shadow">
              <div className="text-gray-500">Loading invitations...</div>
            </div>
          ) : filteredInvitations.length === 0 ? (
            <div className="bg-white rounded-lg shadow">
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  {searchQuery ? 'No invitations match your search' : 'No pending invitations found'}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Click "Invite User" to send new invitations.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-200 p-6"
                >
                  {/* Header with Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {invitation.name || 'No Name'}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{invitation.email}</p>
                    </div>
                    <div className="ml-4">
                      {getStatusBadge(invitation.status)}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="space-y-3 border-t border-gray-200 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Role</span>
                      <span className="text-sm text-gray-900">{invitation.role.replace('_', ' ')}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Sent Date</span>
                      <span className="text-sm text-gray-900">{formatDateTimeLocal(invitation.last_sent_at)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Expires At</span>
                      <span className="text-sm text-gray-900">{formatDateTimeLocal(invitation.expires_at)}</span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500 uppercase">Send Count</span>
                      <span className="text-sm text-gray-900">{invitation.send_count}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex flex-col space-y-2 border-t border-gray-200 pt-4">
                    <button
                      onClick={() => setEditingInvitation(invitation)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-blue-600 text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Invitation
                    </button>

                    <button
                      onClick={() => handleResendInvitation(invitation.id)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-md text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      Resend Invitation
                    </button>

                    <button
                      onClick={() => handleCancelInvitation(invitation.id)}
                      className="w-full inline-flex justify-center items-center px-4 py-2 border border-red-600 text-sm font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel Invitation
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <InviteUserModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => {
          if (viewMode === 'invitations') {
            fetchInvitations();
          } else {
            fetchTeamMembers();
          }
        }}
      />

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={fetchTeamMembers}
          user={editingUser}
        />
      )}

      {editingInvitation && (
        <EditInvitationModal
          isOpen={!!editingInvitation}
          onClose={() => setEditingInvitation(null)}
          onSuccess={fetchInvitations}
          invitation={editingInvitation}
        />
      )}
    </div>
  );
}
