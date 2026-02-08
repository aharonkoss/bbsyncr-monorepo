'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { companiesApi } from '@/lib/api/companies';

interface Company {
  id: string;
  company_name: string;
  subdomain: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  is_active: boolean;
}

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const subdomain = params.company_slug as string;

  const fetchCompany = async () => {
    if (!subdomain) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching company with subdomain:', subdomain);
      
      // ✅ Use the correct function name from your companies.ts
      const response = await companiesApi.getCompanyBySubdomain(subdomain);
      
      console.log('📦 Raw API response:', response);
      
      // ✅ Handle the nested "company" structure from your backend
      const companyData = response.company || response;
      
      console.log('✅ Company data:', companyData);
      setCompany(companyData);
    } catch (err: any) {
      console.error('❌ Error fetching company:', err);
      setError(err.response?.data?.error || 'Failed to load company');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [subdomain]);

  return (
    <CompanyContext.Provider value={{ company, loading, error, refetch: fetchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
