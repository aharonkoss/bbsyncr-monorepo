'use client';
import { Analytics } from '@/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// ✅ FIXED: Changed to accept data structure from API
interface AnalyticsChartsProps {
  data: Analytics;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // ✅ FIXED: Add safety checks
  const agents = data?.agents || [];
  const overall = data?.overall || {
    total_agents: 0,
    total_contracts: 0,
    buyer_broker_agreements: 0,
    exclusive_employment_agreements: 0,
  };

  // ✅ FIXED: Check if agents array exists before using .slice()
  if (!agents || agents.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center text-gray-500">
        No data available to display charts
      </div>
    );
  }

  // Prepare data for agent performance bar chart
  const agentChartData = agents.slice(0, 10).map((agent) => ({
    name: agent.agent_name.split(' ')[0], // First name only for better display
    'Buyer Broker': agent.buyer_broker_agreements,
    'Exclusive Buyer Broker': agent.exclusive_employment_agreements, // ✅ FIXED
    total: agent.total_contracts,
  }));

  // Prepare data for document type pie chart
  const documentTypePieData = [
    { name: 'Buyer Broker Agreements', value: overall.buyer_broker_agreements },
    { name: 'Exclusive Buyer Broker', value: overall.exclusive_employment_agreements }, // ✅ FIXED
  ];

  return (
    <div className="space-y-8">
      {/* Top Agent Performance Bar Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Top Agent Performance
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={agentChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Buyer Broker" fill="#3b82f6" />
            <Bar dataKey="Exclusive Buyer Broker" fill="#10b981" /> {/* ✅ FIXED */}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Document Type Distribution Pie Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Document Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={documentTypePieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent ?? 0 * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {documentTypePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Agents Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Agents</h3>
          <div className="space-y-4">
            {agents.slice(0, 5).map((agent, index) => (
              <div key={agent.agent_id} className="flex items-center">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                  {index + 1}
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-900">{agent.agent_name}</p>
                  <p className="text-sm text-gray-500">{agent.agent_email}</p>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-lg font-semibold text-gray-900">
                    {agent.total_contracts}
                  </p>
                  <p className="text-xs text-gray-500">contracts</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
