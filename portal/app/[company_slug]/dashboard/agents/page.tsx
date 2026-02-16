'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { EnvelopeIcon, LinkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { agentsApi, Agent } from '@/lib/api/agents';
import { profileApi } from '@/lib/api/profile';

export default function AgentsPage() {
  const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'active': 'Active',
    'trialing': 'Trial',
    'past_due': 'Past Due',
    'canceled': 'Canceled',
    'incomplete': 'Incomplete',
    'incomplete_expired': 'Expired',
    'unpaid': 'Unpaid',
    'pending': 'Pending',
  };
  return labels[status] || status;
};
  const params = useParams();
  const router = useRouter();
  const companySlug = params.company_slug as string;

  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [managerId, setManagerId] = useState<string>('');

  useEffect(() => {
    fetchManagerInfo();
    fetchAgents();
  }, []);

  const fetchManagerInfo = async () => {
    try {
      const user = await profileApi.getProfile();
      setManagerId(user.id);
    } catch (error: any) {
      console.error('Error fetching manager info:', error);
      toast.error('Failed to load manager information');
    }
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const data = await agentsApi.getAgents();
      setAgents(data);
    } catch (error: any) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const generateRegistrationLink = () => {
    if (!managerId) return '';
    
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    return `${frontendUrl}/${companySlug}/register/${managerId}`;
  };

  const handleCopyLink = () => {
    const link = generateRegistrationLink();
    
    if (!link) {
      toast.error('Unable to generate registration link');
      return;
    }

    navigator.clipboard.writeText(link);
    toast.success('Registration link copied to clipboard!', {
      icon: '📋',
      duration: 3000,
    });
  };

  const handleSendEmail = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!managerId) {
      toast.error('Manager information not loaded');
      return;
    }

    setSendingEmail(true);

    try {
      const registrationLink = generateRegistrationLink();
      
      await agentsApi.sendRegistrationEmail({
        email: inviteEmail,
        registrationLink,
      });

      toast.success(`Registration email sent to ${inviteEmail}!`, {
        icon: '📧',
      });
      
      setShowEmailModal(false);
      setInviteEmail('');
    } catch (error: any) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.error || 'Failed to send registration email');
    } finally {
      setSendingEmail(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agents</h1>
            <p className="mt-1 text-sm text-gray-500">View and manage your team members</p>
          </div>
          
          {/* Action Buttons */}
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            {/* Send Email Button */}
            <button
              onClick={() => setShowEmailModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              title="Send Registration Email"
            >
              <EnvelopeIcon className="w-5 h-5" />
            </button>

            {/* Copy Link Button */}
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
              title="Copy Registration Link"
            >
              <LinkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Agents Table */}
        {agents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900">No agents yet</h3>
            <p className="mt-1 text-sm text-gray-500">Send registration links to invite agents to your team.</p>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{agent.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{agent.phone || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                          {agent.status ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.status === 'active' ? 'bg-green-100 text-green-800' :
                              agent.status === 'trialing' ? 'bg-blue-100 text-blue-800' :
                              agent.status === 'past_due' ? 'bg-orange-100 text-orange-800' :
                              agent.status === 'canceled' || agent.status === 'incomplete_expired' || agent.status === 'unpaid' 
                                ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {agent.status === 'active' && <CheckCircleIcon className="w-3 h-3 mr-1" />}
                              {getStatusLabel(agent.status)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Not Registered</span>
                          )}
                        </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(agent.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center mb-4">
              <EnvelopeIcon className="w-6 h-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-900">Send Registration Email</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Enter the agent's email address to send them a registration link.
            </p>
            
            <div className="mb-4">
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Agent Email Address
              </label>
              <input
                type="email"
                id="inviteEmail"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendEmail()}
                placeholder="agent@example.com"
                className="block w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setInviteEmail('');
                }}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Email'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
