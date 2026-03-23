'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  fetchCurrentUser,
  fetchClientContracts,
  deleteClientContract,
  resendClientContract,
} from '@/lib/api';

interface Signer {
  id: string;
  name: string;
  email: string;
  signer_index: number;
  signed_at: string | null;
}

interface Contract {
  id: string;
  status: string;
  signing_mode: string;
  transaction_coordinator_email: string | null;
  completed_at: string | null;
  created_at: string;
  contract_templates: { name: string } | null;
  client_contract_signers: Signer[];
}

interface ClientInfo {
  id: string;
  customer_name: string;
  email: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  pending_signatures: 'bg-yellow-100 text-yellow-700',
  pending_review: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_signatures: 'Awaiting Signatures',
  pending_review: 'Pending Review',
  completed: 'Completed',
  rejected: 'Rejected',
};

export default function ClientContractsPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const searchParams = useSearchParams();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  // ── showFeedback defined first so useEffect can use it ──
  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 3500);
  };

  useEffect(() => {
    if (searchParams.get('rejected') === '1') {
      showFeedback('Contract rejected. The agent has been notified.');
    }
    if (searchParams.get('resent') === '1') {
      showFeedback('Contract updated and resent to all signers.');
    }
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchCurrentUser();
        const { contracts: raw, client: clientData } = await fetchClientContracts(clientId);
        if (!cancelled) {
          setContracts(raw || []);
          setClient(clientData || null);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clientId, router]);

  const handleDelete = async (contractId: string, contractName: string) => {
    if (!confirm(`Delete "${contractName}"? This cannot be undone.`)) return;
    setDeletingId(contractId);
    try {
      await deleteClientContract(clientId, contractId);
      setContracts(prev => prev.filter(c => c.id !== contractId));
      showFeedback('Contract deleted.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to delete contract');
    } finally {
      setDeletingId(null);
    }
  };

  const handleResend = async (contractId: string) => {
    setResendingId(contractId);
    try {
      const result = await resendClientContract(clientId, contractId);
      showFeedback(result.message || 'Signing emails resent.');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to resend contract');
    } finally {
      setResendingId(null);
    }
  };

  const getSigningProgress = (signers: Signer[]) => {
    if (!signers || signers.length === 0) return null;
    const signed = signers.filter(s => !!s.signed_at).length;
    return `${signed}/${signers.length} signed`;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {client?.customer_name || 'Client'} — Contracts
                </h1>
                <p className="text-xs text-gray-500">{client?.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/clients/new')}
                title="Add new contract"
                className="p-3 rounded-full bg-[#0284C7] text-white hover:bg-[#0369A1] transition-colors hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => router.push('/clients')}
                title="Back to clients"
                className="p-3 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors hover:shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium">
          {feedback}
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline text-red-700">Dismiss</button>
          </div>
        )}

        {contracts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No contracts yet</h3>
            <p className="text-gray-500 mb-6">Add a contract for {client?.customer_name}</p>
            <button
              onClick={() => router.push('/clients/new')}
              className="px-6 py-3 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-medium"
            >
              Add First Contract
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map(contract => {
              const contractName = contract.contract_templates?.name || 'Unnamed Contract';
              const progress = getSigningProgress(contract.client_contract_signers);
              const isRemote = contract.signing_mode === 'remote';
              const canResend = isRemote && contract.status === 'pending_signatures';
              const canResendCompleted = contract.status === 'completed';

              const canSign = contract.status === 'pending_signatures' && !isRemote;
              const canReview = contract.status === 'pending_review';

              return (
                <div key={contract.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{contractName}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[contract.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[contract.status] ?? contract.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {isRemote ? '📧 Remote' : '📱 In-Person'}
                        </span>
                        {progress && <span className="text-xs text-gray-500">{progress}</span>}
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {new Date(contract.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Signers */}
                  {contract.client_contract_signers?.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Signers</p>
                      <div className="flex flex-wrap gap-2">
                        {contract.client_contract_signers
                          .sort((a, b) => a.signer_index - b.signer_index)
                          .map(signer => (
                            <div key={signer.id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-gray-50 border-gray-200 text-gray-700">
                              {signer.signed_at
                                ? <span className="text-green-500">✓</span>
                                : <span className="text-gray-300">○</span>
                              }
                              {signer.name}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* TC */}
                  {contract.transaction_coordinator_email && (
                    <p className="text-xs text-gray-500 mb-4">
                      <strong>TC:</strong> {contract.transaction_coordinator_email}
                    </p>
                  )}

                  {/* Completed date */}
                  {contract.completed_at && (
                    <p className="text-xs text-green-600 mb-4">
                      ✓ Completed: {new Date(contract.completed_at).toLocaleDateString()}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                    {contract.status === 'completed' && (
                      <button
                        onClick={() => router.push(`/clients/${clientId}/contracts/${contract.id}/review`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Contract
                      </button>
                    )}

                    {canResendCompleted && (
                      <button
                        onClick={() => handleResend(contract.id)}
                        disabled={resendingId === contract.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#0284C7] text-[#0284C7] rounded-lg hover:bg-blue-50 text-sm font-medium disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {resendingId === contract.id ? 'Sending...' : 'Resend to Signers'}
                      </button>
                    )}

                    {canSign && (
                      <button
                        onClick={() => router.push(`/clients/${clientId}/contracts/${contract.id}/sign`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        Sign Now
                      </button>
                    )}

                    {canReview && (
                      <button
                        onClick={() => router.push(`/clients/${clientId}/contracts/${contract.id}/review`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Review & Complete
                      </button>
                    )}

                    {canResend && (
                      <button
                        onClick={() => handleResend(contract.id)}
                        disabled={resendingId === contract.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#0284C7] text-[#0284C7] rounded-lg hover:bg-blue-50 text-sm font-medium disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {resendingId === contract.id ? 'Resending...' : 'Resend Email'}
                      </button>
                    )}

                    {['rejected', 'pending_signatures'].includes(contract.status) && (
                      <button
                        onClick={() => router.push(`/clients/${clientId}/contracts/${contract.id}/edit`)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    )}

                    {contract.status !== 'completed' && (
                      <button
                        onClick={() => handleDelete(contract.id, contractName)}
                        disabled={deletingId === contract.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm font-medium disabled:opacity-50 ml-auto"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        {deletingId === contract.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
