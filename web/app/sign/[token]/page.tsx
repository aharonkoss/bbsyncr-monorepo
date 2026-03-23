'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { fetchPublicContract, submitPublicSignature } from '@/lib/api';

interface ContractField {
  id: string;
  field_type: string;
  label: string;
  placeholder: string | null;
  is_required: boolean;
  signer_index: number;
  sort_order: number;
  dropdown_options: string[] | null;
}

interface Contract {
  id: string;
  status: string;
  contract_templates: {
    id: string;
    name: string;
    contract_fields: ContractField[];
  } | null;
}

interface SignerInfo {
  id: string;
  name: string;
  signer_index: number;
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
    canvas.getContext('2d')!.clearRect(0, 0, canvas.width, canvas.height);
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
        <button type="button" onClick={clear} className="text-sm text-gray-500 hover:text-gray-700 underline">
          Clear
        </button>
        {captured && <span className="text-sm text-green-600 font-medium">✓ Captured</span>}
      </div>
    </div>
  );
}

// ─── Field Input ──────────────────────────────────────────
function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ContractField;
  value: string;
  onChange: (val: string) => void;
}) {
  const base = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-sm bg-gray-50';

  if (field.field_type === 'checkbox') {
    return (
      <input
        type="checkbox"
        checked={value === 'true'}
        onChange={e => onChange(e.target.checked ? 'true' : 'false')}
        className="w-5 h-5 text-[#0284C7] border-gray-300 rounded"
      />
    );
  }

  if (field.field_type === 'dropdown' && field.dropdown_options) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} className={base}>
        <option value="">Select...</option>
        {field.dropdown_options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    );
  }

  if (field.field_type === 'date') {
    return <input type="date" value={value} onChange={e => onChange(e.target.value)} className={base} />;
  }

  if (field.field_type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        rows={3}
        className={base}
      />
    );
  }

  return (
    <input
      type={field.field_type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder || ''}
      className={base}
    />
  );
}

