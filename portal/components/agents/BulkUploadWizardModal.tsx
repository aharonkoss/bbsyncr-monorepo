'use client';

import { useState, useRef, useCallback } from 'react';
import {
  XMarkIcon,
  CheckCircleIcon,
  ArrowUpTrayIcon,
  DocumentArrowDownIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';
import { agentsApi } from '@/lib/api/agents';
import toast from 'react-hot-toast';
// ─── Types ────────────────────────────────────────────────────────────────────

export interface ParsedAgent {
  agent_name: string;
  agent_email: string;
  rowIndex: number;
  emailError?: string;
}

interface BulkUploadWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  managerName: string;   // ← ADD
  companyName: string;   // ← ADD
}

// ─── Step config ──────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: 'Upload File' },
  { id: 2, label: 'Review' },
  { id: 3, label: 'Message' },
  { id: 4, label: 'Preview & Send' },
];

// ─── Email validation ─────────────────────────────────────────────────────────

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

// ─── Sample XLSX download ─────────────────────────────────────────────────────

const downloadSampleFile = () => {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    ['Agent Name', 'Agent Email'],
    ['Jane Smith', 'jane.smith@example.com'],
    ['John Doe', 'john.doe@example.com'],
    ['Mary Johnson', 'mary.johnson@example.com'],
  ]);

  // Set column widths
  ws['!cols'] = [{ wch: 25 }, { wch: 35 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Agents');
  XLSX.writeFile(wb, 'bbsynr_agents_template.xlsx');
};

// ─── File parser ──────────────────────────────────────────────────────────────

const parseFile = (file: File): Promise<ParsedAgent[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Skip header row, filter empty rows
        const parsed: ParsedAgent[] = rows
          .slice(1)
          .filter((row) => row.some((cell) => cell?.toString().trim()))
          .map((row, index) => {
            const agent_name = row[0]?.toString().trim() || '';
            const agent_email = row[1]?.toString().trim() || '';
            const emailError = !agent_email
              ? 'Email is required'
              : !isValidEmail(agent_email)
              ? 'Invalid email format'
              : undefined;

            return {
              agent_name,
              agent_email,
              rowIndex: index + 2, // +2 accounts for header + 0-index
              emailError,
            };
          });

        if (parsed.length === 0) {
          reject(new Error('No data rows found in file. Please check your file has data below the header row.'));
          return;
        }

        resolve(parsed);
      } catch {
        reject(new Error('Failed to parse file. Please ensure it is a valid CSV or XLSX file.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsArrayBuffer(file);
  });
};

// ─── Step 1: File Upload ──────────────────────────────────────────────────────

function StepUpload({
  onFileParsed,
  uploadedFile,
}: {
  onFileParsed: (agents: ParsedAgent[], file: File) => void;
  uploadedFile: File | null;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setParseError(null);
    const allowed = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!allowed.includes(file.type)) {
      setParseError('Invalid file type. Please upload a CSV or XLSX file.');
      return;
    }
    setIsParsing(true);
    try {
      const agents = await parseFile(file);
      onFileParsed(agents, file);
    } catch (err: any) {
      setParseError(err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  return (
    <div className="space-y-4">
      {/* Sample download */}
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-blue-800">Need a template?</p>
          <p className="text-xs text-blue-600 mt-0.5">
            Download a sample file with the correct column format.
          </p>
        </div>
        <button
          onClick={downloadSampleFile}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap"
        >
          <DocumentArrowDownIcon className="h-4 w-4" />
          Download Sample
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer
          transition-colors duration-200
          ${isDragging
            ? 'border-blue-400 bg-blue-50'
            : uploadedFile
            ? 'border-green-400 bg-green-50'
            : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Parsing file...</p>
          </div>
        ) : uploadedFile ? (
          <div className="flex flex-col items-center gap-2">
            <CheckCircleIcon className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium text-green-700">{uploadedFile.name}</p>
            <p className="text-xs text-gray-500">Click to upload a different file</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <ArrowUpTrayIcon className="h-10 w-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">
              Drag & drop your file here, or{' '}
              <span className="text-blue-600">browse</span>
            </p>
            <p className="text-xs text-gray-400">Supports CSV and XLSX — max 5MB</p>
            <p className="text-xs text-gray-400 mt-1">
              Required columns: <strong>Agent Name</strong>, <strong>Agent Email</strong>
            </p>
          </div>
        )}
      </div>

      {/* Parse error */}
      {parseError && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{parseError}</p>
        </div>
      )}
    </div>
  );
}
// ─── Step 2: Review Grid ──────────────────────────────────────────────────────
// ─── Step 3: Custom Message ───────────────────────────────────────────────────

const MESSAGE_SUGGESTIONS = [
  "We're excited to have you join our team! Please complete your registration at your earliest convenience.",
  "Welcome! As part of our team, BBSynr will help you manage buyer broker agreements and client signatures all in one place.",
  "Hi! Your manager has invited you to join BBSynr. Please take a few minutes to complete your registration.",
];
// ─── Step 4: Preview & Send ───────────────────────────────────────────────────

function StepPreviewSend({
  agents,
  customMessage,
  managerName,
  companyName,
  isSending,
  result,
  onSend,
}: {
  agents: ParsedAgent[];
  customMessage: string;
  managerName: string;
  companyName: string;
  isSending: boolean;
  result: { sent: number; skipped: number; failed: { email: string; reason: string }[] } | null;
  onSend: () => void;
}) {
  const validAgents = agents.filter((a) => !a.emailError);

  // Success state
  if (result) {
    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircleIcon className="h-10 w-10 text-green-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Invitations Sent!</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
            ✓ {result.sent} sent
          </span>
          {result.skipped > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-medium">
              {result.skipped} skipped
            </span>
          )}
          {result.failed.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-medium">
              {result.failed.length} failed
            </span>
          )}
        </div>
        {result.failed.length > 0 && (
          <div className="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-red-700 mb-2">Failed to send:</p>
            {result.failed.map((f) => (
              <p key={f.email} className="text-xs text-red-600">
                {f.email} — {f.reason}
              </p>
            ))}
          </div>
        )}
        <p className="text-sm text-gray-500 text-center max-w-xs">
          Agents will receive an email with your personal message and a link to complete their registration.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Send summary */}
      <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <div>
          <p className="text-sm font-medium text-gray-800">
            Ready to send <strong>{validAgents.length} invitation{validAgents.length !== 1 ? 's' : ''}</strong>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            Each agent will receive a personalized email with your message.
          </p>
        </div>
      </div>

      {/* Email preview */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Email Preview
        </p>
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          {/* Fake email header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 space-y-1">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-600 w-8">From</span>
              <span>BBSynr &lt;noreply@bbsynr.com&gt;</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-600 w-8">To</span>
              <span>agent@example.com</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium text-gray-600 w-8">Sub</span>
              <span>{companyName} has invited you to join BBSynr</span>
            </div>
          </div>

          {/* Email body preview */}
          <div className="px-4 py-4 max-h-56 overflow-y-auto space-y-3 text-sm text-gray-700 bg-white">
            <p>Hi [Agent Name],</p>
            <p>
              <strong>{managerName}</strong> from <strong>{companyName}</strong> has invited you to join
              BBSynr — the modern platform for real estate contract management.
            </p>

            {/* Custom message block */}
            <div className="border-l-4 border-blue-400 bg-blue-50 px-3 py-2.5 rounded-r-lg">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-1">
                A message from {managerName}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{customMessage}</p>
            </div>

            <p>Your login email will be: <strong>[agent email]</strong></p>
            <div className="text-center py-2">
              <span className="inline-block px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg">
                Complete Registration
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepMessage({
  customMessage,
  onMessageChange,
  managerName,
  companyName,
}: {
  customMessage: string;
  onMessageChange: (msg: string) => void;
  managerName: string;
  companyName: string;
}) {
  const MAX_CHARS = 500;
  const remaining = MAX_CHARS - customMessage.length;
  const isOverLimit = remaining < 0;
  const isEmpty = customMessage.trim().length === 0;

  return (
    <div className="space-y-4">
      {/* Context note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
        <p className="text-sm text-blue-800">
          This message will appear in the invitation email sent from{' '}
          <strong>{managerName}</strong> at <strong>{companyName}</strong>.
          Make it personal to increase registration rates.
        </p>
      </div>

      {/* Suggestions */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
          Suggestions — click to use
        </p>
        <div className="space-y-2">
          {MESSAGE_SUGGESTIONS.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onMessageChange(suggestion)}
              className={`
                w-full text-left text-sm px-3 py-2.5 rounded-lg border transition-colors
                ${customMessage === suggestion
                  ? 'border-blue-400 bg-blue-50 text-blue-800'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:bg-blue-50'}
              `}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Your Message <span className="text-red-500">*</span>
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Write a personal message to your agents..."
          rows={4}
          maxLength={MAX_CHARS + 50} // soft enforce via UI, not hard cutoff
          className={`
            w-full px-3 py-2.5 text-sm border rounded-lg resize-none
            focus:outline-none focus:ring-2 transition-colors
            ${isOverLimit
              ? 'border-red-300 focus:ring-red-200'
              : isEmpty
              ? 'border-gray-300 focus:ring-blue-200 focus:border-blue-400'
              : 'border-green-300 focus:ring-green-200 focus:border-green-400'}
          `}
        />
        <div className="flex justify-between items-center mt-1">
          {isEmpty && (
            <p className="text-xs text-red-500">A message is required before sending.</p>
          )}
          {!isEmpty && !isOverLimit && (
            <p className="text-xs text-green-600">✓ Looks good</p>
          )}
          {isOverLimit && (
            <p className="text-xs text-red-500">Message is too long — please shorten it.</p>
          )}
          <p className={`text-xs ml-auto ${isOverLimit ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
            {remaining} characters remaining
          </p>
        </div>
      </div>
    </div>
  );
}

function StepReview({
  agents,
  onAgentsChange,
}: {
  agents: ParsedAgent[];
  onAgentsChange: (agents: ParsedAgent[]) => void;
}) {
  const invalidAgents = agents.filter((a) => a.emailError);
  const validAgents = agents.filter((a) => !a.emailError);

  const handleIgnoreErrors = () => {
    onAgentsChange(validAgents);
  };

  const handleRemoveRow = (rowIndex: number) => {
    onAgentsChange(agents.filter((a) => a.rowIndex !== rowIndex));
  };

  const handleEmailChange = (rowIndex: number, newEmail: string) => {
    onAgentsChange(
      agents.map((a) => {
        if (a.rowIndex !== rowIndex) return a;
        const emailError = !newEmail.trim()
          ? 'Email is required'
          : !isValidEmail(newEmail)
          ? 'Invalid email format'
          : undefined;
        return { ...a, agent_email: newEmail, emailError };
      })
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircleIcon className="h-3.5 w-3.5" />
            {validAgents.length} valid
          </span>
          {invalidAgents.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
              <ExclamationCircleIcon className="h-3.5 w-3.5" />
              {invalidAgents.length} invalid
            </span>
          )}
        </div>
        {invalidAgents.length > 0 && (
          <button
            onClick={handleIgnoreErrors}
            className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
          >
            Ignore Errors ({invalidAgents.length})
          </button>
        )}
      </div>

      {/* Invalid email notice */}
      {invalidAgents.length > 0 && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <ExclamationCircleIcon className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Rows with invalid email addresses will be skipped when sending. You can correct them inline, remove them individually, or click <strong>Ignore Errors</strong> to remove all invalid rows at once.
          </p>
        </div>
      )}

      {/* Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-8">
                #
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Agent Name
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Agent Email
              </th>
              <th className="px-4 py-2.5 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {agents.map((agent) => (
              <tr
                key={agent.rowIndex}
                className={agent.emailError ? 'bg-red-50' : 'bg-white hover:bg-gray-50'}
              >
                <td className="px-4 py-2.5 text-xs text-gray-400">
                  {agent.rowIndex}
                </td>
                <td className="px-4 py-2.5 text-gray-700">
                  {agent.agent_name || <span className="text-gray-400 italic">No name</span>}
                </td>
                <td className="px-4 py-2.5">
                  {agent.emailError ? (
                    <div className="space-y-1">
                      <input
                        type="email"
                        value={agent.agent_email}
                        onChange={(e) => handleEmailChange(agent.rowIndex, e.target.value)}
                        className="w-full text-sm px-2 py-1 border border-red-300 rounded focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"
                        placeholder="Enter valid email"
                      />
                      <p className="text-xs text-red-500">{agent.emailError}</p>
                    </div>
                  ) : (
                    <span className="text-gray-700">{agent.agent_email}</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => handleRemoveRow(agent.rowIndex)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="Remove row"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {agents.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm">
          No agents remaining. Please go back and upload a file.
        </div>
      )}
    </div>
  );
}
// ─── Main Component ───────────────────────────────────────────────────────────

export default function BulkUploadWizardModal({
  isOpen,
  onClose,
  onSuccess,
  managerName,    // ← ADD
  companyName,    // ← ADD
}: BulkUploadWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [parsedAgents, setParsedAgents] = useState<ParsedAgent[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<{
    sent: number;
    skipped: number;
    failed: { email: string; reason: string }[];
  } | null>(null);
  if (!isOpen) return null;

  const handleClose = () => {
  setCurrentStep(1);
  setParsedAgents([]);
  setCustomMessage('');
  setUploadedFile(null);
  setSendResult(null);   // ← ADD
  onClose();
};

  const handleStartOver = () => {
    setCurrentStep(1);
    setParsedAgents([]);
    setCustomMessage('');
    setUploadedFile(null);
    setSendResult(null);   // ← ADD
  };

  

  const handleFileParsed = (agents: ParsedAgent[], file: File) => {
    setParsedAgents(agents);
    setUploadedFile(file);
  };
  const handleSend = async () => {
  setIsSending(true);
  try {
    const validAgents = parsedAgents
      .filter((a) => !a.emailError)
      .map(({ agent_name, agent_email }) => ({ agent_name, agent_email }));

    const result = await agentsApi.bulkAddAgents(
        validAgents,
        customMessage,
        uploadedFile!
      );

    setSendResult(result);
  } catch (error: any) {
    toast.error(error?.response?.data?.error || 'Failed to send invitations');
  } finally {
    setIsSending(false);
  }
};

  const validAgents = parsedAgents.filter((a) => !a.emailError);
  const canProceedFromStep1 = uploadedFile !== null && validAgents.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Bulk Upload Agents
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Step Progress Indicator */}
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                return (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div
                        className={`
                          w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                          transition-colors duration-200
                          ${isCompleted
                            ? 'bg-green-500 text-white'
                            : isCurrent
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-500'}
                        `}
                      >
                        {isCompleted
                          ? <CheckCircleIcon className="h-5 w-5" />
                          : step.id}
                      </div>
                      <span
                        className={`
                          mt-1 text-xs font-medium whitespace-nowrap
                          ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-500' : 'text-gray-400'}
                        `}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < STEPS.length - 1 && (
                      <div
                        className={`
                          flex-1 h-0.5 mx-2 mb-4 transition-colors duration-200
                          ${currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'}
                        `}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="px-6 py-6 min-h-[320px]">
            {currentStep === 1 && (
              <StepUpload
                onFileParsed={handleFileParsed}
                uploadedFile={uploadedFile}
              />
            )}
            {currentStep === 2 && (
              <StepReview
                agents={parsedAgents}
                onAgentsChange={setParsedAgents}
              />
            )}

            {currentStep === 3 && (
              <StepMessage
                customMessage={customMessage}
                onMessageChange={setCustomMessage}
                managerName={managerName}
                companyName={companyName}
              />
            )}
            {currentStep === 4 && (
                  <StepPreviewSend
                    agents={parsedAgents}
                    customMessage={customMessage}
                    managerName={managerName}
                    companyName={companyName}
                    isSending={isSending}
                    result={sendResult}
                    onSend={handleSend}
                  />
                )}
          </div>
         {/* Footer Nav */}
          {!sendResult && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep((s) => s - 1)}
                    disabled={isSending}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Back
                  </button>
                )}
                {currentStep > 1 && (
                  <button
                    onClick={handleStartOver}
                    disabled={isSending}
                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors disabled:opacity-40"
                  >
                    Start Over
                  </button>
                )}
              </div>

              {currentStep < 4 && (
                <button
                  onClick={() => setCurrentStep((s) => s + 1)}
                  disabled={
                    (currentStep === 1 && !canProceedFromStep1) ||
                    (currentStep === 2 && validAgents.length === 0) ||
                    (currentStep === 3 && customMessage.trim().length === 0)
                  }
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              )}

              {currentStep === 4 && (
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="px-5 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {isSending ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="h-4 w-4" />
                      Send {validAgents.length} Invitation{validAgents.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {/* Success footer */}
          {sendResult && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={handleStartOver}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Upload Another File
              </button>
              <button
                onClick={() => { onSuccess(); setSendResult(null); }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          )}

          

        </div>
      </div>
    </div>
  );
}
