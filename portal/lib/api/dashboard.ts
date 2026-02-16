import apiClient from './client';

export interface ComparisonStats {
  date_ranges: {
    previous_period: {
      start: string;
      end: string;
    };
    current_period: {
      start: string;
      end: string;
    };
  };
  summary: {
    previous_period_total: number;
    current_period_total: number;
    change: number;
    change_percentage: number;
  };
  agents: Array<{
    agent_id: string;
    agent_name: string;
    agent_email: string;
    current_period: number;
    previous_period: number;
  }>;
}

export const dashboardApi = {
  /**
   * Get comparison stats for dashboard
   */
  getComparisonStats: async (comparisonDate?: string, companyId?: string): Promise<ComparisonStats> => {
    const params: any = {};
    if (comparisonDate) params.comparison_date = comparisonDate;
    if (companyId) params.company_id = companyId;

    const response = await apiClient.get('/api/portal/dashboard/comparison-stats', { params });
    return response.data;
  },
};
