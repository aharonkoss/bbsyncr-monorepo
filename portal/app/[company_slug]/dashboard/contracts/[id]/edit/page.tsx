'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Document, Page, pdfjs } from 'react-pdf';
import { apiClient } from '@/lib/api/client';
import { ContractTemplate, ContractField } from '@/lib/api/contracts';
import toast from 'react-hot-toast';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ZOOM_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const DEFAULT_PDF_WIDTH = 900;

type FieldType = 'text' | 'number' | 'date' | 'checkbox' | 'dropdown' | 'signature' | 'initials';
const FIELD_SOURCES: {
  value: string;
  label: string;
  icon: string;
  category: 'agent' | 'client';
  defaultFieldType: FieldType;
}[] = [
  // Agent fields
  { value: 'agent_name',      label: 'Agent Name',      icon: '👤', category: 'agent',  defaultFieldType: 'text' },
  { value: 'agent_phone',     label: 'Agent Phone',     icon: '📞', category: 'agent',  defaultFieldType: 'text' },
  { value: 'agent_email',     label: 'Agent Email',     icon: '📧', category: 'agent',  defaultFieldType: 'text' },
  { value: 'agent_signature', label: 'Agent Signature', icon: '✍️', category: 'agent',  defaultFieldType: 'signature' },
  // Client fields
  { value: 'client_name',     label: 'Client Name',     icon: '🏠', category: 'client', defaultFieldType: 'text' },
  { value: 'client_address',  label: 'Client Address',  icon: '📍', category: 'client', defaultFieldType: 'text' },
  { value: 'client_email',    label: 'Client Email',    icon: '📧', category: 'client', defaultFieldType: 'text' },
  { value: 'client_phone',    label: 'Client Phone',    icon: '📞', category: 'client', defaultFieldType: 'text' },
];

type PlacedField = Partial<ContractField> & {
  x_percent: number;
  y_percent: number;
  page_number: number;
  _tempId: string;
  field_source?: string; 
};

type FieldFormData = {
  field_type: FieldType;
  label: string;
  placeholder: string;
  is_required: boolean;
  signer_index: number;
  width_percent: number;
  height_percent: number;
  dropdown_options: string;
  field_source: string; 
};

const FIELD_TYPES: { value: FieldType; label: string; icon: string }[] = [
  { value: 'text',      label: 'Text',      icon: '✏️' },
  { value: 'number',    label: 'Number',    icon: '🔢' },
  { value: 'date',      label: 'Date',      icon: '📅' },
  { value: 'checkbox',  label: 'Checkbox',  icon: '☑️' },
  { value: 'dropdown',  label: 'Dropdown',  icon: '📋' },
  { value: 'signature', label: 'Signature', icon: '✍️' },
  { value: 'initials',  label: 'Initials',  icon: '🔤' },
];

const DEFAULT_FORM: FieldFormData = {
  field_type: 'text',
  label: '',
  placeholder: '',
  is_required: true,
  signer_index: 0,
  width_percent: 20,
  height_percent: 5,
  dropdown_options: '',
  field_source: 'manual', 
};

// ============================================================
// DraggableField component
// ============================================================
type DraggableFieldProps = {
  field: PlacedField;
  onMove: (tempId: string, x: number, y: number) => void;
  onDelete: (tempId: string) => void;
  onEdit: (field: PlacedField) => void; 
  fieldTypes: { value: FieldType; label: string; icon: string }[];
  pageRef: React.RefObject<HTMLDivElement>;
};

