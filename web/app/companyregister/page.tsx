'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { loadStripe } from '@stripe/stripe-js';
import TermsModal from './TermsModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CompanyRegisterContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get('id');
  const signaturePadRef = useRef<SignatureCanvas>(null);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Registration data
  const [registration, setRegistration] = useState<any>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    realtor_name: '',
    email: '',
    realtor_phone: '',
    password: '',
    confirmPassword: '',
    realtor_company: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  // Files
  const [buyerBrokerAgreement, setBuyerBrokerAgreement] = useState<File | null>(null);
  const [exclusiveEmploymentAgreement, setExclusiveEmploymentAgreement] = useState<File | null>(null);
  
  // Signature
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // Terms
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Pricing
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  
const plans = {
  monthly: {
    name: 'Monthly Plan',
    price: '$0.99',
    interval: '/month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY as string,
    description: 'Perfect for getting started'
  },
  annual: {
    name: 'Annual Plan',
    price: '$9.99',
    interval: '/year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL as string,
    description: 'Save $2 per year',
    savings: 'Save 17%'
  }
};
console.log('Plans array:', plans);
  // Error state
  const [error, setError] = useState('');

  useEffect(() => {
    if (registrationId) {
      fetchRegistrationData();
    } else {
      setLoading(false);
      setError('Invalid registration link');
    }
  }, [registrationId]);

  const fetchRegistrationData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/agent-registration/${registrationId}`
      );
      const data = await response.json();

      if (response.ok && data.registration) {
        const reg = data.registration;

        // Check if already completed
        if (reg.status === 'completed') {
          setAlreadyRegistered(true);
          setLoading(false);
          return;
        }

        setRegistration(reg);

        // Auto-populate form fields
        setFormData(prev => ({
          ...prev,
          realtor_name: reg.agent_name || '',
          email: reg.agent_email || '',
          realtor_phone: reg.agent_phone || '',
          realtor_company: reg.company?.company_name || ''
        }));
      } else {
        setError(data.error || 'Invalid or expired invitation');
      }
    } catch (err) {
      console.error('Error fetching registration:', err);
      setError('Failed to load registration information');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (type: 'buyer' | 'exclusive', file: File | null) => {
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    if (type === 'buyer') {
      setBuyerBrokerAgreement(file);
      toast.success('Buyer Broker Agreement uploaded');
    } else {
      setExclusiveEmploymentAgreement(file);
      toast.success('Exclusive Employment Agreement uploaded');
    }
  };

  const clearSignature = () => {
    signaturePadRef.current?.clear();
    setSignatureDataUrl('');
  };

  const saveSignature = () => {
    if (signaturePadRef.current?.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }
    const dataUrl = signaturePadRef.current?.toDataURL();
    setSignatureDataUrl(dataUrl || '');
    toast.success('Signature saved');
  };

  const validateForm = () => {
    if (!formData.realtor_name.trim()) {
      toast.error('Name is required');
      return false;
    }

    if (!formData.password || formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (!buyerBrokerAgreement) {
      toast.error('Please upload Buyer Broker Agreement template');
      return false;
    }

    if (!exclusiveEmploymentAgreement) {
      toast.error('Please upload Exclusive Employment Agreement template');
      return false;
    }

    if (!signatureDataUrl) {
      toast.error('Please provide your signature');
      return false;
    }

    if (!termsAccepted) {
      toast.error('Please accept the terms and conditions');
      return false;
    }

    return true;
  };

  const uploadFilesToStorage = async (userId: string) => {
    const formDataUpload = new FormData();
    
    if (buyerBrokerAgreement) {
      formDataUpload.append('buyerBrokerAgreement', buyerBrokerAgreement);
    }
    if (exclusiveEmploymentAgreement) {
      formDataUpload.append('exclusiveEmploymentAgreement', exclusiveEmploymentAgreement);
    }
    formDataUpload.append('userId', userId);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload-templates`, {
      method: 'POST',
      body: formDataUpload
    });

    if (!response.ok) {
      throw new Error('Failed to upload templates');
    }

    return await response.json();
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (!validateForm()) return;

  setSubmitting(true);

  try {
    // Create FormData to send files AND form data together
    const formDataToSend = new FormData();
    
    // Add form fields - IMPORTANT: Use underscores to match backend expectations
    formDataToSend.append('registration_id', registrationId!);
    formDataToSend.append('realtor_name', formData.realtor_name);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('realtor_phone', formData.realtor_phone);
    formDataToSend.append('password', formData.password);
    formDataToSend.append('realtor_company', formData.realtor_company);
    formDataToSend.append('address', formData.address);
    formDataToSend.append('city', formData.city);
    formDataToSend.append('state', formData.state);
    formDataToSend.append('zip', formData.zip);
    formDataToSend.append('signature', signatureDataUrl!);
    
    // Add PDF files - IMPORTANT: Use underscores to match multer field names
    formDataToSend.append('buyer_broker_agreement', buyerBrokerAgreement!);
    formDataToSend.append('exclusive_employment_agreement', exclusiveEmploymentAgreement!);
    // ✅ ADD THIS DEBUG LOG
    console.log('=== FORM DATA BEING SENT ===');
    console.log('realtor_name:', formData.realtor_name);
    console.log('realtor_company:', formData.realtor_company); // ← Check if this is empty
    console.log('email:', formData.email);
    console.log('===========================');
    console.log('📤 Sending registration request...');

    // Step 1: Register user with backend (includes file upload)
    const registerResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/auth/complete-agent-registration`,
      {
        method: 'POST',
        body: formDataToSend, // Send FormData (NOT JSON)
      }
    );

    let registerData;
    try {
      registerData = await registerResponse.json();
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      throw new Error('Server returned an invalid response');
    }

    console.log('📥 Registration response:', registerData);

    if (!registerResponse.ok) {
      // Handle different error response formats
      const errorMessage = 
        registerData?.error || 
        registerData?.message || 
        `Registration failed (${registerResponse.status})`;
      throw new Error(errorMessage);
    }

    // Check if user data exists in response
    if (!registerData.user || !registerData.user.id) {
      console.error('Invalid response structure:', registerData);
      throw new Error('Invalid response from server');
    }

    const userId = registerData.user.id;
    console.log('✅ User registered:', userId);

    // Step 2: Create Stripe checkout session
    const plan = plans[selectedPlan];
    console.log(`plan: ${JSON.stringify(plan)}`);
    console.log('💳 Creating Stripe checkout session...');

    const checkoutResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plan.priceId,
          userId: userId,
          email: formData.email,
        }),
      }
    );

    const checkoutData = await checkoutResponse.json();

    if (!checkoutResponse.ok) {
      throw new Error(checkoutData.error || 'Failed to create checkout session');
    }

    console.log('✅ Checkout session created');

    // Step 3: Redirect to Stripe Checkout
    const stripe = await stripePromise;
    if (!stripe) throw new Error('Stripe failed to load');

    console.log('🔄 Redirecting to Stripe...');

    if (!checkoutData.url) {
        throw new Error('No checkout URL returned from server');
        }

        // Redirect directly using the URL from the session
        window.location.href = checkoutData.url;

  } catch (err: any) {
    console.error('❌ Registration error:', err);
    const errorMessage = err.message || 'Registration failed';
    setError(errorMessage);
    toast.error(errorMessage);
  } finally {
    setSubmitting(false);
  }
};


  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration...</p>
        </div>
      </div>
    );
  }

  // Already registered state
  if (alreadyRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Already Registered</h2>
          <p className="text-gray-600 mb-6">
            This invitation has already been used to create an account.
          </p>
          <button
            onClick={() => router.push('/login')}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !registration) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invitation</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to BBsynr!
          </h1>
          <p className="text-lg text-gray-600">
            You've been invited by <strong>{registration?.manager?.name}</strong> from{' '}
            <strong>{registration?.company?.company_name}</strong>
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Complete your registration and start managing real estate documents
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.realtor_name}
                    onChange={(e) => setFormData({ ...formData, realtor_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    disabled
                    value={formData.email}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.realtor_phone}
                    onChange={(e) => setFormData({ ...formData, realtor_phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                    <input
                        type="text"
                        value={formData.realtor_company}
                        onChange={(e) => setFormData({ ...formData, realtor_company: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Create Password
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="At least 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Address (Optional)
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Template Upload */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">
                Agreement Templates <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please upload your blank agreement forms. These will be used as templates for client documents.
              </p>
              
              <div className="space-y-4">
                {/* Buyer Broker Agreement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buyer Broker Agreement
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload('buyer', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {buyerBrokerAgreement && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {buyerBrokerAgreement.name} ({(buyerBrokerAgreement.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
                </div>

                {/* Exclusive Employment Agreement */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exclusive Employment Agreement
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileUpload('exclusive', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                  {exclusiveEmploymentAgreement && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ {exclusiveEmploymentAgreement.name} ({(exclusiveEmploymentAgreement.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
                </div>
              </div>
            </div>

            {/* Pricing Plans */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">
                Choose Your Plan
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Object.entries(plans).map(([key, plan]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedPlan(key as 'monthly' | 'annual')}
                    className={`relative rounded-lg border-2 p-6 cursor-pointer transition-all ${
                      selectedPlan === key
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {plan.savings && (
                      <span className="absolute top-0 right-0 -translate-y-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        {plan.savings}
                      </span>
                    )}
                    <div className="text-center">
                      <h4 className="text-lg font-semibold text-gray-900">{plan.name}</h4>
                      <p className="mt-2 text-4xl font-bold text-gray-900">
                        {plan.price}
                        <span className="text-sm font-normal text-gray-600">{plan.interval}</span>
                      </p>
                      <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Signature */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">
                Your Signature <span className="text-red-500">*</span>
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Please sign below. Your signature is required for real estate forms and confirms you agree to BBSynr terms.
              </p>
              
              <div className="border-2 border-gray-300 rounded-lg bg-white">
                <SignatureCanvas
                  ref={signaturePadRef}
                  canvasProps={{
                    className: 'w-full h-40 rounded-lg',
                  }}
                />
              </div>
              
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Signature
                </button>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div>
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="font-medium text-gray-700">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:text-blue-500 underline"
                    >
                      Terms and Conditions
                    </button>
                  </label>
                  <p className="text-gray-500">
                    Click the link above to review and accept our terms
                  </p>
                </div>
              </div>
              {!termsAccepted && (
                <p className="mt-2 text-sm text-red-600">
                  Please agree to the terms to continue
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || !termsAccepted}
                className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Complete Registration & Subscribe'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </a>
            </div>
          </form>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          setTermsAccepted(true);
          setShowTermsModal(false);
        }}
      />
    </div>
  );
}

export default function CompanyRegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <CompanyRegisterContent />
    </Suspense>
  );
}
