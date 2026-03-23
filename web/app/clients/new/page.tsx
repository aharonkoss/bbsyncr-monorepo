'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  fetchCurrentUser,
  fetchClients,
  createClient,
  fetchCompanyTemplates,
  createClientContract,
  submitClientContract,
  ContractTemplate,
  ContractField,
  CurrentUser,
} from '@/lib/api';

interface ClientResult {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  address: string | null;
}

interface SignerForm {
  signer_index: number;
  name: string;
  email: string;
  phone: string;
}

const STEP_LABELS = ['Find Client', 'Contract & Sign'];

function resolveAutoFill(
  field_source: string | null,
  agent: CurrentUser | null,
  client: ClientResult | null
): string {
  switch (field_source) {
    case 'agent_name':     return agent?.realtor_name || '';
    case 'agent_phone':    return agent?.realtor_phone || '';
    case 'agent_email':    return agent?.email || '';
    case 'client_name':    return client?.customer_name || '';
    case 'client_email':   return client?.email || '';
    case 'client_phone':   return client?.phone || '';
    case 'client_address': return client?.address || '';
    default:               return '';
  }
}

function FieldInput({
  field, value, onChange,
}: {
  field: ContractField; value: string; onChange: (val: string) => void;
}) {
  const base = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm';

  if (field.field_type === 'signature' || field.field_type === 'initials') {
    return (
      <div className="px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-400 italic">
        {field.field_type === 'signature' ? '✍️ Signature — captured during signing' : '✍️ Initials — captured during signing'}
      </div>
    );
  }
  if (field.field_type === 'checkbox') {
    return <input type="checkbox" checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : 'false')} className="w-5 h-5 text-[#0284C7] border-gray-300 rounded" />;
  }
  if (field.field_type === 'dropdown' && field.dropdown_options) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">Select...</option>
        {field.dropdown_options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    );
  }
  if (field.field_type === 'date') return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={base} />;
  if (field.field_type === 'textarea') return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} rows={3} className={base} />;
  return <input type={field.field_type === 'number' ? 'number' : 'text'} value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ''} className={base} />;
}