function DraggableField({ field, onMove, onDelete, onEdit, fieldTypes, pageRef }: DraggableFieldProps) {
  const dragStart = useRef<{ mouseX: number; mouseY: number; fieldX: number; fieldY: number } | null>(null);
  const didDrag = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    didDrag.current = false;

    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      fieldX: field.x_percent,
      fieldY: field.y_percent,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStart.current || !pageRef.current) return;
      didDrag.current = true;
      const rect = pageRef.current.getBoundingClientRect();
      const dx = ((moveEvent.clientX - dragStart.current.mouseX) / rect.width) * 100;
      const dy = ((moveEvent.clientY - dragStart.current.mouseY) / rect.height) * 100;
      const newX = Math.min(Math.max(dragStart.current.fieldX + dx, 0), 95);
      const newY = Math.min(Math.max(dragStart.current.fieldY + dy, 0), 95);
      onMove(field._tempId, newX, newY);
    };

    const handleMouseUp = () => {
      dragStart.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!didDrag.current) {
      onEdit(field);
    }
    didDrag.current = false;
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className="absolute border-2 border-blue-500 bg-blue-50 bg-opacity-80 rounded group"
      style={{
        left: `${field.x_percent}%`,
        top: `${field.y_percent}%`,
        width: `${field.width_percent}%`,
        height: `${field.height_percent}%`,
        cursor: 'grab',
        zIndex: 10,
      }}
    >
      <span className="text-xs text-blue-700 font-medium truncate px-1 leading-tight flex items-center h-full pointer-events-none">
        {fieldTypes.find(t => t.value === field.field_type)?.icon} {field.label}
        {field.field_source && field.field_source !== 'manual' && (
          <span className="ml-1 text-yellow-600 text-xs">⚡</span>
        )}
      </span>
      <button
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onDelete(field._tempId); }}
        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold leading-none items-center justify-center hidden group-hover:flex"
        style={{ zIndex: 20 }}
      >
        ×
      </button>
    </div>
  );
}


