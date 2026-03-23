'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import {
  fetchCurrentUser,
  fetchClientContract,
  completeClientContract,
  rejectClientContract,
  downloadContractPDF,
} from '@/lib/api';

interface Signer {
  id: string;
  name: string;
  email: string;
  signer_index: number;
  signed_at: string | null;
}

interface FieldValue {
  id: string;
  signer_id: string;
  field_id: string;
  value: string | null;
}

interface Contract {
  id: string;
  status: string;
  signing_mode: string;
  transaction_coordinator_email: string | null;
  completed_at: string | null;
  created_at: string;
  contract_templates: {
    id: string;
    name: string;
    contract_fields: {
      id: string;
      field_type: string;
      label: string;
      signer_index: number;
      sort_order: number;
    }[];
  } | null;
  client_contract_signers: Signer[];
  contract_field_values: FieldValue[];   // ← was client_contract_field_values
}


interface ClientInfo {
  id: string;
  customer_name: string;
  email: string;
}

export default function ReviewContractPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const contractId = params.contractId as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchCurrentUser();
        const { contract: raw, client: clientData } = await fetchClientContract(clientId, contractId);
        if (!cancelled) {
          setContract(raw);
          setClient(clientData);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clientId, contractId, router]);

  const handleComplete = async () => {
    if (!confirm('Mark this contract as completed and notify all parties?')) return;
    setCompleting(true);
    setError('');
    try {
      await completeClientContract(clientId, contractId);
      router.push(`/clients/${clientId}/contracts?completed=1`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to complete contract');
      setCompleting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionComment.trim()) {
      setError('Please enter a reason for rejection.');
      return;
    }
    setRejecting(true);
    setError('');
    try {
      await rejectClientContract(clientId, contractId, rejectionComment.trim());
      router.push(`/clients/${clientId}/contracts?rejected=1`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to reject contract');
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7]" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">Contract not found.</p>
      </div>
    );
  }

  const signers = [...(contract.client_contract_signers || [])]
    .sort((a, b) => a.signer_index - b.signer_index);

  const allSigned = signers.every(s => !!s.signed_at);
  const isCompleted = contract.status === 'completed';
  const isRejected = contract.status === 'rejected';
  const canComplete = allSigned && !isCompleted && !isRejected;

  // Group field values by signer
const valuesBySigner = signers.reduce((acc, signer) => {
  acc[signer.id] = (contract.contract_field_values || []).filter(
    v => v.signer_id === signer.id
  );
  return acc;
}, {} as Record<string, FieldValue[]>);

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Contract Review</h1>
                <p className="text-xs text-gray-500">{contract.contract_templates?.name}</p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/clients/${clientId}/contracts`)}
              className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors"
              title="Back to contracts"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline text-red-700">Dismiss</button>
          </div>
        )}

        {/* Status Banner */}
        {isCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold text-green-800">Contract Completed</p>
              {contract.completed_at && (
                <p className="text-sm text-green-600">
                  Completed on {new Date(contract.completed_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        )}
         {/* Download PDF Button - Show when all signed */}
        {allSigned && (
          <button
            onClick={async () => {
                                try {
                                await downloadContractPDF(
                                    clientId,
                                    contractId,
                                    contract.contract_templates?.name
                                  );
                                } catch (err) {
                                  setError('Failed to download PDF');
                                }
                   }}
            className="w-full py-3 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Signed Contract PDF
          </button>
        )}


        {isRejected && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-red-800">Contract Rejected</p>
          </div>
        )}

        {/* Contract Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contract Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Contract:</span>{' '}
              <span className="font-medium text-gray-900">{contract.contract_templates?.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Client:</span>{' '}
              <span className="font-medium text-gray-900">{client?.customer_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Signing Mode:</span>{' '}
              <span className="font-medium text-gray-900 capitalize">
                {contract.signing_mode === 'remote' ? '📧 Remote' : '📱 In-Person'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Created:</span>{' '}
              <span className="font-medium text-gray-900">
                {new Date(contract.created_at).toLocaleDateString()}
              </span>
            </div>
            {contract.transaction_coordinator_email && (
              <div className="sm:col-span-2">
                <span className="text-gray-500">Transaction Coordinator:</span>{' '}
                <span className="font-medium text-gray-900">{contract.transaction_coordinator_email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Signing Status per Signer */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Signing Status</h2>
          <div className="space-y-3">
            {signers.map(signer => (
              <div
                key={signer.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  signer.signed_at
                    ? 'bg-green-50 border-green-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    signer.signed_at ? 'bg-green-500 text-white' : 'bg-yellow-400 text-white'
                  }`}>
                    {signer.signed_at ? '✓' : signer.signer_index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{signer.name}</p>
                    <p className="text-xs text-gray-500">{signer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  {signer.signed_at ? (
                    <div>
                      <p className="text-xs font-medium text-green-700">Signed</p>
                      <p className="text-xs text-green-600">
                        {new Date(signer.signed_at).toLocaleDateString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs font-medium text-yellow-700">Awaiting signature</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Field Values per Signer */}
        {signers.map(signer => {
          const values = valuesBySigner[signer.id] || [];
          if (values.length === 0) return null;

      const signatureValues = values.filter(v => v.value?.startsWith('data:image'));
      const textValues = values.filter(v => !v.value?.startsWith('data:image'));

          return (
            <div key={signer.id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {signer.name}'s Contract Details
              </h2>

              {/* Text field values */}
              {textValues.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {textValues.map(v => (
                      <div key={v.id} className="text-sm">
                        <span className="text-gray-500 font-medium">
                          {contract.contract_templates?.contract_fields?.find(f => f.id === v.field_id)?.label || 'Field'}:
                        </span>{' '}
                        <span className="text-gray-900">{v.value || '—'}</span>
                      </div>
                    ))}
                </div>
              )}

              {/* Signatures and initials */}
              {signatureValues.length > 0 && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700">Signatures & Initials</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Signature values */}
                    {signatureValues.map(v => (
                      <div key={v.id}>
                        <p className="text-xs text-gray-500 mb-1">
                          {contract.contract_templates?.contract_fields?.find(f => f.id === v.field_id)?.label || 'Signature'}
                        </p>
                        {v.value ? (
                          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                            <img src={v.value} alt="Signature" className="max-h-20 w-auto" />
                          </div>
                        ) : (
                          <div className="border border-dashed border-gray-300 rounded-lg p-3 text-xs text-gray-400 italic">
                            Not yet signed
                          </div>
                        )}
                      </div>
                    ))}

                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Reject Form */}
        {showRejectForm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-3">Reject Contract</h3>
            <p className="text-sm text-red-700 mb-3">
              Please provide a reason. The agent will be notified by email.
            </p>
            <textarea
              value={rejectionComment}
              onChange={e => setRejectionComment(e.target.value)}
              placeholder="Explain why you are rejecting this contract..."
              rows={4}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={rejecting || !rejectionComment.trim()}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {rejecting ? 'Submitting...' : 'Submit Rejection'}
              </button>
              <button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectionComment('');
                  setError('');
                }}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canComplete && !showRejectForm && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-lg disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {completing ? 'Completing...' : 'Approve & Complete'}
            </button>
            <button
              onClick={() => {
                setShowRejectForm(true);
                setError('');
              }}
              className="py-4 bg-white border-2 border-red-400 text-red-600 rounded-lg hover:bg-red-50 font-semibold text-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject Contract
            </button>
          </div>
        )}

        {/* Awaiting signatures notice */}
        {!allSigned && !isCompleted && !isRejected && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 text-center pb-8">
            <p className="font-medium">Awaiting signatures from all parties</p>
            <p className="text-xs mt-1 text-yellow-600">
              You can approve or reject once all signers have completed signing.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
