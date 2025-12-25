'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';
import { api, tokenManager } from '@/lib/api';

type UserProfile = {
  id: string;
  realtor_name: string | null;
  realtor_company: string | null;
  realtor_phone: string | null;
  email: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  agent_signature: string | null;
  buyer_broker_agreement_url: string | null;
  exclusive_employment_agreement_url: string | null;
  subscription_status: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const signatureRef = useRef<SignatureCanvas | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [user, setUser] = useState<UserProfile | null>(null);

  // Form state
  const [realtorName, setRealtorName] = useState('');
  const [realtorCompany, setRealtorCompany] = useState('');
  const [realtorPhone, setRealtorPhone] = useState('');
  const [email, setEmail] = useState('');

  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');
  const [zip, setZip] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [buyerBrokerFile, setBuyerBrokerFile] = useState<File | null>(null);
  const [exclusiveEmploymentFile, setExclusiveEmploymentFile] = useState<File | null>(null);

  const [buyerBrokerUrl, setBuyerBrokerUrl] = useState<string | null>(null);
  const [exclusiveEmploymentUrl, setExclusiveEmploymentUrl] = useState<string | null>(null);

  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

  // --- Load current user profile (from your auth storage or API) ---
  useEffect(() => {
    const token = tokenManager.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');

        // Assuming you have an endpoint to get the current user profile.
        // If not, you can decode token and call your own /api/auth/me.
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            tokenManager.clearAll();
            router.push('/login');
            return;
          }
          throw new Error('Failed to load profile');
        }

        const data = (await res.json()) as { user: UserProfile };
        const u = data.user;
        setUser(u);

        setRealtorName(u.realtor_name || '');
        setRealtorCompany(u.realtor_company || '');
        setRealtorPhone(u.realtor_phone || '');
        setEmail(u.email || '');

        setAddress(u.address || '');
        setCity(u.city || '');
        setStateVal(u.state || '');
        setZip(u.zip || '');

        setBuyerBrokerUrl(u.buyer_broker_agreement_url);
        setExclusiveEmploymentUrl(u.exclusive_employment_agreement_url);
        setSubscriptionStatus(u.subscription_status || null);

        setLoading(false);
      } catch (err: any) {
        console.error('Error loading profile:', err);
        setError(err.message || 'Failed to load profile');
        setLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  // --- Signature helpers ---
  const handleClearSignature = () => {
    signatureRef.current?.clear();
  };

  const getSignatureDataUrl = (): string | undefined => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) return undefined;
    return signatureRef.current.toDataURL();
  };

  // --- File validation (reuse registration rules) ---
  const validatePDFFile = (file: File): string | null => {
    if (file.type !== 'application/pdf') return 'File must be a PDF';
    if (file.size > 10 * 1024 * 1024) return 'File size must be less than 10MB';
    return null;
  };

  const handleBuyerBrokerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const errMsg = validatePDFFile(file);
      if (errMsg) {
        setError(errMsg);
        e.target.value = '';
        return;
      }
      setBuyerBrokerFile(file);
      setError('');
    }
  };

  const handleExclusiveEmploymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const errMsg = validatePDFFile(file);
      if (errMsg) {
        setError(errMsg);
        e.target.value = '';
        return;
      }
      setExclusiveEmploymentFile(file);
      setError('');
    }
  };

  // --- Save profile ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user) return;

    // simple validation
    if (!realtorName.trim()) {
      setError('Realtor name is required');
      return;
    }
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 10) {
        setError('New password must be at least 10 characters long');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New password and confirmation do not match');
        return;
      }
    }

    try {
      setSaving(true);

      const token = tokenManager.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const formData = new FormData();
      formData.append('realtorName', realtorName);
      formData.append('realtorCompany', realtorCompany);
      formData.append('realtorPhone', realtorPhone);
      formData.append('email', email);
      formData.append('address', address);
      formData.append('city', city);
      formData.append('state', stateVal);
      formData.append('zip', zip);

      if (newPassword) {
        formData.append('password', newPassword);
      }

      const sigDataUrl = getSignatureDataUrl();
      if (sigDataUrl) {
        formData.append('agent_signature', sigDataUrl);
      }

      if (buyerBrokerFile) {
        formData.append('buyer_broker_agreement', buyerBrokerFile);
      }

      if (exclusiveEmploymentFile) {
        formData.append('exclusive_employment_agreement', exclusiveEmploymentFile);
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      setSuccess('Profile updated successfully');
      setUser(data.user);
      setBuyerBrokerUrl(data.user.buyer_broker_agreement_url);
      setExclusiveEmploymentUrl(data.user.exclusive_employment_agreement_url);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Profile save error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // --- Cancel subscription ---
  const handleCancelSubscription = async () => {
    setError('');
    setSuccess('');

    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    try {
      setCanceling(true);
      const token = tokenManager.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payments/cancel-subscription`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      setSubscriptionStatus('cancelled');
      setSuccess('Subscription cancelled successfully');
    } catch (err: any) {
      console.error('Cancel subscription error:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <p className="text-gray-600 text-lg">Loading profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white">
        <p className="text-gray-600 text-lg">Unable to load profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb  -6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">My Profile</h1>
            <p className="text-gray-600">
              Update your account details, templates, and subscription.
            </p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/clients')}
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium"
          >
            Back to Clients
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mt-6 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}
        {success && (
          <div className="mt-6 mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-4">
          <form className="space-y-8" onSubmit={handleSaveProfile}>
            {/* Account Details */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">Account Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Realtor Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={realtorName}
                    onChange={(e) => setRealtorName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={realtorCompany}
                    onChange={(e) => setRealtorCompany(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={realtorPhone}
                    onChange={(e) => setRealtorPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Address</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    maxLength={2}
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Agreement Templates */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Agreement Templates</h2>
              <p className="text-sm text-gray-600">
                Update your blank agreement PDFs. These will be used as templates for new client
                documents.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buyer Broker Agreement (Non-Exclusive)
                  </label>
                  {buyerBrokerUrl && (
                    <p className="text-sm text-gray-600 mb-1">
                      Current file:{' '}
                      <a
                        href={buyerBrokerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        View current PDF
                      </a>
                    </p>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleBuyerBrokerChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  {buyerBrokerFile && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ New file selected: {buyerBrokerFile.name} (
                      {(buyerBrokerFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exclusive Employment Agreement
                  </label>
                  {exclusiveEmploymentUrl && (
                    <p className="text-sm text-gray-600 mb-1">
                      Current file:{' '}
                      <a
                        href={exclusiveEmploymentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        View current PDF
                      </a>
                    </p>
                  )}
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleExclusiveEmploymentChange}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      cursor-pointer"
                  />
                  {exclusiveEmploymentFile && (
                    <p className="mt-1 text-sm text-green-600">
                      ✓ New file selected: {exclusiveEmploymentFile.name} (
                      {(exclusiveEmploymentFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">PDF only, max 10MB</p>
                </div>
              </div>
            </section>

            {/* Signature */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Agent Signature</h2>
              <p className="text-sm text-gray-600">
                Update the signature used on your real estate forms.
              </p>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <SignatureCanvas
                  ref={signatureRef as any}
                  canvasProps={{ className: 'w-full h-48 bg-white' }}
                />
              </div>
              <button
                type="button"
                onClick={handleClearSignature}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear Signature
              </button>
              <p className="text-xs text-gray-500 mt-1">
                If you do not draw a new signature, the existing one will be kept.
              </p>
            </section>

            {/* Password change */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
              <p className="text-sm text-gray-600">
                Leave these fields blank if you do not want to change your password.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min. 10 characters"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section className="space-y-4 border-t pt-6">
              <h2 className="text-xl font-semibold text-gray-900">Subscription</h2>
              <p className="text-sm text-gray-600 mb-2">
                Current status:{' '}
                <span className="font-semibold">
                  {subscriptionStatus || 'unknown'}
                </span>
              </p>
              <button
                type="button"
                onClick={handleCancelSubscription}
                disabled={canceling || subscriptionStatus === 'cancelled'}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  subscriptionStatus === 'cancelled'
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : canceling
                    ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {subscriptionStatus === 'cancelled'
                  ? 'Subscription Cancelled'
                  : canceling
                  ? 'Cancelling...'
                  : 'Cancel Subscription'}
              </button>
              <p className="text-xs text-gray-500 mt-1">
                Cancelling your subscription will stop future billing. You may lose access to
                premium features after the current billing period.
              </p>
            </section>

            {/* Actions */}
            <section className="pt-6 border-t flex gap-4">
              <button
                type="submit"
                disabled={saving}
                className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                  saving
                    ? 'bg-gray-400 text-gray-100 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/clients')}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </section>
          </form>
        </div>
      </div>
    </div>
  );
}
