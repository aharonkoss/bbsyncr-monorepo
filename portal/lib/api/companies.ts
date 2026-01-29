import { apiClient } from './client';
import { Company } from '@/types';

export const companiesApi = {
  // Get all active companies
  getActiveCompanies: async () => {
    const { data } = await apiClient.get('/companies/active');
    return data || []; // Extract companies array from response
  },

  // Get company by subdomain/slug
  getBySubdomain: async (subdomain: string) => {
    const { data } = await apiClient.get(`/companies/subdomain/${subdomain}`);
    return data.company || []; // Extract company object from response ✅
  },
};
