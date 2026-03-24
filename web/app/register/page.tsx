'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { loadStripe } from '@stripe/stripe-js';
import TermsModal from './TermsModal';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signatureRef = useRef<SignatureCanvas>(null);

  const [realtorName, setRealtorName] = useState('');
  const [realtorCompany, setRealtorCompany] = useState('');
  const [realtorPhone, setRealtorPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [buyerBrokerAgreement, setBuyerBrokerAgreement] = useState<File | null>(null);
  const [exclusiveEmploymentAgreement, setExclusiveEmploymentAgreement] = useState<File | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    // Remove the router.replace('/login') - this was redirecting everyone away from register!
  }, []);

  const plans: {
  id: string;
  name: string;
  price: string;
  savings?: string;
}[] = [
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY as string,
      name: 'Monthly Plan',
      price: '$0.99/month',
      savings: 'Try it out for just $0.99! Cancel anytime.',
    },
    {
      id: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL as string,
      name: 'Annual Plan',
      price: '$9.99/year',
      savings: 'Save $2!',
    },
  ];

  const validatePDFFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') return 'File must be a PDF';
    if (file.size > 10485760) return 'File size must be less than 10MB';
    return null;
  };

  const handleBuyerBrokerAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const err = validatePDFFile(file);
      if (err) { setError(err); e.target.value = ''; return; }
      setBuyerBrokerAgreement(file);
      setError('');
    }
  };

  const handleExclusiveEmploymentAgreementChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const err = validatePDFFile(file);
      if (err) { setError(err); e.target.value = ''; return; }
      setExclusiveEmploymentAgreement(file);
      setError('');
    }
  };

  const handleTermsAgree = () => setAgreedToTerms(true);

  const handleStep1Submit = () => {
    setError('');
    if (!realtorName.trim() || !realtorCompany.trim() || !realtorPhone.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields'); return;
    }
    if (!address.trim() || !city.trim() || !state.trim() || !zip.trim()) {
      setError('Please fill in all address fields'); return;
    }
    if (!buyerBrokerAgreement) { setError('Please upload your Buyer Broker Agreement PDF'); return; }
    if (!exclusiveEmploymentAgreement) { setError('Please upload your Exclusive Employment Agreement PDF'); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) { setError('Please enter a valid email address'); return; }
    if (password.length < 10) { setError('Password must be at least 10 characters long'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (!selectedPlan) { setError('Please select a subscription plan'); return; }
    setStep(2);
  };

  const handleRegisterAndCheckout = async () => {
    setError('');
    setLoading(true);
    try {
      if (!signatureRef.current || signatureRef.current.isEmpty()) {
        setError('Please provide your signature'); setLoading(false); return;
      }
      if (!agreedToTerms) {
        setError('Please agree to the BBsynr Terms of Use'); setLoading(false); return;
      }
      const signatureData = signatureRef.current.toDataURL();
      const formData = new FormData();
      formData.append('realtorName', realtorName);
      formData.append('realtorCompany', realtorCompany);
      formData.append('realtorPhone', realtorPhone);
      formData.append('email', email);
      formData.append('password', password);
      formData.append('agent_signature', signatureData);
      formData.append('priceId', selectedPlan!);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('state', state);
      formData.append('zip', zip);
      formData.append('buyer_broker_agreement', buyerBrokerAgreement!);
      formData.append('exclusive_employment_agreement', exclusiveEmploymentAgreement!);

      const registerResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        body: formData,
      });
      const registerData = await registerResponse.json();
      if (!registerResponse.ok) throw new Error(registerData.error || 'Registration failed');

      const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: selectedPlan, email, userId: registerData.user.id }),
      });
      const checkoutData = await checkoutResponse.json();
      if (!checkoutData.sessionId || !checkoutData.url) throw new Error(checkoutData.error || 'Failed to create checkout session');
      window.location.href = checkoutData.url;
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Join BBSynr</h1>
          <p className="text-gray-600">and start managing real estate documents</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>1</div>
              <span className="ml-2 font-medium hidden sm:inline">Account Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-200"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="ml-2 font-medium hidden sm:inline">Signature & Terms</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" value={realtorName} onChange={(e) => setRealtorName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="John Doe" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company <span className="text-red-500">*</span></label>
                  <input type="text" value={realtorCompany} onChange={(e) => setRealtorCompany(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="ABC Realty" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone <span className="text-red-500">*</span></label>
                  <input type="tel" value={realtorPhone} onChange={(e) => setRealtorPhone(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="(555) 123-4567" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-red-500">*</span></label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="john@example.com" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Min. 10 characters" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Re-enter password" required />
                </div>
              </div>
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Address</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Street Address <span className="text-red-500">*</span></label>
                    <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="123 Main Street" required />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">City <span className="text-red-500">*</span></label>
                      <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Los Angeles" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">State <span className="text-red-500">*</span></label>
                      <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="CA" maxLength={2} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code <span className="text-red-500">*</span></label>
                      <input type="text" value={zip} onChange={(e) => setZip(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="90001" maxLength={5} required />
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Agreement Templates</h3>
                <p className="text-sm text-gray-600 mb-4">Please upload your blank agreement forms. These will be used as templates for client documents.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Buyer Broker Agreement (Non-Exclusive) <span className="text-red-500">*</span></label>
                    <input type="file" accept=".pdf" onChange={handleBuyerBrokerAgreementChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    {buyerBrokerAgreement && <p className="mt-2 text-sm text-green-600">✓ {buyerBrokerAgreement.name} ({(buyerBrokerAgreement.size / 1024 / 1024).toFixed(2)} MB)</p>}
                    <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exclusive Employment Agreement <span className="text-red-500">*</span></label>
                    <input type="file" accept=".pdf" onChange={handleExclusiveEmploymentAgreementChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    {exclusiveEmploymentAgreement && <p className="mt-2 text-sm text-green-600">✓ {exclusiveEmploymentAgreement.name} ({(exclusiveEmploymentAgreement.size / 1024 / 1024).toFixed(2)} MB)</p>}
                    <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
                  </div>
                </div>
              </div>
              <div className="border-t pt-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Your Plan</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {plans.map((plan) => (
                    <div key={plan.id} onClick={() => setSelectedPlan(plan.id)} className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${selectedPlan === plan.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}>
                      {plan.savings && <span className="absolute top-2 right-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">{plan.savings}</span>}
                      <h4 className="font-semibold text-gray-900 text-lg">{plan.name}</h4>
                      <p className="text-2xl font-bold text-blue-600 mt-2">{plan.price}</p>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={handleStep1Submit} className="w-full py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Continue to Signature
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Signature & Terms</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature <span className="text-red-500">*</span></label>
                <p className="text-sm text-gray-600 mb-4">Please sign below. Your signature is required for real estate forms and confirms you agree to BBSynr terms.</p>
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <SignatureCanvas ref={signatureRef} canvasProps={{ className: 'w-full h-48 bg-white' }} />
                </div>
                <button onClick={() => signatureRef.current?.clear()} className="mt-2 text-sm text-blue-600 hover:text-blue-700">Clear Signature</button>
              </div>
              <div className="border-t pt-6">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="terms" type="checkbox" checked={agreedToTerms} readOnly className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      I agree to the{' '}
                      <button type="button" onClick={() => setShowTermsModal(true)} className="text-blue-600 hover:text-blue-700 underline font-semibold">BBsynr Terms of Use</button>
                      <span className="text-red-500"> *</span>
                    </label>
                    <p className="text-gray-500 mt-1">Click the link above to review and accept our terms</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 pt-6">
                <button onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors">Back</button>
                <button onClick={handleRegisterAndCheckout} disabled={loading || !agreedToTerms} className={`flex-1 py-4 font-semibold rounded-lg transition-colors ${loading || !agreedToTerms ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  {loading ? 'Processing...' : 'Complete Registration & Pay'}
                </button>
              </div>
              {!agreedToTerms && <p className="text-sm text-red-600 text-center">Please agree to the terms to continue</p>}
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-gray-600">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">Sign in</a>
        </p>
      </div>

      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} onAgree={handleTermsAgree} />
    </div>
  );
}