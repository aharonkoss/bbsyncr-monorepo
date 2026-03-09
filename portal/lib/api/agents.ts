import apiClient from './client';

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  status: string;
}

export interface SendEmailRequest {
  email: string;
  registrationLink: string;
}

export const agentsApi = {
  /**
   * Get all agents for current manager
   */
  getAgents: async (): Promise<Agent[]> => {
    const response = await apiClient.get('/api/portal/agents');
    return response.data;
  },

  /**
   * Send registration email to agent
   */
  sendRegistrationEmail: async (data: SendEmailRequest): Promise<{ message: string; email: string }> => {
    const response = await apiClient.post('/api/portal/agents/send-registration-email', data);
    return response.data;
  },
  /**
   * Bulk add agents from CSV/XLSX upload
   */
  bulkAddAgents: async (
    agents: { agent_name: string; agent_email: string }[],
    customMessage: string,
    file: File,
    companyId?: string
  ): Promise<BulkAddResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agents', JSON.stringify(agents));
    formData.append('customMessage', customMessage);
    if (companyId) {
      formData.append('company_id', companyId);
    }

    const response = await apiClient.post('/api/portal/agents/bulk', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
