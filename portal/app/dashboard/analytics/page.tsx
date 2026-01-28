'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { Analytics, AgentStats } from '@/types';
import toast from 'react-hot-toast';
import { format, subDays } from 'date-fns';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import { exportToCSV } from '@/lib/utils/csvExport';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(
    format(subDays(new Date(), 30), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [documentType, setDocumentType] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [startDate, endDate, documentType]);

  const fetchAnalytics = async () => {
    try {
      if (analytics !== null) {
         setRefreshing(true); // Only show overlay if data already exists
      }
      const { data } = await apiClient.get('/analytics/signings', {
        params: {
          start_date: startDate,
          end_date: endDate,
          document_type: documentType,
        },
      });
      setAnalytics(data);
      setRefreshing(false);
    } catch (error) {
      toast.error('Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!analytics || analytics.agents.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = analytics.agents.map((agent) => ({
      'Agent Name': agent.agent_name,
      'Email': agent.agent_email,
      'Total Contracts': agent.total_contracts,
      'Buyer Broker Agreements': agent.buyer_broker_agreements,
      'Exclusive Buyer Broker Agreements': agent.exclusive_buyer_broker_agreements, // ✅ FIXED
    }));

    exportToCSV(exportData, 'analytics_report');
    toast.success('Report exported successfully!');
  };

  if (loading) {
    return <div className="flex justify-center py-12">Loading...</div>;
  }

  return (    
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Document Type
          </label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="all">All Types</option>
            <option value="Buyer Broker Agreement">Buyer Broker Agreement</option>
            <option value="Exclusive Buyer Broker Agreement">Exclusive Buyer Broker Agreement</option> {/* ✅ FIXED */}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={handleExport}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Export CSV
        </button>
      </div>
      <div className="relative">
      {refreshing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 z-50">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <svg className="animate-spin h-6 w-6 text-blue-600">...</svg>
            <span>Updating data...</span>
          </div>
        </div>
      )}
      </div>
      {/* Charts */}
      {analytics && analytics.agents.length > 0 && (
        <AnalyticsCharts data={analytics} />
      )}

      {/* Overall Stats */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Total Contracts
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {analytics?.overall.total_contracts || 0}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Buyer Broker Agreements
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {analytics?.overall.buyer_broker_agreements || 0}
            </dd>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">
              Exclusive Buyer Broker {/* ✅ FIXED */}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {analytics?.overall.exclusive_buyer_broker_agreements || 0} {/* ✅ FIXED */}
            </dd>
          </div>
        </div>
      </div>

      {/* Agent Performance Table */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Agent Performance</h2>
        <div className="mt-4 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Agent Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Email
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Total Contracts
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Buyer Broker
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Exclusive Buyer Broker {/* ✅ FIXED */}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {analytics?.agents.map((agent) => (
                      <tr key={agent.agent_id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                          {agent.agent_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {agent.agent_email}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {agent.total_contracts}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {agent.buyer_broker_agreements}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {agent.exclusive_buyer_broker_agreements} {/* ✅ FIXED */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
