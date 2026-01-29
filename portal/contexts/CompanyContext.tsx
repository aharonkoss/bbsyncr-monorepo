'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Company } from '@/types';
import { companiesApi } from '@/lib/api/companies';
import toast from 'react-hot-toast';

interface CompanyContextType {
  company: Company | null;
  loading: boolean;
  refreshCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType>({
  company: null,
  loading: true,
  refreshCompany: async () => {},
});

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany must be used within CompanyProvider');
  }
  return context;
};

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const companySlug = params?.company_slug as string;

  const fetchCompany = async () => {
    if (!companySlug) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await companiesApi.getBySubdomain(companySlug);
      setCompany(data);

      // Apply company branding
      if (data.primary_color) {
        document.documentElement.style.setProperty('--primary-color', data.primary_color);
      }
      if (data.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', data.secondary_color);
      }
    } catch (error: any) {
      console.error('Error fetching company:', error);
      
      // If company not found, redirect to company selection
      if (error.response?.status === 404) {
        toast.error('Company not found');
        router.push('/');
      } else {
        toast.error('Failed to load company information');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, [companySlug]);

  const refreshCompany = async () => {
    await fetchCompany();
  };

  return (
    <CompanyContext.Provider value={{ company, loading, refreshCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}
