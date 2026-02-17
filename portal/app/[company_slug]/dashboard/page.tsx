'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  CalendarIcon,
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/lib/store/authStore';
import { dashboardApi, ComparisonStats } from '@/lib/api/dashboard';

interface Company {
  id: string;
  company_name: string;
  subdomain: string;
}

export default function DashboardPage() {
  const params = useParams();
  const companySlug = params.company_slug as string;

  // Auth user from store (includes role, company_id, etc.)
  const authUser = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [stats, setStats] = useState<ComparisonStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Applied filters
  const [comparisonDate, setComparisonDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Pending values in the UI (only applied when user clicks Apply Filters)
  const [tempDate, setTempDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [tempCompanyId, setTempCompanyId] = useState<string>('');

  const [companies, setCompanies] = useState<Company[]>([]);

  // Initial load: wait for authUser, then load companies (if needed) and stats
  useEffect(() => {
    if (!isAuthenticated || !authUser) {
      setLoading(false);
      return;
    }

    const init = async () => {
      try {
        setLoading(true);

        // If company_admin, lock to their company
        if (authUser.role === 'company_admin' && authUser.company_id) {
          setSelectedCompanyId(authUser.company_id);
          setTempCompanyId(authUser.company_id);
        }

        // If global_admin, load companies for dropdown
        if (authUser.role === 'global_admin') {
          await fetchCompanies();
        }

        await fetchStats(
          comparisonDate,
          authUser.role === 'company_admin' ? authUser.company_id || '' : selectedCompanyId
        );
      } catch (err) {
        console.error('Dashboard init error:', err);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [authUser, isAuthenticated]);

  // Fetch companies for global admin
  const fetchCompanies = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/companies`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        console.error('Companies API error:', await response.text());
        return;
      }

      const data = await response.json();
      // Adjust if your API wraps companies differently
      const list = Array.isArray(data) ? data : data.companies || [];
      setCompanies(list);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  // Fetch comparison stats with given filters
  const fetchStats = async (date: string, companyId: string) => {
    try {
      if (stats !== null) {
        setRefreshing(true);
      }

      const data = await dashboardApi.getComparisonStats(
        date,
        companyId || undefined
      );
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load statistics');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Apply Filters button handler
  const handleApplyFilters = () => {
    const appliedCompanyId =
      authUser?.role === 'company_admin' ? authUser.company_id || '' : tempCompanyId;

    setComparisonDate(tempDate);
    setSelectedCompanyId(appliedCompanyId);
    fetchStats(tempDate, appliedCompanyId);
  };

  const handleExportCSV = () => {
    if (!stats || stats.agents.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Agent Name', 'Agent Email', 'Previous 30 Days', 'Current 30 Days', 'Change'];
    const rows = stats.agents.map((agent) => [
      agent.agent_name,
      agent.agent_email,
      agent.previous_period.toString(),
      agent.current_period.toString(),
      (agent.current_period - agent.previous_period).toString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-comparison-${comparisonDate}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Report exported successfully!');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isAuthenticated || !authUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading user...</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      
      <div className="p-4 sm:p-6 lg:p-8 relative">
        {/* Spinner overlay when refreshing data */}
        {refreshing && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600 font-medium">Updating data...</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {authUser.role === 'global_admin'
              ? 'Global Administrator Dashboard'
              : authUser.role === 'company_admin'
              ? 'Company Dashboard'
              : 'Manager Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {authUser.name}!
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white shadow-md rounded-lg p-4 mb-6">
          <div
            className={`grid grid-cols-1 gap-4 ${
              authUser.role === 'global_admin' ? 'sm:grid-cols-4' : 'sm:grid-cols-3'
            }`}
          >
            {/* Company dropdown for global admins */}
            {authUser.role === 'global_admin' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company
                </label>
                <select
                  value={tempCompanyId}
                  onChange={(e) => setTempCompanyId(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.company_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CalendarIcon className="w-4 h-4 inline mr-1" />
                Comparison End Date
              </label>
              <input
                type="date"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Apply Filters */}
            <div className="flex items-end">
              <button
                onClick={handleApplyFilters}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                Apply Filters
              </button>
            </div>

            {/* Export CSV */}
            <div className="flex items-end">
              <button
                onClick={handleExportCSV}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Date ranges display */}
          {stats && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Previous Period:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(stats.date_ranges.previous_period.start)} -{' '}
                    {formatDate(stats.date_ranges.previous_period.end)}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Current Period:</span>
                  <span className="ml-2 text-gray-600">
                    {formatDate(stats.date_ranges.current_period.start)} -{' '}
                    {formatDate(stats.date_ranges.current_period.end)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                Buyer Broker Agreements
              </div>
              <div className="text-sm text-gray-600 mb-1">Previous 30 Days</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.summary.previous_period_total}
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">
                Buyer Broker Agreements
              </div>
              <div className="text-sm text-gray-600 mb-1">Current 30 Days</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.summary.current_period_total}
              </div>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Change</div>
              <div className="text-sm text-gray-600 mb-1">Period Comparison</div>
              <div className="flex items-center">
                <div className="text-3xl font-bold text-gray-900 mr-2">
                  {stats.summary.change > 0 ? '+' : ''}
                  {stats.summary.change}
                </div>
                <div
                  className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${
                    stats.summary.change > 0
                      ? 'bg-green-100 text-green-800'
                      : stats.summary.change < 0
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {stats.summary.change > 0 && (
                    <ArrowUpIcon className="w-4 h-4 mr-1" />
                  )}
                  {stats.summary.change < 0 && (
                    <ArrowDownIcon className="w-4 h-4 mr-1" />
                  )}
                  {stats.summary.change_percentage}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Agent performance table */}
        {stats && stats.agents.length > 0 ? (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Agent Performance
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Agent Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Previous 30 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Current 30 Days
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.agents.map((agent) => {
                    const change =
                      agent.current_period - agent.previous_period;
                    return (
                      <tr key={agent.agent_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {agent.agent_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {agent.agent_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                          {agent.previous_period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {agent.current_period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              change > 0
                                ? 'bg-green-100 text-green-800'
                                : change < 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {change > 0 && (
                              <ArrowUpIcon className="w-3 h-3 mr-1" />
                            )}
                            {change < 0 && (
                              <ArrowDownIcon className="w-3 h-3 mr-1" />
                            )}
                            {change > 0 ? '+' : ''}
                            {change}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <p className="text-gray-500">
              No agent data available for the selected period.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
