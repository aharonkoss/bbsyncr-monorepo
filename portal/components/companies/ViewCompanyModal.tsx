'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Company } from '@/types';
import { formatDate } from '@/lib/utils/formatters';

interface ViewCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company;
}

export default function ViewCompanyModal({
  isOpen,
  onClose,
  company,
}: ViewCompanyModalProps) {
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
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div>
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold leading-6 text-gray-900 mb-6"
                  >
                    Company Details
                  </Dialog.Title>

                  <div className="space-y-6">
                    {/* Company Logo */}
                    {company.logo_url && (
                      <div className="flex justify-center">
                        <img
                          src={company.logo_url}
                          alt={company.company_name}
                          className="h-24 w-24 rounded-lg object-cover"
                        />
                      </div>
                    )}

                    {/* Basic Information */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Basic Information
                      </h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Company Name</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {company.company_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Subdomain</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                              {company.subdomain}.bbsynr.com
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Status</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            <span
                              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                company.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {company.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Created</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {formatDate(company.created_at)}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* Address */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Address</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                          <dt className="text-sm font-medium text-gray-500">Street</dt>
                          <dd className="mt-1 text-sm text-gray-900">{company.address}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">City</dt>
                          <dd className="mt-1 text-sm text-gray-900">{company.city}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">State</dt>
                          <dd className="mt-1 text-sm text-gray-900">{company.state}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">ZIP Code</dt>
                          <dd className="mt-1 text-sm text-gray-900">{company.zip}</dd>
                        </div>
                      </dl>
                    </div>

                    {/* Branding */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Branding</h4>
                      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Primary Color</dt>
                          <dd className="mt-1 flex items-center">
                            <div
                              className="h-6 w-6 rounded border border-gray-300"
                              style={{ backgroundColor: company.primary_color }}
                            />
                            <span className="ml-2 text-sm text-gray-900">
                              {company.primary_color}
                            </span>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Secondary Color</dt>
                          <dd className="mt-1 flex items-center">
                            <div
                              className="h-6 w-6 rounded border border-gray-300"
                              style={{ backgroundColor: company.secondary_color }}
                            />
                            <span className="ml-2 text-sm text-gray-900">
                              {company.secondary_color}
                            </span>
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
