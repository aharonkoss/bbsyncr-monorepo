import { apiClient } from './client';

export const companiesApi = {
  // Get all active companies
  getActiveCompanies: async () => {
     // ✅ Use fetch directly (no auth headers)
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/companies/active`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    return response.json();
  },

  // Get company by subdomain (full name)
  getCompanyBySubdomain: async (subdomain: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/companies/subdomain/${subdomain}`);
    if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    return response.json();
  },

  // Alias for backward compatibility
  getBySubdomain: async (subdomain: string) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/portal/companies/subdomain/${subdomain}`);
     if (!response.ok) {
      throw new Error('Failed to fetch companies');
    }
    
    return response.json();
  },

  // Get all companies (admin only)
  getAllCompanies: async () => {
    const { data } = await apiClient.get('/api/portal/companies');
    return data;
  },

  // Get single company by ID
  getCompany: async (id: string) => {
    const { data } = await apiClient.get(`/api/portal/companies/${id}`);
    return data;
  },

  // Create company (admin only)
  createCompany: async (companyData: any) => {
    const { data } = await apiClient.post('/api/portal/companies', companyData);
    return data;
  },

  // Update company
  updateCompany: async (id: string, companyData: any) => {
    const { data } = await apiClient.put(`/api/portal/companies/${id}`, companyData);
    return data;
  },

  // Upload company logo
  uploadLogo: async (id: string, formData: FormData) => {
    const { data } = await apiClient.post(`/api/portal/companies/${id}/upload-logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  // Update branding
  updateBranding: async (id: string, branding: { primary_color: string; secondary_color: string }) => {
    const { data } = await apiClient.put(`/api/portal/companies/${id}/branding`, branding);
    return data;
  },
};
