'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Agent } from '@/types';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const router = useRouter();
  const params = useParams();
  const companySlug = params.company_slug as string;
  
  const { company } = useCompany();
  
  // ✅ REMOVED isHydrated - not needed with cookies
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  const [stats, setStats] = useState({
    total_agents: 0,
    pending_invitations: 0,
    active_agents: 0,
  });
  const [recentAgents, setRecentAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ REMOVED HYDRATION EFFECT - No longer needed with cookies!

  // Check authentication and fetch data
  useEffect(() => {
    // ✅ Simple check - no hydration needed
    if (!isAuthenticated || !user) {
      console.log('❌ Not authenticated, redirecting to login');
      router.push(`/${companySlug}/login`);
      return;
    }

    console.log('✅ User loaded:', user);
    fetchDashboardData();
  }, [isAuthenticated, user, router, companySlug]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      
      // Fetch agents list
      const { data } = await apiClient.get('/api/portal/agents');
      console.log('✅ Raw API response:', data);

      const agents = data?.agents || data || [];
      console.log('✅ Agents array:', agents);
      
      // Log first agent to see structure
      if (agents.length > 0) {
        console.log('✅ First agent structure:', agents[0]);
      }
      
      // Calculate stats - DEFENSIVE: Check multiple possible field names
      const total = agents.length;
      
      // Try different field names for status
      const pending = agents.filter((a: any) => {
        const status = a.registration_status || a.status || a.invite_status;
        return status === 'pending' || status === 'invited';
      }).length;
      
      const active = agents.filter((a: any) => {
        const status = a.registration_status || a.status || a.invite_status;
        return status === 'registered' || status === 'active';
      }).length;

      console.log('📊 Calculated stats:', { total, pending, active });

      setStats({
        total_agents: total,
        pending_invitations: pending,
        active_agents: active,
      });

      // Get recent agents (last 5)
      setRecentAgents(agents.slice(0, 5));

      console.log('✅ Dashboard data loaded successfully');
    } catch (error: any) {
      console.error('❌ Dashboard error:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      console.log('✅ Loading complete');
    }
  };

  // Show loading while fetching data
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no user, return null (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {user?.role === 'global_admin'
            ? 'Global Administrator Dashboard'
            : user?.role === 'company_admin'
            ? `${company?.company_name} - Administrator Dashboard`
            : user?.role === 'manager'
            ? `${company?.company_name} - Manager Dashboard`
            : 'Dashboard'}
        </h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_agents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-yellow-100 rounded-full p-3">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Invitations</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending_invitations}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Agents</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_agents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Agents */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Agents</h2>
        </div>
        <div className="p-6">
          {recentAgents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No agents yet. Start by inviting your first agent!</p>
          ) : (
            <div className="space-y-4">
              {recentAgents.map((agent: any) => {
                // DEFENSIVE: Get status from multiple possible fields
                const status = agent.registration_status || agent.status || agent.invite_status || 'unknown';
                
                return (
                  <div key={agent.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{agent.agent_name}</p>
                      <p className="text-sm text-gray-500">{agent.agent_email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full ${
                        status === 'registered' || status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : status === 'pending' || status === 'invited'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
