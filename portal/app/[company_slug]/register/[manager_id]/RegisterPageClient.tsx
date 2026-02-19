'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import SignatureCanvas from 'react-signature-canvas';
import { CheckCircleIcon, UserCircleIcon, EnvelopeIcon, PhoneIcon, BriefcaseIcon } from '@heroicons/react/24/outline';
import TermsModal from '@/components/register/TermsModal';

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  title: string;
  profile_picture_url: string | null; // ✅ Fixed field name
}

interface Company {
  id: string;
  name: string;
  subdomain: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  location: string;
}

interface RegistrationData {
  manager: Manager;
  company: Company;
}

export default function AgentRegistrationPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.company_slug as string;
  const managerId = params.manager_id as string;
  const signaturePadRef = useRef<SignatureCanvas>(null);

  const [loading, setLoading] = useState(true);
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    termsAccepted: false,
  });

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const [buyerBrokerAgreement, setBuyerBrokerAgreement] = useState<File | null>(null);
  const [exclusiveEmploymentAgreement, setExclusiveEmploymentAgreement] = useState<File | null>(null);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  // ✅ Correct pricing
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

  useEffect(() => {
    fetchRegistrationData();
  }, [managerId]);

  const fetchRegistrationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/managers/${managerId}/registration-info`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load registration information');
      }

      const data = await response.json();
      setRegistrationData(data);

      if (data.company?.name) {
        setFormData((prev) => ({ ...prev, company: data.company.name }));
      }
    } catch (error: any) {
      console.error('Error fetching registration data:', error);
      toast.error(error.message || 'Failed to load registration page');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileUpload = (type: 'buyer' | 'exclusive', file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

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

  const validateStep1 = (): boolean => {
    if (!formData.name.trim()) {
      toast.error('Please enter your full name');
      return false;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    if (!formData.termsAccepted) {
      toast.error('Please accept the Terms of Service');
      return false;
    }

    return true;
  };

  const validateStep2 = (): boolean => {
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

    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep2()) return;
    if (!registrationData) return;

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('realtorName', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('realtorPhone', formData.phone);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('realtorCompany', formData.company || registrationData.company.name);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('state', formData.state);
      formDataToSend.append('zip', formData.zip);
      formDataToSend.append('agent_signature', signatureDataUrl);
      formDataToSend.append('buyer_broker_agreement', buyerBrokerAgreement!);
      formDataToSend.append('exclusive_employment_agreement', exclusiveEmploymentAgreement!);

      const priceId = selectedPlan === 'monthly'
        ? process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY
        : process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL;
      formDataToSend.append('priceId', priceId || '');

      console.log('📤 Sending registration request...');

      const registerResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
        {
          method: 'POST',
          body: formDataToSend,
        }
      );

      if (!registerResponse.ok) {
        let errorData;
        try {
          errorData = await registerResponse.json();
        } catch (parseError) {
          throw new Error(`Registration failed with status ${registerResponse.status}`);
        }
        throw new Error(errorData.error || errorData.details || 'Registration failed');
      }

      const registerData = await registerResponse.json();
      const userId = registerData.user?.id;

      if (!userId) {
        throw new Error('User ID not returned from registration');
      }

      console.log('✅ User registered:', userId);
      console.log('💳 Creating Stripe checkout session...');

      const checkoutResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/portal/payments/create-portal-checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            email: formData.email,
            priceId: priceId,
            managerId: registrationData.manager.id,
            companyId: registrationData.company.id,
          }),
        }
      );

      if (!checkoutResponse.ok) {
        const errorData = await checkoutResponse.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await checkoutResponse.json();
      window.location.href = url;

    } catch (err: any) {
      console.error('❌ Registration error:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registration...</p>
        </div>
      </div>
    );
  }

  if (!registrationData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid Registration Link</h3>
          <p className="mt-2 text-sm text-gray-500">
            This registration link is no longer valid or has expired.
          </p>
        </div>
      </div>
    );
  }

  const { manager, company } = registrationData;

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Mobile-First Container */}
        <div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          
          {/* Manager Business Card */}
          <div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
            style={{ borderTop: `4px solid ${company.primary_color}` }}
          >
            {/* Company Logo */}
            <div className="bg-gradient-to-r from-gray-50 to-white p-4 border-b border-gray-100">
              <div className="flex items-center justify-center">
                {company.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.name}
                    className="h-10 sm:h-12 w-auto object-contain"
                  />
                ) : (
                  <div
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center text-white font-bold text-lg sm:text-xl"
                    style={{ backgroundColor: company.primary_color }}
                  >
                    {company.name.charAt(0)}
                  </div>
                )}
              </div>
            </div>

            {/* Manager Info - Business Card Layout */}
            <div className="p-4 sm:p-6">
              <div className="flex items-start space-x-3 sm:space-x-4">
                {/* Left: Square Profile Picture */}
                <div className="flex-shrink-0">
                  {manager.profile_picture_url ? (
                    <img
                      src={manager.profile_picture_url}
                      alt={manager.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shadow-md"
                    />
                  ) : (
                    <div
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg flex items-center justify-center shadow-md"
                      style={{ backgroundColor: `${company.primary_color}20` }}
                    >
                      <UserCircleIcon 
                        className="w-10 h-10 sm:w-12 sm:h-12" 
                        style={{ color: company.primary_color }}
                      />
                    </div>
                  )}
                </div>

                {/* Right: Contact Info */}
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                    {manager.name}
                  </h2>
                 {/* ✅ STYLED INVITATION TEXT */}
                <div 
                    className="inline-block px-3 py-1 rounded-full text-xs sm:text-sm font-medium mb-3"
                    style={{ 
                    backgroundColor: `${company.primary_color}15`,
                    color: company.primary_color 
                    }}
                >
                    ✨ You're invited to join the team
                </div> 
                  {manager.title && (
                    <div className="flex items-center text-gray-600 mb-2 sm:mb-3">
                      <BriefcaseIcon className="w-4 h-4 mr-1.5 flex-shrink-0" />
                      <span className="text-xs sm:text-sm">{manager.title}</span>
                    </div>
                  )}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center text-gray-700">
                      <EnvelopeIcon className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
                      <a 
                        href={`mailto:${manager.email}`}
                        className="text-xs sm:text-sm hover:underline truncate"
                      >
                        {manager.email}
                      </a>
                    </div>
                    {manager.phone && (
                      <div className="flex items-center text-gray-700">
                        <PhoneIcon className="w-4 h-4 mr-1.5 flex-shrink-0 text-gray-400" />
                        <a 
                          href={`tel:${manager.phone}`}
                          className="text-xs sm:text-sm hover:underline"
                        >
                          {manager.phone}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Powered by BBsynr Badge */}
            <div className="bg-gray-50 px-4 py-2.5 sm:px-6 sm:py-3 border-t border-gray-100">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <span>Powered by</span>
                <span className="ml-1 font-semibold text-blue-600">BBsynr</span>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
            {/* Progress Steps - Mobile Optimized */}
            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold text-sm sm:text-base ${
                      currentStep >= 1 ? 'text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                    style={{ backgroundColor: currentStep >= 1 ? company.primary_color : undefined }}
                  >
                    {currentStep > 1 ? <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : '1'}
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className={`text-xs sm:text-sm font-medium ${currentStep >= 1 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Basic Info
                    </p>
                  </div>
                </div>

                <div 
                  className="flex-1 h-1 mx-2 sm:mx-4 rounded max-w-[60px] sm:max-w-none"
                  style={{ backgroundColor: currentStep >= 2 ? company.primary_color : '#E5E7EB' }}
                />

                <div className="flex items-center flex-1">
                  <div
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-semibold text-sm sm:text-base ${
                      currentStep >= 2 ? 'text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                    style={{ backgroundColor: currentStep >= 2 ? company.primary_color : undefined }}
                  >
                    2
                  </div>
                  <div className="ml-2 sm:ml-3">
                    <p className={`text-xs sm:text-sm font-medium ${currentStep >= 2 ? 'text-gray-900' : 'text-gray-500'}`}>
                      Documents
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleNextStep(); }} className="space-y-5 sm:space-y-6">
                <div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Create Your Account</h3>
                <p className="text-gray-600 text-sm">Join {company.name} and start managing your real estate documents</p>
                </div>

                {/* Personal Information */}
                <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Personal Information</h4>
                <div className="space-y-4">
                    <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                    </label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        style={{ outlineColor: company.primary_color }}
                        placeholder="John Doe"
                    />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                        </label>
                        <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="john@example.com"
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                        </label>
                        <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="(555) 123-4567"
                        />
                    </div>
                    </div>

                    <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name
                    </label>
                    <input
                        type="text"
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder={company.name}
                    />
                    </div>
                </div>
                </div>

                {/* Password */}
                <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Create Password</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        required
                        minLength={8}
                        value={formData.password}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="Minimum 8 characters"
                    />
                    </div>

                    <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm Password *
                    </label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="Re-enter password"
                    />
                    </div>
                </div>
                </div>

                {/* Address (Optional) */}
                <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Address (Optional)</h4>
                <div className="space-y-4">
                    <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                    </label>
                    <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="123 Main St"
                    />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        City
                        </label>
                        <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="Phoenix"
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                        State
                        </label>
                        <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="AZ"
                        maxLength={2}
                        />
                    </div>

                    <div className="sm:col-span-1">
                        <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                        </label>
                        <input
                        type="text"
                        id="zip"
                        name="zip"
                        value={formData.zip}
                        onChange={handleInputChange}
                        className="block w-full px-4 py-3 text-base rounded-lg border border-gray-300 focus:ring-2 focus:border-transparent transition-all text-gray-900"
                        placeholder="85001"
                        maxLength={5}
                        />
                    </div>
                    </div>
                </div>
                </div>

                {/* Plan Selection - Mobile Optimized */}
                <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b">Select Your Plan *</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* Monthly Plan */}
                    <div
                    onClick={() => setSelectedPlan('monthly')}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        selectedPlan === 'monthly' ? 'shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ borderColor: selectedPlan === 'monthly' ? company.primary_color : undefined }}
                    >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">Monthly</span>
                        {selectedPlan === 'monthly' && (
                        <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: company.primary_color }} />
                        )}
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        $0.99<span className="text-sm text-gray-500">/mo</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Perfect for getting started</p>
                    </div>

                    {/* Annual Plan */}
                    <div
                    onClick={() => setSelectedPlan('annual')}
                    className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        selectedPlan === 'annual' ? 'shadow-lg' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{ borderColor: selectedPlan === 'annual' ? company.primary_color : undefined }}
                    >
                    <div className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        Save 17%
                    </div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-base sm:text-lg font-semibold text-gray-900">Annual</span>
                        {selectedPlan === 'annual' && (
                        <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: company.primary_color }} />
                        )}
                    </div>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                        $9.99<span className="text-sm text-gray-500">/yr</span>
                    </p>
                    <p className="text-xs text-green-600 font-medium mt-1">Save $2/year</p>
                    </div>
                </div>
                </div>

                {/* Terms */}
                <div className="flex items-start">
                <input
                    type="checkbox"
                    id="termsAccepted"
                    name="termsAccepted"
                    checked={formData.termsAccepted}
                    onChange={handleInputChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300"
                    style={{ accentColor: company.primary_color }}
                />
                <label htmlFor="termsAccepted" className="ml-3 text-sm text-gray-600">
                    I accept the{' '}
                    <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="font-medium hover:underline"
                    style={{ color: company.primary_color }}
                    >
                    Terms of Service
                    </button>
                    {' '}and Privacy Policy
                </label>
                </div>

                <button
                type="submit"
                className="w-full py-4 px-6 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all text-base sm:text-lg"
                style={{ backgroundColor: company.primary_color }}
                >
                Continue to Documents →
                </button>
            </form>
            )}


            {/* Step 2: Documents & Signature */}
            {currentStep === 2 && (
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Upload Documents & Sign</h3>
                  <p className="text-gray-600 text-sm">Complete your registration by uploading required documents</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Buyer Broker Agreement *
                    </label>
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) => handleFileUpload('buyer', e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white hover:file:opacity-90 file:cursor-pointer"
                        style={{ backgroundColor: company.primary_color }}
                      />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exclusive Employment Agreement *
                    </label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => handleFileUpload('exclusive', e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:text-white hover:file:opacity-90 file:cursor-pointer"
                      style={{ backgroundColor: company.primary_color }}
                    />
                    {exclusiveEmploymentAgreement && (
                      <p className="mt-2 text-sm text-green-600">✓ {exclusiveEmploymentAgreement.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Signature *
                  </label>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden touch-none">
                    <SignatureCanvas
                      ref={signaturePadRef}
                      canvasProps={{
                        className: 'w-full h-40 sm:h-48 bg-white',
                      }}
                    />
                  </div>
                  <div className="flex items-center space-x-3 mt-3">
                    <button
                      type="button"
                      onClick={saveSignature}
                      className="px-4 py-2 text-sm font-medium text-white rounded-lg"
                      style={{ backgroundColor: company.primary_color }}
                    >
                      {signatureDataUrl ? '✓ Saved' : 'Save Signature'}
                    </button>
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 py-4 px-6 font-semibold rounded-lg border-2 hover:bg-gray-50 transition-all"
                    style={{ borderColor: company.primary_color, color: company.primary_color }}
                  >
                    ← Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-4 px-6 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                    style={{ backgroundColor: company.primary_color }}
                  >
                    {submitting ? 'Processing...' : 'Complete Registration & Pay →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
        onAccept={() => {
          setFormData(prev => ({ ...prev, termsAccepted: true }));
          setShowTerms(false);
        }}
      />
    </>
  );
}
