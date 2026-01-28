'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface CompanyBranding {
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  subdomain: string;
}

export function useBranding() {
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      // Get hostname from window
      const hostname = window.location.hostname;
      let subdomain = null;

      // Extract subdomain
      if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length >= 2 && parts[0] !== 'localhost') {
          subdomain = parts[0];
        }
      } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          subdomain = parts[0];
        }
      }

      console.log('🎨 Fetching branding for subdomain:', subdomain);

      if (!subdomain) {
        setLoading(false);
        return;
      }

      // Fetch company branding
      const { data } = await apiClient.get(`/companies/subdomain/${subdomain}`);
      
      console.log('✅ Branding loaded:', data.company);
      setBranding(data.company);
    } catch (error) {
      console.error('❌ Failed to fetch branding:', error);
    } finally {
      setLoading(false);
    }
  };

  return { branding, loading };
}
