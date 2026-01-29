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

interface AnalyticsChartsProps {
  data: Analytics;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const agents = data?.agents || [];
  const overall = data?.overall || {
    total_agents: 0,
    total_contracts: 0,
    buyer_broker_agreements: 0,
    exclusive_buyer_broker_agreements: 0,
  };

  if (!agents || agents.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
        No data available for the selected period
      </div>
    );
  }

  // ✅ FIXED: Calculate percentages correctly
  const total = overall.buyer_broker_agreements + overall.exclusive_buyer_broker_agreements;
  
  const pieData = [
    { 
      name: 'Buyer Broker Agreements', 
      value: overall.buyer_broker_agreements,
      percentage: total > 0 ? ((overall.buyer_broker_agreements / total) * 100).toFixed(0) : 0
    },
    { 
      name: 'Exclusive Buyer Broker', 
      value: overall.exclusive_buyer_broker_agreements,
      percentage: total > 0 ? ((overall.exclusive_buyer_broker_agreements / total) * 100).toFixed(0) : 0
    },
  ];

  const barData = agents.slice(0, 10).map((agent) => ({
    name: agent.agent_name.split(' ')[0], // First name only for cleaner display
    'Buyer Broker': agent.buyer_broker_agreements,
    'Exclusive Buyer Broker': agent.exclusive_buyer_broker_agreements,
  }));

  // Top 5 Agents by total contracts
  const topAgents = [...agents]
    .sort((a, b) => b.total_contracts - a.total_contracts)
    .slice(0, 5);

  // Custom label to show percentage
  const renderCustomLabel = (entry: any) => {
    return `${entry.name}: ${entry.percentage}%`;
  };

  return (
    <div className="space-y-6">
      {/* Top Agent Performance Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Agent Performance</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Buyer Broker" fill="#3b82f6" />
            <Bar dataKey="Exclusive Buyer Broker" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Second Row: Pie Chart and Top 5 Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Document Type Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top 5 Agents List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Top 5 Agents</h3>
          <div className="space-y-3">
            {topAgents.map((agent, index) => (
              <div
                key={agent.agent_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{agent.agent_name}</div>
                    <div className="text-sm text-gray-500">{agent.agent_email}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {agent.total_contracts}
                  </div>
                  <div className="text-xs text-gray-500">contracts</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
