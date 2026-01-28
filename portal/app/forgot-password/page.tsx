'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CompanyBranding {
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    try {
      const hostname = window.location.hostname;
      let subdomain = null;

      // Extract subdomain
      if (hostname.includes('localhost')) {
        const parts = hostname.split('.');
        if (parts.length >= 2 && parts[0] !== 'localhost') {
          subdomain = parts[0];
        }
      } else {
        const parts = hostname.split('.');
        if (parts.length >= 3) {
          subdomain = parts[0];
        }
      }

      console.log('🎨 Forgot password page - Fetching branding for subdomain:', subdomain);

      if (!subdomain) {
        setBrandingLoading(false);
        return;
      }

      // Fetch company branding
      const { data } = await apiClient.get(`/companies/subdomain/${subdomain}`);
      console.log('✅ Branding loaded:', data.company);
      setBranding(data.company);
    } catch (error) {
      console.error('❌ Failed to fetch branding:', error);
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo */}
          {brandingLoading ? (
            <div className="flex justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          ) : branding?.logo_url ? (
            <img
              className="mx-auto h-12 w-auto"
              src={branding.logo_url}
              alt={branding.company_name}
            />
          ) : (
            <img
              className="mx-auto h-12 w-auto"
              src="https://app.bbsynr.com/_next/image?url=%2Flogo.png&w=1200&q=75"
              alt="BBsynr Portal"
            />
          )}

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Check Your Email</h2>
            <p className="mt-4 text-gray-600">
              We've sent a password reset link to
            </p>
            <p className="mt-2 font-semibold text-gray-900">{email}</p>
            <p className="mt-4 text-sm text-gray-500">
              Check your inbox and click the link to reset your password.
            </p>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        {brandingLoading ? (
          <div className="flex justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          </div>
        ) : branding?.logo_url ? (
          <img
            className="mx-auto h-12 w-auto"
            src={branding.logo_url}
            alt={branding.company_name}
          />
        ) : (
          <img
            className="mx-auto h-12 w-auto"
            src="https://app.bbsynr.com/_next/image?url=%2Flogo.png&w=1200&q=75"
            alt="BBsynr Portal"
          />
        )}

        {/* Title */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Forgot Your Password?
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-0 py-3 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
              style={{
                '--tw-ring-color': branding?.primary_color || '#3b82f6'
              } as React.CSSProperties}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md px-3 py-3 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
               '--tw-ring-color': branding?.primary_color || '#3b82f6'
            } as React.CSSProperties}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to login */}
          <div className="text-center">
            <Link
              href="/login"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
