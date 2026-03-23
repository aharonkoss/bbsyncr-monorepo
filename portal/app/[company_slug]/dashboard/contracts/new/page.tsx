'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  company_name: string;
}

export default function NewContractPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.company_slug as string;
  const user = useAuthStore(state => state.user);

  const isGlobalAdmin = user?.role === 'global_admin';

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    company_id: '',
  });

  useEffect(() => {
    if (isGlobalAdmin) fetchCompanies();
  }, [isGlobalAdmin]);

  const fetchCompanies = async () => {
    try {
      setLoadingCompanies(true);
      const { data } = await apiClient.get('/api/portal/companies/active');
      setCompanies(data);
    } catch (error) {
      toast.error('Failed to load companies');
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSetFile(file);
  };

  const validateAndSetFile = (file: File) => {
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be under 10MB');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('Template name is required'); return; }
    if (isGlobalAdmin && !formData.company_id) { toast.error('Please select a company'); return; }
    if (!selectedFile) { toast.error('Please upload a PDF file'); return; }

    setLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', formData.name.trim());
      payload.append('description', formData.description.trim());
      payload.append('pdf', selectedFile);
      if (isGlobalAdmin && formData.company_id) {
        payload.append('company_id', formData.company_id);
      }

      const { data } = await apiClient.post('/api/portal/contracts/templates', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Contract template created successfully');
      router.push(`/${companySlug}/dashboard/contracts/${data.template.id}/edit`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error || 'Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "block w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          ← Back to Contract Library
        </button>
        <h1 className="text-2xl font-semibold text-gray-900">Add New Contract</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload a PDF and you will be taken to the field builder to set up the form.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-8 space-y-8">

        {/* Company selector — global admin only */}
        {isGlobalAdmin && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company <span className="text-red-500">*</span>
            </label>
            {loadingCompanies ? (
              <p className="text-sm text-gray-400">Loading companies...</p>
            ) : (
              <select
                value={formData.company_id}
                onChange={(e) => setFormData(prev => ({ ...prev, company_id: e.target.value }))}
                className={inputClass}
                required
              >
                <option value="">Select a company...</option>
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.company_name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Template Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contract Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Buyer Broker Agreement"
            className={inputClass}
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description of this contract"
            rows={4}
            className={inputClass}
          />
        </div>

        {/* PDF Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            PDF Document <span className="text-red-500">*</span>
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex justify-center px-6 py-12 border-2 border-dashed rounded-lg transition-colors ${
              dragOver
                ? 'border-blue-400 bg-blue-50'
                : selectedFile
                ? 'border-green-400 bg-green-50'
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }`}
          >
            <div className="space-y-2 text-center">
              {selectedFile ? (
                <>
                  <p className="text-4xl">📄</p>
                  <p className="text-base font-medium text-green-700">{selectedFile.name}</p>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-sm text-red-500 hover:text-red-700 underline"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <p className="text-4xl">📁</p>
                  <div className="flex text-base text-gray-600 justify-center gap-1">
                    <label className="cursor-pointer font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a PDF</span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <span>or drag and drop</span>
                  </div>
                  <p className="text-sm text-gray-400">PDF files only, up to 10MB</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 py-3 px-6 rounded-lg text-base font-medium text-white transition-colors ${
              loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Uploading...' : 'Upload & Continue to Field Builder →'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-lg text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
}