// ============================================================
// Main page
// ============================================================
export default function FieldBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.company_slug as string;
  const templateId = params.id as string;
  const [editingTempId, setEditingTempId] = useState<string | null>(null);
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomIndex, setZoomIndex] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [placingField, setPlacingField] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number; page: number } | null>(null);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fieldForm, setFieldForm] = useState<FieldFormData>(DEFAULT_FORM);

  const pageRef = useRef<HTMLDivElement>(null);
  const pdfWidth = DEFAULT_PDF_WIDTH * ZOOM_STEPS[zoomIndex];
  const zoomPercent = Math.round(ZOOM_STEPS[zoomIndex] * 100);

  useEffect(() => { fetchTemplate(); }, [templateId]);

  const fetchTemplate = async () => {
    try {
      const [templateRes, urlRes] = await Promise.all([
        apiClient.get(`/api/portal/contracts/templates/${templateId}`),
        apiClient.get(`/api/portal/contracts/templates/${templateId}/url`),
      ]);
      setTemplate(templateRes.data.template);
      setPdfUrl(urlRes.data.url);
      const existing = templateRes.data.template.contract_fields || [];
      setPlacedFields(existing.map((f: ContractField) => ({
        ...f,
        _tempId: f.id || crypto.randomUUID(),
      })));
    } catch (error) {
      toast.error('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingField) return;
    const rect = pageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPendingPosition({
      x: Math.min(Math.max(x, 0), 90),
      y: Math.min(Math.max(y, 0), 90),
      page: currentPage,
    });
    setPlacingField(false);
    setFieldForm(DEFAULT_FORM);
    setSidebarOpen(true);
  }, [placingField, currentPage]);

  const handleAddField = () => {
    if (!fieldForm.label.trim()) { toast.error('Label is required'); return; }
    if (!pendingPosition) return;
    const newField: PlacedField = {
      _tempId: crypto.randomUUID(),
      field_type: fieldForm.field_type,
      label: fieldForm.label.trim(),
      placeholder: fieldForm.placeholder.trim() || undefined,
      is_required: fieldForm.is_required,
      signer_index: fieldForm.signer_index,
      page_number: pendingPosition.page,
      x_percent: pendingPosition.x,
      y_percent: pendingPosition.y,
      width_percent: fieldForm.width_percent,
      height_percent: fieldForm.height_percent,
      dropdown_options: fieldForm.field_type === 'dropdown'
        ? fieldForm.dropdown_options.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      field_source: fieldForm.field_source || 'manual',
    };
    if (editingTempId) {
    // Update existing field
    setPlacedFields(prev =>
        prev.map(f => f._tempId === editingTempId ? { ...newField, _tempId: editingTempId } : f)
    );
    setEditingTempId(null);
    toast.success(`${fieldForm.label} field updated`);
    } else {
    // Add new field
    setPlacedFields(prev => [...prev, newField]);
    toast.success(`${fieldForm.label} field added`); 
    }

    setSidebarOpen(false);
    setPendingPosition(null);
  };

  const handleSaveFields = async () => {
    setSaving(true);
    try {
      const payload = placedFields.map((f, index) => ({
        field_type: f.field_type,
        label: f.label,
        placeholder: f.placeholder || null,
        is_required: f.is_required ?? true,
        signer_index: f.signer_index ?? 0,
        page_number: f.page_number,
        x_percent: f.x_percent,
        y_percent: f.y_percent,
        width_percent: f.width_percent ?? 20,
        height_percent: f.height_percent ?? 5,
        dropdown_options: f.dropdown_options || null,
        sort_order: index,
        field_source: f.field_source || 'manual', 
      }));
      await apiClient.post(`/api/portal/contracts/templates/${templateId}/fields`, { fields: payload });
      toast.success('Fields saved successfully!');
      router.push(`/${companySlug}/dashboard/contracts`);
    } catch (error) {
      toast.error('Failed to save fields');
    } finally {
      setSaving(false);
    }
  };
const handleEditField = (field: PlacedField) => {
  setEditingTempId(field._tempId);
  setPendingPosition({
    x: field.x_percent,
    y: field.y_percent,
    page: field.page_number,
  });
  setFieldForm({
    field_type: field.field_type as FieldType,
    label: field.label || '',
    placeholder: (field.placeholder as string) || '',
    is_required: field.is_required ?? true,
    signer_index: field.signer_index ?? 0,
    width_percent: field.width_percent ?? 20,
    height_percent: field.height_percent ?? 5,
    dropdown_options: Array.isArray(field.dropdown_options)
      ? field.dropdown_options.join('\n')
      : '',
    field_source: field.field_source || 'manual',   // ← ADD THIS
  });
  setSidebarOpen(true);
};

  const handleCancelSidebar = () => {
    setSidebarOpen(false);
    setPendingPosition(null);
    setEditingTempId(null);
  };

  const inputClass = "block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none";

  if (loading) return <div className="flex justify-center py-12">Loading field builder...</div>;
  if (!template || !pdfUrl) return <div className="flex justify-center py-12 text-red-500">Template not found.</div>;

  return (
    <div className="flex gap-6">

      {/* ===== LEFT: PDF Builder ===== */}
      <div className="flex-1 min-w-0">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.push(`/${companySlug}/dashboard/contracts`)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
            >
              ← Back to Contract Library
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">
              Field Builder — {template.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {placingField
                ? '🎯 Click anywhere on the PDF to place your field...'
                : `${placedFields.length} field${placedFields.length !== 1 ? 's' : ''} placed. Click + Place Field to add more.`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSaveFields}
              disabled={saving || placedFields.length === 0}
              className={`px-5 py-2.5 rounded-lg text-white text-sm font-medium ${
                saving || placedFields.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {saving ? 'Saving...' : `Save ${placedFields.length} Field${placedFields.length !== 1 ? 's' : ''}`}
            </button>
            <button
              onClick={() => {
                setPendingPosition(null);
                setSidebarOpen(false);
                setPlacingField(true);
                toast('Click on the PDF where you want to place a field', { icon: '🎯' });
              }}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              + Place Field
            </button>
          </div>
        </div>

        {/* PDF Card */}
        <div className="bg-white shadow rounded-lg p-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm font-medium">
                ← Prev
              </button>
              <span className="text-sm text-gray-600 min-w-[80px] text-center">
                Page {currentPage} of {numPages}
              </span>
              <button onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage === numPages}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-sm font-medium">
                Next →
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setZoomIndex(i => Math.max(0, i - 1))} disabled={zoomIndex === 0}
                className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-lg font-bold flex items-center justify-center">−</button>
              <span className="text-sm text-gray-600 min-w-[48px] text-center font-medium">{zoomPercent}%</span>
              <button onClick={() => setZoomIndex(i => Math.min(ZOOM_STEPS.length - 1, i + 1))} disabled={zoomIndex === ZOOM_STEPS.length - 1}
                className="w-8 h-8 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-lg font-bold flex items-center justify-center">+</button>
              <button onClick={() => setZoomIndex(2)}
                className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-sm font-medium ml-1">Reset</button>
            </div>
          </div>

          {/* PDF Canvas */}
          <div className="overflow-auto border border-gray-200 rounded-lg bg-gray-100">
            <div className="flex justify-center py-4">
              <div
                ref={pageRef}
                onClick={handlePdfClick}
                className={`relative select-none ${placingField ? 'cursor-crosshair' : 'cursor-default'}`}
              >
                <Document
                  file={pdfUrl}
                  onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                  onLoadError={() => toast.error('Failed to load PDF')}
                >
                  <Page
                    pageNumber={currentPage}
                    width={pdfWidth}
                    renderTextLayer={true}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {/* Placing mode border */}
                {placingField && (
                  <div
                    className="absolute inset-0 border-2 border-blue-400 border-dashed rounded pointer-events-none"
                    style={{ backgroundColor: 'transparent' }}
                  />
                )}

                {/* Pending position dot */}
                {pendingPosition && pendingPosition.page === currentPage && (
                  <div
                    className="absolute w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-lg pointer-events-none"
                    style={{
                      left: `${pendingPosition.x}%`,
                      top: `${pendingPosition.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  />
                )}

                {/* Draggable placed fields */}
                {placedFields
                  .filter(f => f.page_number === currentPage)
                  .map(field => (
                    <DraggableField
                      key={field._tempId}
                      field={field}
                      onMove={(tempId, x, y) =>
                        setPlacedFields(prev =>
                          prev.map(f => f._tempId === tempId ? { ...f, x_percent: x, y_percent: y } : f)
                        )
                      }
                      onEdit={handleEditField}
                      onDelete={(tempId) => {
                        setPlacedFields(prev => prev.filter(f => f._tempId !== tempId));
                        toast.success('Field removed');
                      }}
                      fieldTypes={FIELD_TYPES}
                      pageRef={pageRef}
                    />
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fields list below PDF */}
        {placedFields.length > 0 && (
          <div className="mt-4 bg-white shadow rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              Placed Fields ({placedFields.length})
            </h3>
            <div className="space-y-2">
              {placedFields.map((field) => (
                <div key={field._tempId} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{FIELD_TYPES.find(t => t.value === field.field_type)?.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{field.label}</p>
                      <p className="text-xs text-gray-500">
                        Page {field.page_number} · Signer {(field.signer_index ?? 0) + 1} · {field.field_type} · {field.is_required ? 'Required' : 'Optional'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setPlacedFields(prev => prev.filter(f => f._tempId !== field._tempId))}
                    className="text-red-400 hover:text-red-600 text-sm font-medium px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== RIGHT: Field Properties Sidebar ===== */}
      {sidebarOpen && (
        <div className="w-80 flex-shrink-0">
          <div className="bg-white shadow rounded-lg p-5 sticky top-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-gray-900">Field Properties</h2>
              <button onClick={handleCancelSidebar} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">

        {/* ── Smart Fields Palette ─────────────────────── */}
        {!editingTempId && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-gray-700">⚡ Auto-Fill Fields</span>
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                Auto
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Click to place — values fill automatically from agent or client data. No manual entry needed.
            </p>

            {/* Agent Fields */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              👤 Agent
            </p>
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {FIELD_SOURCES.filter(s => s.category === 'agent').map(source => (
                <button
                  key={source.value}
                  type="button"
                  onClick={() => {
                    setFieldForm(prev => ({
                      ...prev,
                      field_type: source.defaultFieldType,
                      label: source.label,
                      field_source: source.value,
                      is_required: false,
                      width_percent: source.defaultFieldType === 'signature' ? 30 : 20,
                      height_percent: source.defaultFieldType === 'signature' ? 8 : 5,
                    }));
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
                    fieldForm.field_source === source.value
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
                      : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 text-gray-700'
                  }`}
                >
                  <span>{source.icon}</span>
                  <span className="truncate">{source.label}</span>
                </button>
              ))}
            </div>

    {/* Client Fields */}
    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
      🏠 Client
    </p>
    <div className="grid grid-cols-2 gap-1.5 mb-3">
      {FIELD_SOURCES.filter(s => s.category === 'client').map(source => (
        <button
          key={source.value}
          type="button"
          onClick={() => {
            setFieldForm(prev => ({
              ...prev,
              field_type: source.defaultFieldType,
              label: source.label,
              field_source: source.value,
              is_required: false,
              width_percent: 20,
              height_percent: 5,
            }));
          }}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors ${
            fieldForm.field_source === source.value
              ? 'border-yellow-400 bg-yellow-50 text-yellow-800'
              : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 text-gray-700'
          }`}
        >
          <span>{source.icon}</span>
          <span className="truncate">{source.label}</span>
        </button>
      ))}
    </div>

    <div className="border-t border-gray-200 pt-3 mt-1">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        ✏️ Manual Fields
      </p>
    </div>
  </div>
)}

{/* Auto-fill badge shown when editing an auto-fill field */}
{editingTempId && fieldForm.field_source !== 'manual' && (
  <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
    <span className="text-yellow-600 text-sm">⚡</span>
    <span className="text-xs text-yellow-800 font-medium">
      Auto-fill field — source: <strong>{fieldForm.field_source}</strong>
    </span>
  </div>
)}

              {/* Field Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {FIELD_TYPES.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFieldForm(prev => ({ ...prev, field_type: type.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        fieldForm.field_type === type.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span>{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={fieldForm.label}
                  onChange={e => setFieldForm(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g. Client Name"
                  className={inputClass}
                />
              </div>

              {/* Placeholder */}
              {!['signature', 'initials', 'checkbox'].includes(fieldForm.field_type) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={fieldForm.placeholder}
                    onChange={e => setFieldForm(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="Optional hint text"
                    className={inputClass}
                  />
                </div>
              )}

              {/* Dropdown options */}
              {fieldForm.field_type === 'dropdown' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options <span className="text-xs text-gray-400">(one per line)</span>
                  </label>
                  <textarea
                    value={fieldForm.dropdown_options}
                    onChange={e => setFieldForm(prev => ({ ...prev, dropdown_options: e.target.value }))}
                    placeholder={"Option 1\nOption 2\nOption 3"}
                    rows={4}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Signer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                <select
                  value={fieldForm.signer_index}
                  onChange={e => setFieldForm(prev => ({ ...prev, signer_index: Number(e.target.value) }))}
                  className={inputClass}
                >
                  <option value={0}>Signer 1</option>
                  <option value={1}>Signer 2</option>
                  <option value={2}>Signer 3</option>
                </select>
              </div>

              {/* Size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Width %</label>
                  <input
                    type="number"
                    min={5} max={100}
                    value={fieldForm.width_percent}
                    onChange={e => setFieldForm(prev => ({ ...prev, width_percent: Number(e.target.value) }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height %</label>
                  <input
                    type="number"
                    min={1} max={50}
                    value={fieldForm.height_percent}
                    onChange={e => setFieldForm(prev => ({ ...prev, height_percent: Number(e.target.value) }))}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Required toggle */}
              <div className="flex items-center justify-between py-2">
                <label className="text-sm font-medium text-gray-700">Required field</label>
                <button
                  type="button"
                  onClick={() => setFieldForm(prev => ({ ...prev, is_required: !prev.is_required }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    fieldForm.is_required ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    fieldForm.is_required ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Position info */}
              {pendingPosition && (
                <div className="text-xs text-gray-400 bg-gray-50 rounded p-2">
                  Position: X {pendingPosition.x.toFixed(1)}% · Y {pendingPosition.y.toFixed(1)}% · Page {pendingPosition.page}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddField}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
                >
                  {editingTempId ? 'Update Field' : 'Add Field'}
                </button>
                <button
                  onClick={handleCancelSidebar}
                  className="px-4 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
