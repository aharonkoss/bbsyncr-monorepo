import apiClient from './client';

export interface ContractTemplate {
  id: string;
  company_id: string | null;
  created_by: string;
  name: string;
  description: string | null;
  pdf_storage_path: string;
  page_count: number;
  is_active: boolean;
  use_count: number;
  created_at: string;
  updated_at: string;
  contract_fields?: ContractField[];
}

export interface ContractField {
  id: string;
  template_id: string;
  field_type: 'text' | 'number' | 'date' | 'checkbox' | 'dropdown' | 'signature' | 'initials';
  label: string;
  placeholder: string | null;
  is_required: boolean;
  signer_index: number;
  page_number: number;
  x_percent: number;
  y_percent: number;
  width_percent: number;
  height_percent: number;
  dropdown_options: string[] | null;
  sort_order: number;
}

export const contractsApi = {

  listTemplates: async (): Promise<ContractTemplate[]> => {
    const { data } = await apiClient.get('/api/portal/contracts/templates');
    return data.templates;
  },

  getTemplate: async (id: string): Promise<ContractTemplate> => {
    const { data } = await apiClient.get(`/api/portal/contracts/templates/${id}`);
    return data.template;
  },

  createTemplate: async (formData: FormData): Promise<ContractTemplate> => {
    const { data } = await apiClient.post('/api/portal/contracts/templates', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.template;
  },

  updateTemplate: async (id: string, updates: Partial<ContractTemplate>): Promise<ContractTemplate> => {
    const { data } = await apiClient.put(`/api/portal/contracts/templates/${id}`, updates);
    return data.template;
  },

  getTemplateUrl: async (id: string): Promise<string> => {
    const { data } = await apiClient.get(`/api/portal/contracts/templates/${id}/url`);
    return data.url;
  },

  saveFields: async (templateId: string, fields: Partial<ContractField>[]): Promise<ContractField[]> => {
    const { data } = await apiClient.post(`/api/portal/contracts/templates/${templateId}/fields`, { fields });
    return data.fields;
  },

  deleteField: async (fieldId: string): Promise<void> => {
    await apiClient.delete(`/api/portal/contracts/fields/${fieldId}`);
  },
  deleteTemplate: async (templateId: string) => {
  try {
    const { data } = await apiClient.delete(`/api/portal/contracts/templates/${templateId}`);
    return data;
  } catch (error: any) {
    const message =
      error?.response?.data?.error ||
      error?.message ||
      'Failed to delete template';
    throw new Error(message);
  }
},
};
