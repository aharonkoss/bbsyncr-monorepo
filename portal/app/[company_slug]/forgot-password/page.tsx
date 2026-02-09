'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CompanyBranding {
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  subdomain: string;
}

export default function ForgotPasswordPage() {
  const params = useParams();
  const companySlug = params.company_slug as string;
  
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
      console.log('🎨 Forgot password page - Fetching branding for:', companySlug);
      
      if (!companySlug) {
        setBrandingLoading(false);
        return;
      }

      // Fetch company branding using company_slug from URL
      const { data } = await apiClient.get(`/api/portal/companies/subdomain/${companySlug}`);
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
      await apiClient.post('/api/portal/auth/forgot-password', { 
        email,
        company_slug: companySlug 
      });
      setSubmitted(true);
      toast.success('Password reset link sent to your email!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  // Success message after submission
  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Logo - DOUBLED SIZE: h-16 to h-32 */}
          {brandingLoading ? (
            <div className="flex justify-center">
              <div className="h-32 w-32 bg-gray-200 animate-pulse rounded-full"></div>
            </div>
          ) : branding?.logo_url ? (
            <div className="flex justify-center">
              <img
                src={branding.logo_url}
                alt={branding.company_name}
                className="h-32 w-auto"
              />
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-32 w-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {branding?.company_name?.charAt(0) || 'B'}
              </div>
            </div>
          )}

          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Check Your Email</h2>
            <p className="text-gray-600 mb-2">
              We've sent a password reset link to
            </p>
            <p className="font-semibold text-gray-900 mb-4">{email}</p>
            <p className="text-sm text-gray-500">
              Check your inbox and click the link to reset your password.
            </p>
          </div>

          {/* Back to login with company_slug */}
          <div className="text-center">
            <Link
              href={`/${companySlug}/login`}
              className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main forgot password form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo - DOUBLED SIZE: h-16 to h-32 */}
        {brandingLoading ? (
          <div className="flex justify-center">
            <div className="h-32 w-32 bg-gray-200 animate-pulse rounded-full"></div>
          </div>
        ) : branding?.logo_url ? (
          <div className="flex justify-center">
            <img
              src={branding.logo_url}
              alt={branding.company_name}
              className="h-32 w-auto"
            />
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="h-32 w-32 bg-blue-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
              {branding?.company_name?.charAt(0) || 'B'}
            </div>
          </div>
        )}

        {/* Title */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Forgot Your Password?</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
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
              placeholder="you@example.com"
            />
          </div>

          {/* Submit button - Primary color background with black text */}
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            style={{
              backgroundColor: branding?.primary_color || '#3B82F6',
              color: '#000000',
            }}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>

          {/* Back to login with company_slug */}
          <div className="text-center">
            <Link
              href={`/${companySlug}/login`}
              className="text-sm text-gray-600 hover:text-gray-900 inline-flex items-center"
            >
              <svg
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
