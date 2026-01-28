'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/store/authStore';

interface Company {
  id: string;
  company_name: string;
}

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'manager' as 'company_admin' | 'manager',
    title: '',
    company_id: '',
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user?.role === 'global_admin') {
      fetchCompanies();
    } else if (isOpen && user?.company_id) {
      setFormData(prev => ({ ...prev, company_id: user.company_id }));
    }
  }, [isOpen, user]);

  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await apiClient.get('companies');
      const responseData = response.data || response;
      if (responseData?.companies && Array.isArray(responseData.companies)) {
        setCompanies(responseData.companies);
      } else {
        console.error('Unexpected response format:', responseData);
        setCompanies([]);
      }
    } catch (error: any) {
      console.error('Error fetching companies:', error);
      toast.error('Failed to load companies');
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.role === 'global_admin' && !formData.company_id) {
      toast.error('Please select a company');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('users/invite', {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        title: formData.title,
        company_id: formData.company_id,
      });

      toast.success(`${formData.role === 'manager' ? 'Manager' : 'Company Admin'} invitation sent!`);
      onSuccess();
      onClose();

      setFormData({
        email: '',
        name: '',
        role: 'manager',
        title: '',
        company_id: '',
      });
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-2xl font-semibold leading-6 text-gray-900">
                    Invite User
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Company Selection - Only for Global Admin */}
                  {user?.role === 'global_admin' && (
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <select
                        id="company"
                        required
                        value={formData.company_id}
                        onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
                        disabled={loadingCompanies}
                        className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm disabled:opacity-50 disabled:bg-gray-100"
                      >
                        <option value="">
                          {loadingCompanies ? 'Loading companies...' : 'Select a company...'}
                        </option>
                        {companies && companies.length > 0 ? (
                          companies.map((company) => (
                            <option key={company.id} value={company.id}>
                              {company.company_name}
                            </option>
                          ))
                        ) : (
                          !loadingCompanies && (
                            <option disabled>No companies available</option>
                          )
                        )}
                      </select>
                    </div>
                  )}

                  {/* Role Selection */}
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <select
                      id="role"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as 'company_admin' | 'manager' })}
                      className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                    >
                      <option value="manager">Manager</option>
                      <option value="company_admin">Company Admin</option>
                    </select>
                  </div>

                  {/* Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                      placeholder="John Smith"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                      placeholder="john@example.com"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm"
                      placeholder="Branch Manager"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="rounded-md bg-blue-50 p-4">
                    <p className="text-sm text-blue-700">
                      An invitation email will be sent to this address with instructions to set up their account.
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-3 text-base font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Sending...' : 'Send Invitation'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
