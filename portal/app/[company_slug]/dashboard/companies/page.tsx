'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import { Company } from '@/types';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatDate } from '@/lib/utils/formatters';
import { exportToCSV } from '@/lib/utils/csvExport';
import CreateCompanyModal from '@/components/companies/CreateCompanyModal';
import EditCompanyModal from '@/components/companies/EditCompanyModal';
import ViewCompanyModal from '@/components/companies/ViewCompanyModal';

export default function CompaniesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);

  useEffect(() => {
    // Only global admins can access this page
    if (user?.role !== 'global_admin') {
      toast.error(`Access denied. Your role: ${JSON.stringify(user?.role)}`);
      router.push('/admin/dashboard');
      return;
    } else {

    }
    fetchCompanies();
  }, [user, router]);

  const fetchCompanies = async () => {
    try {
      const { data } = await apiClient.get('/companies');
      setCompanies(data.companies);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const handleExportCompanies = () => {
    if (companies.length === 0) {
      toast.error('No companies to export');
      return;
    }

    const exportData = companies.map((company) => ({
      'Company Name': company.company_name,
      'Subdomain': company.subdomain,
      'Address': company.address,
      'City': company.city,
      'State': company.state,
      'ZIP': company.zip,
      'Status': company.is_active ? 'Active' : 'Inactive',
      'Created': new Date(company.created_at).toLocaleDateString(),
    }));

    exportToCSV(exportData, 'companies_list');
    toast.success('Companies list exported successfully!');
  };

  if (user?.role !== 'global_admin') {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading companies...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Companies</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage all companies in the BBsynr system
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-3">
          <button
            type="button"
            onClick={handleExportCompanies}
            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Company
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className="mt-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No companies</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new company.
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Add Company
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        Company Name
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Subdomain
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Location
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Created
                      </th>
                      <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {companies.map((company) => (
                      <tr key={company.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                          <div className="flex items-center">
                            {company.logo_url && (
                              <div className="h-10 w-10 flex-shrink-0">
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={company.logo_url}
                                  alt={company.company_name}
                                />
                              </div>
                            )}
                            <div className={company.logo_url ? 'ml-4' : ''}>
                              <div className="font-medium text-gray-900">
                                {company.company_name}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            {company.subdomain}.bbsynr.com
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {company.city}, {company.state} {company.zip}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              company.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {company.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                          {formatDate(company.created_at)}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={() => setEditingCompany(company)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setViewingCompany(company)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchCompanies}
      />

      {/* Edit Company Modal */}
      {editingCompany && (
        <EditCompanyModal
          isOpen={!!editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={fetchCompanies}
          company={editingCompany}
        />
      )}

      {/* View Company Modal */}
      {viewingCompany && (
        <ViewCompanyModal
          isOpen={!!viewingCompany}
          onClose={() => setViewingCompany(null)}
          company={viewingCompany}
        />
      )}
    </div>
  );
}