// ─── Main Page ────────────────────────────────────────────
export default function PublicSignPage() {
  const params = useParams();
  const token = params.token as string;

  const [signer, setSigner] = useState<SignerInfo | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadySigned, setAlreadySigned] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);
  const [error, setError] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionComment, setRejectionComment] = useState('');

  // Field values for pre-filled fields the signer can review
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  // Captured signatures: { [fieldId]: dataUrl }
  const [capturedSignatures, setCapturedSignatures] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchPublicContract(token);
        setSigner(data.signer);
        setContract(data.contract);
        setPdfUrl(data.pdf_url || null);

        // Pre-populate field values from existing values if any
        const initial: Record<string, string> = {};
        data.contract?.contract_templates?.contract_fields?.forEach((f: ContractField) => {
          initial[f.id] = '';
        });
        setFieldValues(initial);
        setLoading(false);
      } catch (err: any) {
        const msg = err?.response?.data?.error || '';
        if (msg.includes('already been signed')) {
          setAlreadySigned(true);
        } else {
          setInvalidLink(true);
        }
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const fields = contract?.contract_templates?.contract_fields || [];

  // Fields for this signer only
  const signerFields = fields
    .filter(f => f.signer_index === signer?.signer_index)
    .sort((a, b) => a.sort_order - b.sort_order);

  const signatureFields = signerFields.filter(
    f => f.field_type === 'signature' || f.field_type === 'initials'
  );

  const allSignaturesCaptured = signatureFields.every(
    f => capturedSignatures[f.id] && capturedSignatures[f.id].length > 0
  );

  const validateFields = (): string | null => {
    for (const field of signerFields) {
      if (
        field.is_required &&
        field.field_type !== 'signature' &&
        field.field_type !== 'initials' &&
        !fieldValues[field.id]?.trim()
      ) {
        return `"${field.label}" is required`;
      }
    }
    if (!allSignaturesCaptured && signatureFields.length > 0) {
      return 'Please complete all signature fields';
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const fieldValuePayload = [
        // Text/date/checkbox fields
        ...signerFields
          .filter(f => f.field_type !== 'signature' && f.field_type !== 'initials')
          .map(f => ({
            contract_field_id: f.id,
            field_label: f.label,
            field_type: f.field_type,
            value: fieldValues[f.id] || '',
            signature_image: null,
          })),
        // Signature/initials fields
        ...signatureFields.map(f => ({
          contract_field_id: f.id,
          field_label: f.label,
          field_type: f.field_type,
          value: null,
          signature_image: capturedSignatures[f.id] || null,
        })),
      ];

      await submitPublicSignature(token, { field_values: fieldValuePayload });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to submit signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

const handleReject = async () => {
    if (!rejectionComment.trim()) {
        setError('Please enter a reason for rejection.');
        return;
    }
    setError('');
    setSubmitting(true);
    try {
        await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/sign/${token}/reject`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rejection_comment: rejectionComment.trim() }),
        }
        );
        setSubmitted(true);
    } catch {
        setError('Failed to submit rejection. Please try again.');
    } finally {
        setSubmitting(false);
    }
    };


  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7] mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">Loading your document...</p>
        </div>
      </div>
    );
  }

  // ── Already Signed ────────────────────────────────────────
  if (alreadySigned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Already Signed</h2>
          <p className="text-gray-500 text-sm">
            You have already signed this document. No further action is needed.
          </p>
        </div>
      </div>
    );
  }

  // ── Invalid Link ──────────────────────────────────────────
  if (invalidLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid or Expired Link</h2>
          <p className="text-gray-500 text-sm">
            This signing link is invalid or has expired. Please contact your agent for a new link.
          </p>
        </div>
      </div>
    );
  }

  // ── Success Screen ────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          {showRejectForm ? (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Rejection Submitted</h2>
              <p className="text-gray-500 text-sm">
                Your rejection has been submitted. Your agent will be notified and will be in touch shortly.
              </p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Document Signed!</h2>
              <p className="text-gray-500 text-sm">
                Thank you, <strong>{signer?.name}</strong>. Your signature has been submitted successfully.
                You will receive a copy once all parties have signed.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Main Signing Page ─────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Document Signing</h1>
              <p className="text-xs text-gray-500">{contract?.contract_templates?.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
            {error}
            <button onClick={() => setError('')} className="ml-4 underline text-red-700">Dismiss</button>
          </div>
        )}

        {/* Signer Welcome */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0284C7] text-white flex items-center justify-center text-lg font-bold">
              {signer?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Hello, {signer?.name}</h2>
              <p className="text-sm text-gray-500">
                You have been asked to review and sign the{' '}
                <strong>{contract?.contract_templates?.name}</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* PDF Preview */}
        {pdfUrl && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Review Document</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full"
                style={{ height: '500px' }}
                title="Contract Document"
              />
            </div>
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#0284C7] hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>
          </div>
        )}

        {/* Reject Form */}
        {showRejectForm && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Reject Document</h3>
            <p className="text-sm text-red-700 mb-3">
              Please explain why you are rejecting this document. Your agent will be notified.
            </p>
            <textarea
              value={rejectionComment}
              onChange={e => setRejectionComment(e.target.value)}
              placeholder="Enter your reason for rejection..."
              rows={4}
              className="w-full px-3 py-2 border border-red-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={submitting || !rejectionComment.trim()}
                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Rejection'}
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

        {/* Signing Fields */}
        {!showRejectForm && (
          <>
            {/* Signature / Initials */}
            {signatureFields.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 space-y-8">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Your Signature</h2>
                  <p className="text-sm text-gray-500">
                    Use your finger or stylus to sign in each field below.
                  </p>
                </div>
                {signatureFields.map(field => (
                  <SignatureCanvas
                    key={field.id}
                    label={field.label}
                    captured={!!(capturedSignatures[field.id])}
                    onCapture={dataUrl =>
                      setCapturedSignatures(prev => ({ ...prev, [field.id]: dataUrl }))
                    }
                  />
                ))}
              </div>
            )}

            {/* Acknowledgement */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800">
                <strong>By clicking "I Agree & Sign", you acknowledge</strong> that you have
                reviewed the <strong>{contract?.contract_templates?.name}</strong> and agree
                to its terms. Your signature is legally binding.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
              <button
                onClick={handleSubmit}
                disabled={submitting || (!allSignaturesCaptured && signatureFields.length > 0)}
                className="py-4 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {submitting ? 'Submitting...' : 'I Agree & Sign'}
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
                Reject Document
              </button>
            </div>

            <p className="text-xs text-center text-gray-400 pb-4">
              Your IP address and timestamp are recorded for audit and legal purposes.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
