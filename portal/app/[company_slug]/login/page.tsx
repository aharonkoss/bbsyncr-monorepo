'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation'; 
import { useAuthStore } from '@/lib/store/authStore'; 
import toast from 'react-hot-toast';
import { useCompany } from '@/contexts/CompanyContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { company, loading: companyLoading } = useCompany();
  const params = useParams(); // ADD THIS
  const companySlug = params.company_slug as string; // ADD THIS
  const login = useAuthStore((state) => state.login); // ADD THIS 
  
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Just use the authStore login instead of apiClient directly
      await login(email.toLowerCase().trim(), password);
      
      const user = useAuthStore.getState().user;
      
      toast.success('Login successful!');
      console.log('✅ Login successful:', user);

      // Redirect to dashboard with company slug
      if(company?.subdomain) {
        router.push(`/${company?.subdomain}/dashboard`);
      } else {
        toast.error('No company assigned to your account');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 'Login failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Company Logo & Name */}
        <div className="text-center">
          {company?.logo_url ? (
            <img
              src={company.logo_url}
              alt={`${company.company_name} logo`}
              className="mx-auto h-20 w-auto mb-4"
            />
          ) : (
            <div
              className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: company?.primary_color || '#3b82f6' }}
            >
              <span className="text-3xl font-bold text-white">
                {company?.company_name?.charAt(0) || 'B'}
              </span>
            </div>
          )}
          <h2 className="text-3xl font-extrabold text-gray-900">
            {company?.company_name || 'BBsynr Portal'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
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
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a
                href={`/${company?.subdomain}/forgot-password`}
                className="font-medium hover:opacity-80"
                style={{ color: company?.primary_color || '#3b82f6' }}
              >
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: company?.primary_color || '#3b82f6',
              }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Back to company selection */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to company selection
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
