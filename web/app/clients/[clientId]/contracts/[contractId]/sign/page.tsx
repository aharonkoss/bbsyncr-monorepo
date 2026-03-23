'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchCurrentUser, fetchClientContract, completeClientContract,rejectClientContract, submitPublicSignature, } from '@/lib/api';

interface ContractField {
  id: string;
  field_type: string;
  label: string;
  signer_index: number;
  sort_order: number;
  is_required: boolean;
}

interface Signer {
  id: string;
  name: string;
  email: string;
  signer_index: number;
  signed_at: string | null;
  signing_token: string; 
}

interface FieldValue {
  id: string;
  signer_id: string;
  contract_field_id: string;
  field_type: string;
  field_label: string;
  value: string | null;
  signature_image: string | null;
}

interface Contract {
  id: string;
  status: string;
  signing_mode: string;
  contract_templates: {
    id: string;
    name: string;
    contract_fields: ContractField[];
  } | null;
  client_contract_signers: Signer[];
  client_contract_field_values: FieldValue[];
}

// ─── Signature Canvas ─────────────────────────────────────
function SignatureCanvas({
  label,
  onCapture,
  captured,
}: {
  label: string;
  onCapture: (dataUrl: string) => void;
  captured: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    isDrawing.current = true;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stop = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    onCapture(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onCapture('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className={`border-2 rounded-lg overflow-hidden ${captured ? 'border-green-400' : 'border-gray-300'}`}>
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          onMouseDown={start}
          onMouseMove={draw}
          onMouseUp={stop}
          onMouseLeave={stop}
          onTouchStart={start}
          onTouchMove={draw}
          onTouchEnd={stop}
          className="w-full bg-white cursor-crosshair touch-none"
          style={{ touchAction: 'none' }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <button
          type="button"
          onClick={clear}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Clear
        </button>
        {captured && <span className="text-sm text-green-600 font-medium">✓ Captured</span>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function SignContractPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = params.clientId as string;
  const contractId = params.contractId as string;

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Current signer index being processed
  const [currentSignerIndex, setCurrentSignerIndex] = useState(0);

  // Signatures captured: { [signerIndex_fieldId]: dataUrl }
  const [capturedSignatures, setCapturedSignatures] = useState<Record<string, string>>({});
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');
  const [rejecting, setRejecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        await fetchCurrentUser();
        const { contract: raw } = await fetchClientContract(clientId, contractId);
        if (!cancelled) {
          setContract(raw);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };
    load();
    return () => { cancelled = true; };
  }, [clientId, contractId, router]);

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

  const fields = contract.contract_templates?.contract_fields || [];

  const currentSigner = signers[currentSignerIndex];

  // Get signature/initials fields for current signer
  const signingFieldsForSigner = fields
    .filter(f =>
      f.signer_index === currentSigner?.signer_index &&
      (f.field_type === 'signature' || f.field_type === 'initials')
    )
    .sort((a, b) => a.sort_order - b.sort_order);

  const captureKey = (fieldId: string) => `${currentSignerIndex}_${fieldId}`;

  const allCaptured = signingFieldsForSigner.every(f => {
    const key = captureKey(f.id);
    return capturedSignatures[key] && capturedSignatures[key].length > 0;
  });

  const handleCapture = (fieldId: string, dataUrl: string) => {
    setCapturedSignatures(prev => ({
      ...prev,
      [captureKey(fieldId)]: dataUrl,
    }));
  };

  const handleSignerComplete = async () => {
    if (submitting) return;
    if (!allCaptured && signingFieldsForSigner.length > 0) {
      setError('Please complete all signature fields before proceeding.');
      return;
    }
    setError('');

    const isLastSigner = currentSignerIndex === signers.length - 1;

    if (!isLastSigner) {
      // Move to next signer
      setCurrentSignerIndex(prev => prev + 1);
      return;
    }

    // All signers done — submit and complete
    setSubmitting(true);
    try {
      console.log('📸 capturedSignatures keys:', Object.keys(capturedSignatures));
      console.log('📸 capturedSignatures values preview:', 
        Object.entries(capturedSignatures).map(([k, v]) => ({ 
          key: k, 
          hasValue: !!v, 
          preview: String(v || '').substring(0, 30) 
        }))
      );
      // Build field values from captured signatures
      // We match each captured signature to the signer's ID
      const signatureValues = Object.entries(capturedSignatures)
          .filter(([, dataUrl]) => dataUrl)
          .map(([key, dataUrl]) => {
            const underscoreIndex = key.indexOf('_');
            const signerIdx = key.substring(0, underscoreIndex);
            const fieldId = key.substring(underscoreIndex + 1);  // ✅ rest of string after first _
            const signer = signers[Number(signerIdx)];
           // const field = fields.find(f => f.id === fieldId);
            return {
              contract_field_id: fieldId,
              signer_id: signer?.id,
              signature_image: dataUrl,
            };
          });

      // Submit signature field values via the public sign endpoint
      // using each signer's signing_token
      for (const signer of signers) {
          const signerSignatures = signatureValues.filter(v => v.signer_id === signer.id);
          if (signerSignatures.length === 0) continue;

          await submitPublicSignature(signer.signing_token, { field_values: signerSignatures });
        }

      // Mark contract complete
      await completeClientContract(clientId, contractId);

      router.push(`/clients/${clientId}/contracts/${contractId}/review`);
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'Failed to submit signatures');
    } finally {
      setSubmitting(false);
    }
  };

  const totalSigners = signers.length;
  const progressPct = totalSigners > 1
    ? Math.round((currentSignerIndex / totalSigners) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Sign Contract</h1>
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

          {/* Multi-signer progress bar */}
          {totalSigners > 1 && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Signer {currentSignerIndex + 1} of {totalSigners}</span>
                <span>{progressPct}% complete</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-2 bg-[#0284C7] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex gap-2 mt-2">
                {signers.map((s, i) => (
                  <div
                    key={s.id}
                    className={`flex-1 text-center text-xs py-1 rounded font-medium ${
                      i < currentSignerIndex
                        ? 'bg-green-100 text-green-700'
                        : i === currentSignerIndex
                        ? 'bg-[#0284C7] text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {i < currentSignerIndex ? '✓ ' : ''}{s.name.split(' ')[0]}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
            {error}
          </div>
        )}

        {/* Signer Identity Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-lg font-bold">
              {currentSigner?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{currentSigner?.name}</h2>
              <p className="text-sm text-gray-500">{currentSigner?.email}</p>
              {totalSigners > 1 && (
                <p className="text-xs text-[#0284C7] font-medium mt-0.5">
                  Signer {currentSignerIndex + 1} of {totalSigners}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Pre-filled Field Values Summary */}
        {contract.client_contract_field_values?.filter(v =>
          v.signer_id === currentSigner?.id && v.field_type !== 'signature' && v.field_type !== 'initials'
        ).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-blue-800 mb-3">Pre-filled Contract Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {contract.client_contract_field_values
                .filter(v =>
                  v.signer_id === currentSigner?.id &&
                  v.field_type !== 'signature' &&
                  v.field_type !== 'initials'
                )
                .map(v => (
                  <div key={v.id} className="text-sm">
                    <span className="text-blue-600 font-medium">{v.field_label}:</span>{' '}
                    <span className="text-blue-900">{v.value || '—'}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Signature / Initials Fields */}
        {signingFieldsForSigner.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {currentSigner?.name}, please sign below
              </h3>
              <p className="text-sm text-gray-500">
                Use your finger or stylus to sign in each field below.
              </p>
            </div>

            {signingFieldsForSigner.map(field => (
              <SignatureCanvas
                key={field.id}
                label={field.label}
                captured={!!(capturedSignatures[captureKey(field.id)])}
                onCapture={dataUrl => handleCapture(field.id, dataUrl)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-6 mb-6 text-center text-gray-500">
            <p>No signature fields required for this signer.</p>
          </div>
        )}

        {/* Acknowledgement */}
        {!showRejectForm && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800">
            <strong>By clicking "I Agree", {currentSigner?.name} acknowledges</strong> that they
            have reviewed all contract details and agree to the terms of the{' '}
            <strong>{contract.contract_templates?.name}</strong>.
            </p>
        </div>
        )}

        {/* Rejection Form */}
        {showRejectForm && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-red-800 mb-2">
            Reason for Rejection *
            </h3>
            <textarea
            value={rejectionComment}
            onChange={e => setRejectionComment(e.target.value)}
            placeholder="Please explain why you are rejecting this contract..."
            rows={4}
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <div className="flex gap-3 mt-3">
            <button
                onClick={async () => {
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
                } finally {
                    setRejecting(false);
                }
                }}
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
        {!showRejectForm && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
            onClick={handleSignerComplete}
            disabled={submitting || (!allCaptured && signingFieldsForSigner.length > 0)}
            className="py-4 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {submitting
                ? 'Submitting...'
                : currentSignerIndex < signers.length - 1
                ? `I Agree — Next Signer →`
                : 'I Agree — Complete Signing'
            }
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

        <p className="text-xs text-center text-gray-400 mt-3">
        IP address and timestamp are recorded for audit purposes.
        </p>
      </div>
    </div>
  );
}
