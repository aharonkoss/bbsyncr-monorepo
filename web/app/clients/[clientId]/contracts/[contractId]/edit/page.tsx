'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  fetchCurrentUser,
  fetchClientContract,
  updateClientContract,
  ContractField,
} from '@/lib/api';

interface SignerForm {
  id: string;
  signer_index: number;
  name: string;
  email: string;
  phone: string;
}

export default function EditContractPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const contractId = params.contractId as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [contractName, setContractName] = useState('');
  const [rejectionComment, setRejectionComment] = useState<string | null>(null);
  const [signers, setSigners] = useState<SignerForm[]>([]);
  const [fields, setFields] = useState<ContractField[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [tcEmail, setTcEmail] = useState('');
  const [clientName, setClientName] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchCurrentUser();
        const { contract, client } = await fetchClientContract(clientId, contractId);

        if (!['rejected', 'pending_signatures'].includes(contract.status)) {
          router.replace(`/clients/${clientId}/contracts`);
          return;
        }

        if (!cancelled) {
          setContractName(contract.contract_templates?.name || '');
          setRejectionComment(contract.rejection_comment || null);
          setTcEmail(contract.transaction_coordinator_email || '');
          setClientName(client?.customer_name || '');

          const sortedSigners = [...(contract.client_contract_signers || [])]
            .sort((a, b) => a.signer_index - b.signer_index)
            .map(s => ({
              id: s.id,
              signer_index: s.signer_index,
              name: s.name,
              email: s.email,
              phone: s.phone || '',
            }));
          setSigners(sortedSigners);

          const contractFields: ContractField[] =
            contract.contract_templates?.contract_fields || [];
          setFields(contractFields.sort((a, b) => a.sort_order - b.sort_order));

          // Pre-fill existing field values
          const existing: Record<string, string> = {};
          contractFields.forEach(f => { existing[f.id] = ''; });
          contract.client_contract_field_values
            ?.filter((v: any) => v.field_type !== 'signature' && v.field_type !== 'initials')
            .forEach((v: any) => {
              existing[v.contract_field_id] = v.value || '';
            });
          setFieldValues(existing);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clientId, contractId, router]);

  const handleSignerChange = (
    index: number,
    field: 'name' | 'email' | 'phone',
    value: string
  ) => {
    setSigners(prev =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const fieldsBySigner = fields.reduce((acc, field) => {
    const idx = field.signer_index;
    if (!acc[idx]) acc[idx] = [];
    acc[idx].push(field);
    return acc;
  }, {} as Record<number, ContractField[]>);

  const handleSave = async () => {
    // Validate signers
    for (const signer of signers) {
      if (!signer.name.trim()) {
        setError(`Signer ${signer.signer_index + 1} name is required`);
        return;
      }
      if (!signer.email.trim()) {
        setError(`Signer ${signer.signer_index + 1} email is required`);
        return;
      }
    }

    // Validate required fields
    for (const field of fields) {
      if (
        field.is_required &&
        field.field_type !== 'signature' &&
        field.field_type !== 'initials' &&
        !fieldValues[field.id]?.trim()
      ) {
        setError(`"${field.label}" is required`);
        return;
      }
    }

    setError('');
    setSubmitting(true);

    try {
      const fieldValuesPayload = fields
        .filter(f => f.field_type !== 'signature' && f.field_type !== 'initials')
        .map(f => {
          const signer = signers.find(s => s.signer_index === f.signer_index) || signers[0];
          return {
            contract_field_id: f.id,
            signer_id: signer?.id,
            field_label: f.label,
            field_type: f.field_type,
            value: fieldValues[f.id] || '',
          };
        });

      await updateClientContract(clientId, contractId, {
        transaction_coordinator_email: tcEmail.trim() || undefined,
        signers: signers.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          phone: s.phone || undefined,
          signer_index: s.signer_index,
        })),
        field_values: fieldValuesPayload,
      });

      router.push(`/clients/${clientId}/contracts?resent=1`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update contract');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Contract</h1>
                <p className="text-xs text-gray-500">{contractName} — {clientName}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/clients/${clientId}/contracts`)}
              className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Rejection Comment Banner */}
        {rejectionComment && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">This contract was rejected</h3>
                <p className="text-sm text-red-700 font-medium">Reason:</p>
                <p className="text-sm text-red-900 mt-1 bg-white border border-red-200 rounded p-3">
                  {rejectionComment}
                </p>
                <p className="text-xs text-red-500 mt-2">
                  Make your changes below and click "Save & Resend" to send new signing links to all signers.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline">Dismiss</button>
          </div>
        )}

        {/* Signers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Signers</h2>
          <div className="space-y-4">
            {signers.map((signer, i) => (
              <div key={signer.id} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-3 text-sm">
                  Signer {i + 1}
                  {i === 0 && <span className="text-xs text-gray-400 ml-1">(primary client)</span>}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input
                      type="text"
                      value={signer.name}
                      onChange={e => handleSignerChange(i, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={signer.email}
                      onChange={e => handleSignerChange(i, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={signer.phone}
                      onChange={e => handleSignerChange(i, 'phone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Fields grouped by signer */}
        {Object.keys(fieldsBySigner).length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contract Fields</h2>
            <p className="text-sm text-gray-500 mb-6">
              Signature and initials fields are captured during signing and cannot be edited here.
            </p>
            <div className="space-y-8">
              {Object.entries(fieldsBySigner)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([signerIdx, signerFields]) => {
                  const signerName =
                    signers[Number(signerIdx)]?.name || `Signer ${Number(signerIdx) + 1}`;
                  return (
                    <div key={signerIdx}>
                      <h3 className="text-sm font-semibold text-[#0284C7] uppercase tracking-wide mb-3 pb-2 border-b border-blue-100">
                        {signerName}'s Fields
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {signerFields.map(field => {
                          if (field.field_type === 'signature' || field.field_type === 'initials') {
                            return (
                              <div key={field.id}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}
                                </label>
                                <div className="px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-400 italic">
                                  {field.field_type === 'signature'
                                    ? '✍️ Signature — captured during signing'
                                    : '✍️ Initials — captured during signing'}
                                </div>
                              </div>
                            );
                          }

                          const base = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm';

                          return (
                            <div
                              key={field.id}
                              className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}
                            >
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                {field.label}
                                {field.is_required && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              {field.field_type === 'checkbox' ? (
                                <input
                                  type="checkbox"
                                  checked={fieldValues[field.id] === 'true'}
                                  onChange={e =>
                                    setFieldValues(prev => ({
                                      ...prev,
                                      [field.id]: e.target.checked ? 'true' : 'false',
                                    }))
                                  }
                                  className="w-5 h-5 text-[#0284C7] border-gray-300 rounded"
                                />
                              ) : field.field_type === 'dropdown' && field.dropdown_options ? (
                                <select
                                  value={fieldValues[field.id] || ''}
                                  onChange={e =>
                                    setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  className={base}
                                >
                                  <option value="">Select...</option>
                                  {field.dropdown_options.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : field.field_type === 'date' ? (
                                <input
                                  type="date"
                                  value={fieldValues[field.id] || ''}
                                  onChange={e =>
                                    setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  className={base}
                                />
                              ) : field.field_type === 'textarea' ? (
                                <textarea
                                  value={fieldValues[field.id] || ''}
                                  onChange={e =>
                                    setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  placeholder={field.placeholder || ''}
                                  rows={3}
                                  className={base}
                                />
                              ) : (
                                <input
                                  type={field.field_type === 'number' ? 'number' : 'text'}
                                  value={fieldValues[field.id] || ''}
                                  onChange={e =>
                                    setFieldValues(prev => ({ ...prev, [field.id]: e.target.value }))
                                  }
                                  placeholder={field.placeholder || ''}
                                  className={base}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TC Email */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Transaction Coordinator</h2>
          <p className="text-sm text-gray-500 mb-3">Optional — will receive a copy of the completed contract</p>
          <input
            type="email"
            value={tcEmail}
            onChange={e => setTcEmail(e.target.value)}
            placeholder="tc@example.com"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900"
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
          <button
            onClick={handleSave}
            disabled={submitting}
            className="py-4 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-semibold text-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {submitting ? 'Saving & Resending...' : 'Save & Resend to All Signers'}
          </button>
          <button
            onClick={() => router.push(`/clients/${clientId}/contracts`)}
            className="py-4 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold text-lg transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
