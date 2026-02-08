'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import toast from 'react-hot-toast';
import { useCompany } from '@/contexts/CompanyContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { company, loading: companyLoading } = useCompany();
  const params = useParams();
  const company_slug = params.company_slug as string;
  const login = useAuthStore((state) => state.login);

  const handleLogin = async (e: FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    await login(email.toLowerCase().trim(), password);
    
    const authState = useAuthStore.getState();
    const user = authState.user;

    console.log('✅ Login successful');
    console.log('👤 User:', user);
    console.log('🏢 Company slug from URL:', company_slug);

    toast.success('Login successful!');

    // ✅ Check user role
    if (user?.role === 'global_admin') {
      // ✅ Global admin: redirect to dashboard of CURRENT company (from URL)
      console.log(`🚀 Global admin redirecting to: /${company_slug}/dashboard`);
      router.push(`/${company_slug}/dashboard`);
    } else if (user?.company?.subdomain) {
      // ✅ Regular user: redirect to their company dashboard
      console.log(`🚀 Redirecting to: /${user.company.subdomain}/dashboard`);
      router.push(`/${user.company.subdomain}/dashboard`);
    } else {
      console.error('❌ No company found for user');
      toast.error('No company assigned. Please contact support.');
    }
  } catch (error: any) {
    console.error('❌ Login error:', error);
    const errorMessage = error.response?.data?.error || 'Invalid email or password';
    toast.error(errorMessage);
  } finally {
    setLoading(false);
  }
};


  // Loading state while fetching company data
  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If company not found for this company_slug
  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Company Not Found</h2>
          <p className="text-gray-600">
            The company you're looking for doesn't exist or has been disabled.
          </p>
          <Link
            href="/"
            className="inline-block text-blue-600 hover:text-blue-500 font-medium"
          >
            ← Back to company selection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Company Logo & Name */}
        <div className="text-center">
          {company.logo_url ? (
            <div className="flex justify-center mb-4">
              <img
                src={company.logo_url}
                alt={company.company_name || 'Company Logo'}
                className="h-16 w-auto object-contain"
              />
            </div>
          ) : (
            <div className="flex justify-center mb-4">
              {/* Circular fallback logo with company initials */}
              <div 
                className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: company.primary_color || '#1a9aff' }}
              >
                {company.company_name && company.company_name.length >= 2 
                  ? company.company_name.substring(0, 2).toUpperCase() 
                  : 'BB'}
              </div>
            </div>
          )}
          
          <h2 className="text-3xl font-bold text-gray-900">
            {company.company_name || 'BBsynr'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm space-y-px">
            {/* Email Input */}
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-t-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-b-md relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5"
                tabIndex={-1}
              >
                <span className="text-2xl">{showPassword ? '👁️‍🗨️' : '👁️'}</span>
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link
                href={`/${company_slug}/forgot-password`}
                className="font-medium hover:opacity-80"
                style={{ color: company.primary_color || '#1a9aff' }}
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{
                backgroundColor: company.primary_color || '#1a9aff',
              }}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          {/* Back to Company Selection */}
          <div className="text-center">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to company selection
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
