'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, tokenManager } from '@/lib/api';
import { CreateClientRequest } from '@my-real-estate-app/shared';

const PROPERTY_OPTIONS = ['Residential', 'Land', 'Commercial', 'Other'];
const AGREEMENT_OPTIONS = ['Buyer Broker Agreement', 'Exclusive Buyer Broker Agreement'];

export default function NewClientPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const initialsCanvasRef = useRef<HTMLCanvasElement>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    address: '',
    documentType: 'Buyer Broker Agreement',
    property_description: '',
    property_description_other: '',
    compensation_type: '$',
    compensation_value: '',
    expiration_date: '',
    retainer_fee: '',
    days_of_execution: '',
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isDrawingInitials, setIsDrawingInitials] = useState(false);
  const [hasInitials, setHasInitials] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Signature Canvas Handling
  const startDrawing = (e: React.MouseEvent | React.TouchEvent, canvas: 'signature' | 'initials') => {
    const canvasElement = canvas === 'signature' ? canvasRef.current : initialsCanvasRef.current;
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(x, y);
      if (canvas === 'signature') {
        setIsDrawing(true);
      } else {
        setIsDrawingInitials(true);
      }
    }
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent | React.TouchEvent, canvas: 'signature' | 'initials') => {
    const canvasElement = canvas === 'signature' ? canvasRef.current : initialsCanvasRef.current;
    const isCurrentlyDrawing = canvas === 'signature' ? isDrawing : isDrawingInitials;
    
    if (!isCurrentlyDrawing || !canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    let x: number, y: number;

    if ('touches' in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;
      ctx.lineTo(x, y);
      ctx.stroke();
      if (canvas === 'signature') {
        setHasSignature(true);
      } else {
        setHasInitials(true);
      }
    }
    e.preventDefault();
  };

  const stopDrawing = (canvas: 'signature' | 'initials') => {
    if (canvas === 'signature') {
      setIsDrawing(false);
    } else {
      setIsDrawingInitials(false);
    }
  };

  const clearCanvas = (canvas: 'signature' | 'initials') => {
    const canvasElement = canvas === 'signature' ? canvasRef.current : initialsCanvasRef.current;
    if (!canvasElement) return;

    const ctx = canvasElement.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      if (canvas === 'signature') {
        setHasSignature(false);
      } else {
        setHasInitials(false);
      }
    }
  };

  const getCanvasImage = (canvas: 'signature' | 'initials'): string | undefined => {
    const canvasElement = canvas === 'signature' ? canvasRef.current : initialsCanvasRef.current;
    const hasContent = canvas === 'signature' ? hasSignature : hasInitials;
    
    if (!hasContent || !canvasElement) return undefined;

    const originalCanvas = canvasElement;
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.floor(originalCanvas.width * 0.5);
    smallCanvas.height = Math.floor(originalCanvas.height * 0.5);

    const ctx = smallCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(originalCanvas, 0, 0, smallCanvas.width, smallCanvas.height);
    }

    return smallCanvas.toDataURL('image/png');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.customerName?.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!formData.email?.trim()) {
      setError('Email is required');
      return;
    }
    if (!formData.phone?.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!formData.address?.trim()) {
      setError('Address is required');
      return;
    }
    if (!formData.property_description) {
      setError('Property description is required');
      return;
    }
    if (formData.property_description === 'Other' && !formData.property_description_other?.trim()) {
      setError('Please specify other property description');
      return;
    }
    if (!formData.compensation_value) {
      setError('Compensation value is required');
      return;
    }
    if (!formData.expiration_date) {
      setError('Expiration date is required');
      return;
    }

