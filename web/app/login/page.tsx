'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// Cookie Consent Component
function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookieConsent');
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setShowBanner(false);
    // Add your analytics initialization here if needed
    console.log('Cookies accepted');
  };

  const handleReject = () => {
    localStorage.setItem('cookieConsent', 'rejected');
    setShowBanner(false);
    console.log('Cookies rejected');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50 border-t border-gray-700">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
            <a href="/privacy-policy" className="underline hover:text-gray-300">
              Learn more
            </a>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 text-sm border border-gray-500 rounded hover:bg-gray-800 transition-colors"
          >
            Reject
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 text-sm bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    const response = await api.login({ email, password });
    
    // ✅ Store the token
    if (response.token) {
      const { setAuthToken } = await import('@/lib/api');
      setAuthToken(response.token);
      console.log('✅ Token stored after login');
    }

    router.push('/clients');
  } catch (err: any) {
    console.error('Login error:', err);
    setError(err.response?.data?.error || 'Invalid email or password');
  } finally {
    setLoading(false);
  }
};


  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-white p-4 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo Section */}
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.png"
                alt="BBSynr Logo"
                width={600}
                height={240}
                priority
                className="h-48 w-auto"
              />
            </div>
            <p className="mt-2 text-sm text-gray-600">
              Real Estate Document Management & Signing
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-gradient-to-br from-white to-gray-50 p-4 rounded-xl shadow-lg p-8">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="you@example.com"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="••••••••"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0284C7] text-white font-semibold rounded-lg hover:bg-[#0369A1] focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* Secondary Actions */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="w-full py-3 px-4 border border-[#0284C7] text-[#0284C7] font-semibold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#0284C7] focus:ring-offset-2 transition-colors duration-200"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => router.push('/forgot-password')}
                className="w-full py-3 px-4 text-[#0284C7] font-semibold hover:text-[#0369A1] focus:outline-none transition-colors duration-200"
              >
                Forgot Password?
              </button>
            </div>
          </form>

          {/* Footer */}
          <footer className="mt-8 text-center text-xs text-gray-500">
            © 2025 BBSyncr. All rights reserved.
            <div className="mt-1">Patent Pending</div>
          </footer>
        </div>
      </div>
      
      <CookieConsent />
    </>
  );
}
