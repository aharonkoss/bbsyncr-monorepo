'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { apiClient } from '@/lib/api/client';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; // Add this import

interface CompanyBranding {
  company_name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
}

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Add this state
  const [loading, setLoading] = useState(false);
  const [branding, setBranding] = useState<CompanyBranding | null>(null);
  const [brandingLoading, setBrandingLoading] = useState(true);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

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

      console.log('🎨 Login page - Fetching branding for subdomain:', subdomain);

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
      await login(email, password);
      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

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
            className="mx-auto h-36 w-auto"
            src={branding.logo_url}
            alt={branding.company_name}
          />
        ) : (
          // Use default BBsynr logo when no subdomain
          <img
            className="mx-auto h-36 w-auto"
            src="https://app.bbsynr.com/_next/image?url=%2Flogo.png&w=1200&q=75"
            alt="BBsynr Portal"
          />
        )}

        {/* Title */}
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            {branding?.company_name || 'BBsynr Portal'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
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

            {/* Password with toggle */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border-0 py-3 px-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Forgot password link */}
          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot your password?
            </Link>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full justify-center rounded-md px-3 py-3 text-sm font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
                    '--tw-ring-color': branding?.primary_color || '#3b82f6'
                  } as React.CSSProperties}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
