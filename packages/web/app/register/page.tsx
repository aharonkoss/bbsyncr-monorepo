'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api, tokenManager } from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';

export default function RegisterPage() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState<'form' | 'signature' | 'payment' | 'success'>('form');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual' | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState(null);

  const [formData, setFormData] = useState({
    realtorName: '',
    realtorCompany: '',
    realtorPhone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: "",
    city: "",
    state: "",
    zip: ""
  });

  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // ==================== SIGNATURE FUNCTIONS ====================

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    let x: number, y: number;
    if ('touches' in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.fillStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;
      
      ctx.beginPath();
      ctx.moveTo(x, y);
      setIsDrawing(true);
    }
    
    e.preventDefault();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    
    let x: number, y: number;
    if ('touches' in e) {
      const touch = e.touches[0];
      x = touch.clientX - rect.left;
      y = touch.clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    
    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = 1.0;
      
      ctx.lineTo(x, y);
      ctx.stroke();
      setHasSignature(true);
    }
    
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
    setHasSignature(false);
  };

  const getSignatureImage = (): string | undefined => {
    if (!hasSignature || !canvasRef.current) return undefined;
    
    const originalCanvas = canvasRef.current;
    const smallCanvas = document.createElement('canvas');
    smallCanvas.width = Math.floor(originalCanvas.width * 0.5);
    smallCanvas.height = Math.floor(originalCanvas.height * 0.5);
    
    const ctx = smallCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(originalCanvas, 0, 0, smallCanvas.width, smallCanvas.height);
    }
    
    const compressedImage = smallCanvas.toDataURL('image/png');
    return compressedImage;
  };

  // ==================== VALIDATION FUNCTIONS ====================

  const validateForm = (): boolean => {
    if (!formData.realtorName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.realtorCompany.trim()) {
      setError('Company name is required');
      return false;
    }
    if (!formData.realtorPhone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Firm Address is required');
      return false;
    }
    if (!formData.city.trim()) {
      setError('Firm City is required');
      return false;
    }
    if (!formData.state.trim()) {
      setError('Firm State is required');
      return false;
    }
    if (!formData.zip.trim()) {
      setError('Firm Zip Code is required');
      return false;
    }
    const phoneRegex = /^[\d\-\(\)\s]+$/;
    if (!phoneRegex.test(formData.realtorPhone)) {
      setError('Invalid phone format');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Invalid email format');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 10) {
      setError('Password must be at least 10 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return false;
    }

    return true;
  };

  // ==================== FORM HANDLERS ====================

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handlePlanSelect = (plan: 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    setError('');
  };

  const handleFormSubmit = () => {
    setError('');
    if (validateForm()) {
      setStep('signature');
    }
  };

  const handleSignatureSubmit = async () => {
    setError('');
    if (!hasSignature) {
      setError('Signature is required');
      return;
    }
    if (!selectedPlan) {
      setError('Please select a plan');
      return;
    }

    setLoading(true);

    try {
      const signature = getSignatureImage();
      const priceId = selectedPlan === 'monthly' ? 'price_monthly' : 'price_annual';

      const response = await api.register({
        realtorName: formData.realtorName,
        realtorCompany: formData.realtorCompany,
        realtorPhone: formData.realtorPhone,
        email: formData.email,
        password: formData.password,
        agent_signature: signature,
        priceId: priceId,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
      });
      console.log('Registration response:', response);
      const userId = response.user.id; // <-- This is the UUID from Supabase

      // Store the UUID in your state for downstream use (e.g., payment)
      setUserId(userId);
      setStep('payment');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setStep('success');
  };

  const handleGoToClients = () => {
    router.push('/clients');
  };
  //  =====================STRIP PAYMENT INTEGRATION====================
    const [stripePromise] = useState(() => 
    loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '')
    );

    // Add this function to handle payment
    const handlePayment = async () => {
      setError('');
      setLoading(true);

      try {
        const tempUserId = `temp_${Date.now()}`;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId,
            email: formData.email,
            plan: selectedPlan,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create checkout session');
        }

        const { url } = await response.json();
        
        // Redirect directly to the Stripe-provided checkout URL
        window.location.href = url;

      } catch (err: any) {
        console.error('Payment error:', err);
        setError(err.message || 'Payment failed');
        setLoading(false);
      }
    };




  // ==================== RENDER FUNCTIONS ====================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b-4 border-[#0284C7] sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center" style={{ height: '97px' }}>
          <Image
            src="/logo.png"
            alt="BBSynr Logo"
            width={240}
            height={96}
            className="h-24 w-auto object-contain"
            priority
          />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* STEP 1: REGISTRATION FORM */}
        {step === 'form' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Account</h1>
            <p className="text-gray-600 mb-8">Join BBSynr and start managing real estate documents</p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            {/* Form Fields */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  name="realtorName"
                  value={formData.realtorName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                <input
                  type="text"
                  name="realtorCompany"
                  value={formData.realtorCompany}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="Your Real Estate Company"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  name="realtorPhone"
                  value={formData.realtorPhone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="(602) 555-1234"
                />
              </div>
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Firm Address</label>
                <input
                  type="tel"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="123 Main St"
                />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firm City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                    placeholder="Phoenix"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firm State</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                    placeholder="Arizona"
                  />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Firm Zip Code</label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                    placeholder="99999"
                  />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="At least 10 characters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 placeholder-gray-400"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="mb-8">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 border border-gray-300 rounded focus:ring-2 focus:ring-[#0284C7]"
                />
                <span className="ml-3 text-sm text-gray-600">
                  I agree to the BBSynr Terms of Service and Privacy Policy
                </span>
              </label>
            </div>

            <button
              onClick={handleFormSubmit}
              className="w-full py-3 px-4 bg-[#0284C7] text-white font-semibold rounded-lg hover:bg-[#0369A1] transition-colors"
            >
              Next: Add Signature
            </button>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/login')}
                className="text-[#0284C7] hover:underline font-medium"
              >
                Sign in
              </button>
            </p>
          </div>
        )}

        {/* STEP 2: SIGNATURE & PLAN */}
        {step === 'signature' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Signature Required</h2>
            <p className="text-gray-600 mb-8">
              Please sign below. Your signature is required for real estate forms and confirms you agree to BBSynr terms.
            </p>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            {/* Signature Canvas */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Signature</label>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                <canvas
                  ref={canvasRef}
                  width={400}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full bg-white cursor-crosshair touch-none block"
                  style={{ touchAction: 'none' }}
                />
              </div>
              {hasSignature && (
                <button
                  onClick={clearSignature}
                  className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Clear Signature
                </button>
              )}
            </div>

            {/* Plan Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-4">Select Your Plan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handlePlanSelect('monthly')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedPlan === 'monthly'
                      ? 'border-[#0284C7] bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Monthly</div>
                  <div className="text-2xl font-bold text-[#0284C7]">$0.99</div>
                  <div className="text-xs text-gray-500">per month</div>
                </button>

                <button
                  onClick={() => handlePlanSelect('annual')}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedPlan === 'annual'
                      ? 'border-[#0284C7] bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-gray-900">Annual</div>
                  <div className="text-2xl font-bold text-[#0284C7]">$10</div>
                  <div className="text-xs text-gray-500">per year (Save 16%)</div>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('form')}
                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSignatureSubmit}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-[#0284C7] text-white font-semibold rounded-lg hover:bg-[#0369A1] disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT */}
        {step === 'payment' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complete Your Payment</h2>
            
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Order Summary</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {selectedPlan === 'monthly' ? 'Monthly Plan' : 'Annual Plan'}
                </span>
                <span className="font-semibold text-gray-900">
                  {selectedPlan === 'monthly' ? '$0.99' : '$10.00'}
                </span>
              </div>
            </div>

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                {error}
              </div>
            )}

            <p className="text-gray-600 mb-8 text-sm">
              You will be redirected to Stripe to complete your payment securely.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('signature')}
                className="flex-1 py-3 px-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handlePayment}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-[#0284C7] text-white font-semibold rounded-lg hover:bg-[#0369A1] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    Pay {selectedPlan === 'monthly' ? '$0.99' : '$10.00'}
                  </>
                )}
              </button>
            </div>

            <p className="text-center text-xs text-gray-500 mt-4">
              💳 Secure payment powered by Stripe (Test Mode)
            </p>
          </div>
        )}



        {/* STEP 4: SUCCESS */}
        {step === 'success' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <svg className="w-16 h-16 text-green-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to BBSynr!</h2>
            <p className="text-gray-600 mb-8">
              Your account has been created and activated. You're ready to start managing real estate documents.
            </p>
            <button
              onClick={handleGoToClients}
              className="px-8 py-3 bg-[#0284C7] text-white font-semibold rounded-lg hover:bg-[#0369A1]"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