export default function NewContractPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClientResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientResult | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ customer_name: '', email: '', phone: '', address: '' });
  const [newClientError, setNewClientError] = useState('');
  const [allClients, setAllClients] = useState<ClientResult[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate | null>(null);
  const [signers, setSigners] = useState<SignerForm[]>([{ signer_index: 0, name: '', email: '', phone: '' }]);
  const [tcEmail, setTcEmail] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [user, clientsRes, templatesRes] = await Promise.all([
          fetchCurrentUser(),
          fetchClients(),
          fetchCompanyTemplates(),
        ]);
        if (!cancelled) {
          setCurrentUser(user);
          setAllClients(clientsRes.clients || []);
          setTemplates(templatesRes.templates || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };
    init();
    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) { setSearchResults([]); return; }
    setSearchResults(allClients.filter(c =>
      c.customer_name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    ));
  }, [searchQuery, allClients]);

  // Rebuild field values when template changes
  useEffect(() => {
    if (!selectedTemplateId) { setSelectedTemplate(null); setFieldValues({}); return; }
    const tmpl = templates.find(t => t.id === selectedTemplateId) || null;
    setSelectedTemplate(tmpl);
    const initial: Record<string, string> = {};
    tmpl?.contract_fields.forEach(f => {
      if (f.field_type === 'signature' || f.field_type === 'initials') return;
      initial[f.id] = resolveAutoFill(f.field_source, currentUser, selectedClient);
    });
    setFieldValues(initial);
  }, [selectedTemplateId, templates, currentUser, selectedClient]);

  // Re-apply auto-fill when client changes without wiping manual entries
  useEffect(() => {
    if (!selectedTemplate || !selectedClient) return;
    setFieldValues(prev => {
      const updated = { ...prev };
      selectedTemplate.contract_fields.forEach(f => {
        if (!f.field_source || f.field_source === 'manual') return;
        if (f.field_type === 'signature' || f.field_type === 'initials') return;
        updated[f.id] = resolveAutoFill(f.field_source, currentUser, selectedClient);
      });
      return updated;
    });
    setSigners(prev => prev.map(s =>
      s.signer_index === 0
        ? { ...s, name: selectedClient.customer_name, email: selectedClient.email, phone: selectedClient.phone || '' }
        : s
    ));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClient]);

  const handleSelectClient = (client: ClientResult) => {
    setSelectedClient(client); setSearchQuery(''); setSearchResults([]); setShowNewClientForm(false); setError('');
  };

  const handleCreateNewClient = async () => {
    setNewClientError('');
    const { customer_name, email, phone, address } = newClientForm;
    if (!customer_name.trim()) { setNewClientError('Name is required'); return; }
    if (!email.trim()) { setNewClientError('Email is required'); return; }
    try {
      setSubmitting(true);
      const result = await createClient({ customerName: customer_name, email, phone, address });
      const created: ClientResult = result.client || result;
      setAllClients(prev => [created, ...prev]);
      setSelectedClient(created);
      setShowNewClientForm(false);
      setNewClientForm({ customer_name: '', email: '', phone: '', address: '' });
    } catch (err: any) {
      setNewClientError(err?.response?.data?.error || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignerChange = (index: number, field: keyof SignerForm, value: string) => {
    setSigners(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const validateStep2 = (): string | null => {
    if (!selectedTemplateId) return 'Please select a contract';
    for (const signer of signers) {
      if (!signer.name.trim()) return `Signer ${signer.signer_index + 1} name is required`;
      if (!signer.email.trim()) return `Signer ${signer.signer_index + 1} email is required`;
    }
    if (selectedTemplate) {
      for (const field of selectedTemplate.contract_fields) {
        if (field.is_required && field.field_type !== 'signature' && field.field_type !== 'initials' && !fieldValues[field.id]?.trim()) {
          return `"${field.label}" is required`;
        }
      }
    }
    return null;
  };

  const buildPayloadAndSubmit = async (signingMode: 'in_person' | 'remote') => {
    const validationError = validateStep2();
    if (validationError) { setError(validationError); return; }
    if (!selectedClient) { setError('No client selected'); return; }
    setSubmitting(true); setError('');
    try {
      const contractRes = await createClientContract(selectedClient.id, {
        template_id: selectedTemplateId,
        signing_mode: signingMode,
        transaction_coordinator_email: tcEmail.trim() || undefined,
        signers: signers.map(s => ({ name: s.name, email: s.email, phone: s.phone || undefined, signer_index: s.signer_index })),
        field_values: [],
      });

      const contractId = contractRes.contract.id;
      const insertedSigners: { id: string; signer_index: number }[] = contractRes.signers;

      const fieldValuesPayload = selectedTemplate?.contract_fields
        .filter(f => f.field_type !== 'signature' && f.field_type !== 'initials')
        .map(f => {
          const signer = insertedSigners.find(s => s.signer_index === f.signer_index) || insertedSigners[0];
          return { contract_field_id: f.id, signer_id: signer?.id, field_label: f.label, field_type: f.field_type, value: fieldValues[f.id] || '' };
        }) || [];

      await submitClientContract(selectedClient.id, contractId, { field_values: fieldValuesPayload });

      if (signingMode === 'in_person') {
        router.push(`/clients/${selectedClient.id}/contracts/${contractId}/sign`);
      } else {
        router.push(`/clients/${selectedClient.id}/contracts`);
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create contract');
    } finally {
      setSubmitting(false);
    }
  };

  const autoFilledFields = selectedTemplate?.contract_fields.filter(
    f => f.field_source && f.field_source !== 'manual' && f.field_type !== 'signature' && f.field_type !== 'initials'
  ) || [];

  const manualFields = selectedTemplate?.contract_fields.filter(
    f => (!f.field_source || f.field_source === 'manual') && f.field_type !== 'signature' && f.field_type !== 'initials'
  ) || [];

  const groupBySigner = (fields: ContractField[]) =>
    fields.reduce((acc, f) => { (acc[f.signer_index] ??= []).push(f); return acc; }, {} as Record<number, ContractField[]>);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7]" /></div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">New Contract</h1>
                <p className="text-xs text-gray-500">Step {step} of {STEP_LABELS.length}: {STEP_LABELS[step - 1]}</p>
              </div>
            </div>
            <button onClick={() => step === 1 ? router.push('/clients') : setStep(1)} className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-[#0284C7] text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`ml-2 text-sm hidden sm:inline ${step === i + 1 ? 'text-[#0284C7] font-medium' : 'text-gray-400'}`}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className={`flex-1 h-1 mx-3 rounded ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{error}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-6">
            {selectedClient && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-green-800">✓ Selected: {selectedClient.customer_name}</p>
                  <p className="text-sm text-green-600">{selectedClient.email}</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-sm text-green-700 underline">Change</button>
              </div>
            )}
            {!selectedClient && (
              <>
                    <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Existing Client</h2>

              {/* Search input with icon */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900"
                />
              </div>

              {/* Prompt shown when search box is empty */}
              {!searchQuery && (
                <div className="mt-4 py-6 px-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center">
                  <svg className="w-8 h-8 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500">Type a client name or email to search</p>
                  <p className="text-xs text-gray-400 mt-1">Or add a new client below</p>
                </div>
              )}

              {/* Search results */}
              {searchResults.length > 0 && (
                <div className="mt-3 border border-gray-200 rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map(client => (
                    <div key={client.id} className="flex justify-between items-center p-3 hover:bg-gray-50">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{client.customer_name}</p>
                        <p className="text-xs text-gray-500">{client.email}</p>
                      </div>
                      <button onClick={() => handleSelectClient(client)} className="px-3 py-1.5 bg-[#0284C7] text-white text-sm rounded-lg hover:bg-[#0369A1]">Select</button>
                    </div>
                  ))}
                </div>
              )}

              {/* No results found */}
              {searchQuery && searchResults.length === 0 && (
                <p className="mt-3 text-sm text-gray-500 text-center py-3">No clients found for "<strong>{searchQuery}</strong>"</p>
              )}
            </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Add New Client</h2>
              <button
                onClick={() => setShowNewClientForm(v => !v)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  showNewClientForm
                    ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                }`}
              >
                {showNewClientForm ? (
                  'Cancel'
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Client
                  </>
                )}
              </button>
            </div>

                  {showNewClientForm && (
                    <div className="space-y-4">
                      {newClientError && <div className="bg-red-50 border border-red-200 text-red-800 rounded p-3 text-sm">{newClientError}</div>}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{ label: 'Full Name *', key: 'customer_name', type: 'text' }, { label: 'Email *', key: 'email', type: 'email' }, { label: 'Phone', key: 'phone', type: 'tel' }, { label: 'Address', key: 'address', type: 'text' }].map(({ label, key, type }) => (
                          <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                            <input type={type} value={newClientForm[key as keyof typeof newClientForm]} onChange={e => setNewClientForm(p => ({ ...p, [key]: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900" />
                          </div>
                        ))}
                      </div>
                      <button onClick={handleCreateNewClient} disabled={submitting} className="w-full py-3 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-medium disabled:opacity-50">{submitting ? 'Creating...' : 'Create & Select Client'}</button>
                    </div>
                  )}
                </div>
              </>
            )}
            <button onClick={() => { if (!selectedClient) { setError('Please select or create a client first'); return; } setError(''); setStep(2); }} disabled={!selectedClient} className="w-full py-4 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Continue to Contract →
            </button>
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-800">Client: <span className="font-semibold">{selectedClient?.customer_name}</span> <span className="text-blue-600 ml-2">({selectedClient?.email})</span></p>
            </div>

            {/* Template select */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Contract</h2>
              {templates.length === 0 ? (
                <p className="text-gray-500 text-sm">No contracts found. Ask your broker to add contracts in the BBSynr portal.</p>
              ) : (
                <select value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900">
                  <option value="">Choose a contract...</option>
                  {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              )}
            </div>

            {/* Signers */}
            {selectedTemplate && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Signers</h2>
                  <button onClick={() => setSigners(prev => [...prev, { signer_index: prev.length, name: '', email: '', phone: '' }])} className="flex items-center gap-1 px-3 py-1.5 bg-[#0284C7] text-white text-sm rounded-lg hover:bg-[#0369A1]">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> Add Signer
                  </button>
                </div>
                <div className="space-y-4">
                  {signers.map((signer, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-700">Signer {i + 1} {i === 0 && <span className="text-xs text-gray-400 ml-1">(pre-filled from client)</span>}</h3>
                        {signers.length > 1 && <button onClick={() => setSigners(prev => prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, signer_index: idx })))} className="text-red-500 hover:text-red-700 text-sm">Remove</button>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {(['name', 'email', 'phone'] as const).map(field => (
                          <div key={field}>
                            <label className="block text-xs font-medium text-gray-600 mb-1 capitalize">{field}{field !== 'phone' ? ' *' : ''}</label>
                            <input type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'} value={signer[field]} onChange={e => handleSignerChange(i, field, e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Auto-filled fields */}
            {selectedTemplate && autoFilledFields.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-semibold text-gray-900">Auto-filled Fields</h2>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Pre-populated</span>
                </div>
                <p className="text-sm text-gray-500 mb-5">Filled from your profile and client. You can edit any value.</p>
                <div className="space-y-6">
                  {Object.entries(groupBySigner(autoFilledFields)).sort(([a], [b]) => Number(a) - Number(b)).map(([idx, fields]) => (
                    <div key={idx}>
                      <h3 className="text-xs font-semibold text-[#0284C7] uppercase tracking-wide mb-3 pb-1 border-b border-blue-100">{signers[Number(idx)]?.name || `Signer ${Number(idx) + 1}`}'s Auto-filled Fields</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(field => (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label} <span className="text-xs text-blue-500 font-normal">auto</span></label>
                            <FieldInput field={field} value={fieldValues[field.id] || ''} onChange={val => setFieldValues(prev => ({ ...prev, [field.id]: val }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual fields */}
            {selectedTemplate && manualFields.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Contract Details</h2>
                <p className="text-sm text-gray-500 mb-5">Fill in the contract-specific fields. Signatures captured during signing.</p>
                <div className="space-y-6">
                  {Object.entries(groupBySigner(manualFields)).sort(([a], [b]) => Number(a) - Number(b)).map(([idx, fields]) => (
                    <div key={idx}>
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 pb-1 border-b border-gray-100">{signers[Number(idx)]?.name || `Signer ${Number(idx) + 1}`}'s Fields</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(field => (
                          <div key={field.id} className={field.field_type === 'textarea' ? 'md:col-span-2' : ''}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.is_required && <span className="text-red-500 ml-1">*</span>}</label>
                            <FieldInput field={field} value={fieldValues[field.id] || ''} onChange={val => setFieldValues(prev => ({ ...prev, [field.id]: val }))} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TC email */}
            {selectedTemplate && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Transaction Coordinator</h2>
                <p className="text-sm text-gray-500 mb-3">Optional — will receive a copy of the completed contract</p>
                <input type="email" value={tcEmail} onChange={e => setTcEmail(e.target.value)} placeholder="tc@example.com" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900" />
              </div>
            )}

                        {/* Submit buttons */}
            {selectedTemplate && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => buildPayloadAndSubmit('in_person')}
                  disabled={submitting}
                  className="py-4 px-6 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  {submitting ? 'Creating...' : 'Sign on Device'}
                </button>
                <button
                  onClick={() => buildPayloadAndSubmit('remote')}
                  disabled={submitting}
                  className="py-4 px-6 bg-white border-2 border-[#0284C7] text-[#0284C7] rounded-lg hover:bg-blue-50 font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {submitting ? 'Sending...' : 'Sign by Email'}
                </button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}


