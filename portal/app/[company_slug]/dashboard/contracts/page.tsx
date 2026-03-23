'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { contractsApi, ContractTemplate } from '@/lib/api/contracts';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  company_name: string;
}

export default function ContractsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.company_slug as string;
  const user = useAuthStore(state => state.user);

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);  // ← NEW
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);  // ← NEW

  const isGlobalAdmin = user?.role === 'global_admin';

  useEffect(() => {
    if (isGlobalAdmin) {
      fetchCompanies();
    } else {
      fetchTemplates();
    }
  }, []);

  useEffect(() => {
    if (isGlobalAdmin) {
      fetchTemplates(selectedCompanyId);
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    try {
      const { data } = await apiClient.get('/api/portal/companies/active');
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async (companyId?: string) => {
    try {
      setLoading(true);
      const params = companyId ? `?company_id=${companyId}` : '';
      const { data } = await apiClient.get(`/api/portal/contracts/templates${params}`);
      setTemplates(data.templates);
    } catch (error) {
      toast.error('Failed to load contract templates');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (template: ContractTemplate) => {
    try {
      await contractsApi.updateTemplate(template.id, { is_active: !template.is_active });
      setTemplates(prev =>
        prev.map(t => t.id === template.id ? { ...t, is_active: !t.is_active } : t)
      );
      toast.success(`Template ${template.is_active ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error('Failed to update template');
    }
  };

  // ── NEW ──
  const handleDelete = async (id: string) => {
  try {
    await contractsApi.deleteTemplate(id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    toast.success('Template deleted successfully');
  } catch (error: any) {
    // ✅ Extract the API error message if available
    toast.error('Cannot delete the template because it is tied to contracts. Please deactivate the template instead of deleting it. ');
  }
};

  return (
    <div>
      {/* Header */}
      <div className="sm:flex sm:items-center mb-6">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Contract Library</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage reusable contract templates for your company.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => router.push(`/${companySlug}/dashboard/contracts/new`)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
          >
            + Add Contract
          </button>
        </div>
      </div>

      {/* Global Admin Company Filter */}
      {isGlobalAdmin && (
        <div className="mb-6 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Company
          </label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          >
            <option value="">All Companies</option>
            {companies.map(company => (
              <option key={company.id} value={company.id}>
                {company.company_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">Loading...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500 mb-4">
            {isGlobalAdmin && !selectedCompanyId
              ? 'Select a company to view its templates, or add a new contract.'
              : 'No contract templates yet.'}
          </p>
          <button
            onClick={() => router.push(`/${companySlug}/dashboard/contracts/new`)}
            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Add Your First Contract
          </button>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Pages</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Times Used</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {templates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {template.name}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500">{template.description || '—'}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{template.page_count}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{template.use_count}</td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm">
                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 space-x-3">
                    <button
                      onClick={() => router.push(`/${companySlug}/dashboard/contracts/${template.id}/edit`)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Edit Fields
                    </button>
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`font-medium ${
                        template.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      }`}
                    >
                      {template.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    {/* ── NEW DELETE BUTTON ── */}
                    {confirmDeleteId === template.id ? (
                      <span className="inline-flex items-center gap-2">
                        <span className="text-gray-600 text-xs">Sure?</span>
                        <button
                          onClick={() => handleDelete(template.id)}
                          disabled={deletingId === template.id}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          {deletingId === template.id ? 'Deleting...' : 'Yes, Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(template.id)}
                        className="text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
