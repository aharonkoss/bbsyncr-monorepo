'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import { Agent } from '@/types';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/formatters';
import AddAgentModal from '@/components/agents/AddAgentModal';
import { exportToCSV } from '@/lib/utils/csvExport';

export default function AgentsPage() {
  const { user } = useAuthStore();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null); // ✅ Track which agent is being sent reminder

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data } = await apiClient.get('/agents');
      setAgents(data.agents);
    } catch (error) {
      toast.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (agentId: string) => {
    try {
      setSendingReminder(agentId); // ✅ Set loading state for this specific agent
      await apiClient.post(`/agents/${agentId}/send-invitation`);
      toast.success('Invitation reminder sent!');
      fetchAgents();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reminder');
    } finally {
      setSendingReminder(null); // ✅ Clear loading state
    }
  };

  const handleExportAgents = () => {
    if (agents.length === 0) {
      toast.error('No agents to export');
      return;
    }

    const exportData = agents.map((agent) => ({
      'Agent Name': agent.agent_name,
      'Email': agent.agent_email,
      'Phone': agent.agent_phone || '',
      'Status': agent.status,
      'Company': agent.company?.company_name || '',
      'Manager': agent.manager?.name || '',
      'Invitation Sent': new Date(agent.invitation_sent_at).toLocaleDateString(),
      'Reminders Sent': agent.reminder_count,
    }));

    exportToCSV(exportData, 'agents_list');
    toast.success('Agents list exported successfully!');
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Agents</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage agents and their registration status
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={handleExportAgents}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Export CSV
          </button>
          {(user?.role === 'manager' || user?.role === 'company_admin') && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Add Agent
            </button>
          )}
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
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
                      Phone
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Invitation Sent
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Reminders
                    </th>
                    <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {agents.map((agent) => (
                    <tr key={agent.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {agent.agent_name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {agent.agent_email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {agent.agent_phone || '-'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            agent.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : agent.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {formatDate(agent.invitation_sent_at)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {agent.reminder_count}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                        {agent.status === 'pending' && (
                          <button
                            onClick={() => handleSendReminder(agent.id)}
                            disabled={sendingReminder === agent.id}
                            className="inline-flex items-center text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {/* ✅ Show spinner when this specific agent's reminder is being sent */}
                            {sendingReminder === agent.id ? (
                              <>
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  />
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  />
                                </svg>
                                Sending...
                              </>
                            ) : (
                              'Send Reminder'
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <AddAgentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchAgents}
      />
    </div>
  );
}
