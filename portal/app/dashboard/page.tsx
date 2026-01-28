'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import {apiClient} from '@/lib/api/client';
import { Agent, Analytics } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Analytics['overall'] | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // ✅ Build query parameters based on user role
      const params: any = {};
      
      if (user?.role === 'manager') {
        // Managers only see their own data
        params.manager_id = user.id;
        params.company_id = user.company_id;
      } else if (user?.role === 'company_admin') {
        // Company admins see all data for their company
        params.company_id = user.company_id;
      }
      // Global admins see everything (no filters)

      console.log('🔍 Dashboard filters:', params);

      const [analyticsRes, agentsRes] = await Promise.all([
        apiClient.get('analytics/signings', { params }),
        apiClient.get('agents', { params }),
      ]);

      setStats(analyticsRes.data.overall);
      setAgents(agentsRes.data.agents.slice(0, 5)); // Show top 5
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {user?.role === 'global_admin'
            ? 'Global Administrator Dashboard'
            : user?.role === 'company_admin'
            ? `${user?.company?.company_name} - Administrator Dashboard`
            : user?.role === 'manager'
            ? `${user?.company?.company_name} - Manager Dashboard`
            : ''}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Agents */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Agents
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.total_agents || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Contracts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Contracts
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.total_contracts || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Buyer Broker Agreements */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Buyer Broker Agreements
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.buyer_broker_agreements || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Exclusive Employment */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Exclusive Employment
                  </dt>
                  <dd className="text-3xl font-semibold text-gray-900">
                    {stats?.exclusive_employment_agreements || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Agents */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Agents
          </h3>
          <Link
            href="/dashboard/agents"
            className="text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            View all
          </Link>
        </div>
        <div className="border-t border-gray-200">
          <ul className="divide-y divide-gray-200">
            {agents.map((agent) => (
              <li key={agent.id} className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {agent.agent_name}
                    </p>
                    <p className="text-sm text-gray-500">{agent.agent_email}</p>
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agent.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : agent.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {agent.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
            {agents.length === 0 && (
              <li className="px-4 py-8 text-center text-gray-500">
                No agents yet
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