if (formData.documentType === 'Exclusive Buyer Broker Agreement') {
  if (!formData.retainer_fee) {
    setError('Retainer fee is required for Exclusive Buyer Broker Agreement');
    return;
  }
  if (!formData.days_of_execution) {
    setError('Days of execution is required for Exclusive Buyer Broker Agreement');
    return;
  }
}

    if (!hasSignature) {
      setError('Signature is required');
      return;
    }
    if (!hasInitials) {
      setError('Buyer initials are required');
      return;
    }

    setLoading(true);
    try {
      const signatureImage = getCanvasImage('signature');
      const buyerInitials = getCanvasImage('initials');

      const clientData: CreateClientRequest = {
        customerName: formData.customerName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        documentType: formData.documentType,
        signature_image: signatureImage,
        property_description: formData.property_description,
        property_description_other: formData.property_description_other,
        compensation_type: formData.compensation_type,
        compensation_value: formData.compensation_value,
        expiration_date: formData.expiration_date,
        buyer_initials: buyerInitials,
        retainer_fee: formData.retainer_fee,
        days_of_execution: formData.days_of_execution,
      };

      const result = await api.createClient(clientData);
      console.log('Client created:', result);
      alert('Client added successfully!');
      router.push('/clients');
    } catch (err: any) {
      console.error('Error creating client:', err);
      const errorMessage = err?.response?.data?.error ||
        err?.response?.data?.message ||
        'Failed to create client';
      setError(errorMessage);
      if (err?.response?.status === 401) {
        tokenManager.clearAll();
        router.push('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image
                src="/logo.png"
                alt="BBSynr Logo"
                width={120}
                height={48}
                className="h-12 w-auto"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New Client</h1>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full bg-gray-400 text-white hover:bg-gray-500 transition-colors hover:shadow-lg"
              title="Go back"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Client Information Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                <select
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  required
                >
                  <option>Non-Exclusive Buyer Broker Agreement</option>
                  <option>Exclusive Buyer Broker Agreement</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  rows={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* Property Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Description *</label>
                <select
                  name="property_description"
                  value={formData.property_description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  required
                >
                  <option value="">Select...</option>
                  {PROPERTY_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              {formData.property_description === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Description *</label>
                  <input
                    type="text"
                    name="property_description_other"
                    value={formData.property_description_other}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                    placeholder="Specify property type"
                    required
                  />
                </div>
              )}
            </div>
          </div>

          {/* Agreement Details Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Agreement Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Compensation *</label>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, compensation_type: '$'}))}
                    className={`px-4 py-2 rounded font-semibold ${
                      formData.compensation_type === '$' 
                        ? 'bg-[#0284C7] text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    $
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({...prev, compensation_type: '%'}))}
                    className={`px-4 py-2 rounded font-semibold ${
                      formData.compensation_type === '%' 
                        ? 'bg-[#0284C7] text-white' 
                        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                  >
                    %
                  </button>
                </div>

                <input
                  type="number"
                  name="compensation_value"
                  value={formData.compensation_value}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  placeholder="Enter value"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiration Date *</label>
                <input
                  type="date"
                  name="expiration_date"
                  value={formData.expiration_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                  required
                />
              </div>
              {formData.documentType  === 'Exclusive Buyer Broker Agreement' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Retainer Fee ($) *</label>
                    <input
                      type="number"
                      name="retainer_fee"
                      value={formData.retainer_fee}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Days of Execution *</label>
                    <input
                      type="number"
                      name="days_of_execution"
                      value={formData.days_of_execution}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 text-gray-900"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Buyer Initials Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Buyer Initials *</h2>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <canvas
                ref={initialsCanvasRef}
                width={300}
                height={100}
                onMouseDown={(e) => startDrawing(e, 'initials')}
                onMouseMove={(e) => draw(e, 'initials')}
                onMouseUp={() => stopDrawing('initials')}
                onMouseLeave={() => stopDrawing('initials')}
                onTouchStart={(e) => startDrawing(e, 'initials')}
                onTouchMove={(e) => draw(e, 'initials')}
                onTouchEnd={() => stopDrawing('initials')}
                className="border border-gray-300 rounded cursor-crosshair touch-none w-full"
                style={{ touchAction: 'none' }}
              />
              <button
                type="button"
                onClick={() => clearCanvas('initials')}
                className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Initials
              </button>
              {hasInitials && (
                <p className="mt-2 text-sm text-green-600 font-medium">✓ Initials captured</p>
              )}
            </div>
          </div>

          {/* Signature Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Signature *</h2>
            <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={(e) => startDrawing(e, 'signature')}
                onMouseMove={(e) => draw(e, 'signature')}
                onMouseUp={() => stopDrawing('signature')}
                onMouseLeave={() => stopDrawing('signature')}
                onTouchStart={(e) => startDrawing(e, 'signature')}
                onTouchMove={(e) => draw(e, 'signature')}
                onTouchEnd={() => stopDrawing('signature')}
                className="border border-gray-300 rounded cursor-crosshair touch-none w-full"
                style={{ touchAction: 'none' }}
              />
              <button
                type="button"
                onClick={() => clearCanvas('signature')}
                className="mt-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Clear Signature
              </button>
              {hasSignature && (
                <p className="mt-2 text-sm text-green-600 font-medium">✓ Signature captured</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-medium disabled:opacity-50"
            >
              {loading ? 'Creating Client...' : 'Create Client'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
