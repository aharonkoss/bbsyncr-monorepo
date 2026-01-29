'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { companiesApi } from '@/lib/api/companies';
import { Company } from '@/types';
import toast from 'react-hot-toast';

export default function CompanySelectionPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const data = await companiesApi.getActiveCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySelect = (subdomain: string) => {
    router.push(`/${subdomain}/login`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading companies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            BBsynr Portal
          </h1>
          <p className="text-lg text-gray-600">
            Select your company to continue
          </p>
        </div>

        {/* Company Grid */}
        {companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No active companies found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <button
                key={company.id}
                onClick={() => handleCompanySelect(company.subdomain)}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 p-6 text-left group"
                style={{
                  borderTop: `4px solid ${company.primary_color}`,
                }}
              >
                {/* Company Logo */}
                {company.logo_url ? (
                  <div className="mb-4 flex items-center justify-center h-16">
                    <img
                      src={company.logo_url}
                      alt={`${company.company_name} logo`}
                      className="max-h-16 max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className="mb-4 h-16 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${company.primary_color}20` }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: company.primary_color }}
                    >
                      {company.company_name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Company Name */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {company.company_name}
                </h3>

                {/* Company Location */}
                {(company.city || company.state) && (
                  <p className="text-sm text-gray-500">
                    {[company.city, company.state].filter(Boolean).join(', ')}
                  </p>
                )}

                {/* Arrow Icon */}
                <div className="mt-4 flex items-center text-sm text-gray-400 group-hover:text-blue-600 transition-colors">
                  <span>Continue</span>
                  <svg
                    className="ml-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}
