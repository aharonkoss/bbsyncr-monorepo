'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { Company } from '@/types';

interface EditCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  company: Company;
}

export default function EditCompanyModal({
  isOpen,
  onClose,
  onSuccess,
  company,
}: EditCompanyModalProps) {
  const [formData, setFormData] = useState({
    company_name: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    primary_color: '',
    secondary_color: '',
    is_active: true,
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name,
        address: company.address || '',
        city: company.city || '',
        state: company.state || '',
        zip: company.zip || '',
        primary_color: company.primary_color || '#3B82F6',
        secondary_color: company.secondary_color || '#10B981',
        is_active: company.is_active || false,
      });
      setLogoPreview(company.logo_url || null);
    }
  }, [company]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo file size must be less than 5MB');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update company details
      await apiClient.put(`/api/portal/companies/${company.id}`, formData);

      // Upload logo if changed
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);
        await apiClient.post(`/api/portal/companies/${company.id}/upload-logo`, logoFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      toast.success('Company updated successfully!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update company');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative w-full max-w-2xl max-h-[90vh] flex flex-col transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
                {/* Fixed Header */}
                <div className="flex items-center justify-between px-4 py-5 sm:px-6 border-b border-gray-200">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                    Edit Company
                  </Dialog.Title>
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                  <form id="edit-company-form" onSubmit={handleSubmit} className="space-y-4">
                    {/* Company Logo */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Logo
                      </label>
                      <div className="flex items-center space-x-4">
                        {logoPreview && (
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">PNG, JPG, SVG up to 5MB</p>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Company Name
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.company_name}
                          onChange={(e) =>
                            setFormData({ ...formData, company_name: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Subdomain
                        </label>
                        <div className="mt-1 flex rounded-md shadow-sm">
                          <input
                            type="text"
                            disabled
                            value={company.subdomain}
                            className="block w-full rounded-l-md border-gray-300 bg-gray-50 sm:text-sm"
                          />
                          <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-gray-500 sm:text-sm">
                            .bbsynr.com
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Subdomain cannot be changed</p>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Address</label>
                        <input
                          type="text"
                          required
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">State</label>
                        <input
                          type="text"
                          required
                          maxLength={2}
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value.toUpperCase() })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                        <input
                          type="text"
                          required
                          value={formData.zip}
                          onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {/* Branding */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Branding</h4>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Primary Color
                          </label>
                          <input
                            type="color"
                            value={formData.primary_color}
                            onChange={(e) =>
                              setFormData({ ...formData, primary_color: e.target.value })
                            }
                            className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Secondary Color
                          </label>
                          <input
                            type="color"
                            value={formData.secondary_color}
                            onChange={(e) =>
                              setFormData({ ...formData, secondary_color: e.target.value })
                            }
                            className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center border-t pt-4">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) =>
                          setFormData({ ...formData, is_active: e.target.checked })
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                        Company is active
                      </label>
                    </div>
                  </form>
                </div>

                {/* Fixed Footer */}
                <div className="flex flex-row-reverse gap-3 px-4 py-4 sm:px-6 border-t border-gray-200 bg-gray-50">
                  <button
                    type="submit"
                    form="edit-company-form"
                    disabled={loading}
                    className="inline-flex justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
