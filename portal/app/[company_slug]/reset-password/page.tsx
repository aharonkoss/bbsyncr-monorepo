'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '@/lib/api/client';
import { useCompany } from '@/contexts/CompanyContext';
import toast from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { company, loading: companyLoading } = useCompany();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-600">Invalid Reset Link</h2>
          <p className="text-gray-600">
            This password reset link is invalid or has expired.
          </p>
          <button
            onClick={() => router.push(`/${company?.subdomain}/forgot-password`)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Request a new reset link
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword: password,
      });

      toast.success('Password reset successful!');
      
      // Redirect to login
      router.push(`/${company?.subdomain}/login`);
    } catch (error: any) {
      console.error('❌ Reset error:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Company Logo with WHITE background */}
        <div className="text-center">
          {company?.logo_url ? (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 inline-block mb-4">
              <img
                src={company.logo_url}
                alt={`${company.company_name} logo`}
                className="h-16 w-auto max-w-[200px] object-contain mx-auto"
              />
            </div>
          ) : (
            <div
              className="mx-auto h-16 w-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: company?.primary_color || '#3b82f6' }}
            >
              <span className="text-2xl font-bold text-white">
                {company?.company_name?.charAt(0) || 'B'}
              </span>
            </div>
          )}
          
          <h2 className="text-3xl font-extrabold text-gray-900">
            Reset Your Password
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your new password below
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-3 px-3 pr-10 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                  style={{ focusRing: company?.primary_color }}
                  placeholder="At least 8 characters"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full rounded-md border border-gray-300 py-3 px-3 pr-10 text-gray-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                  style={{ focusRing: company?.primary_color }}
                  placeholder="Re-enter your password"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: company?.primary_color || '#3b82f6' }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>

          {/* Back to login */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push(`/${company?.subdomain}/login`)}
              className="text-sm font-medium"
              style={{ color: company?.primary_color || '#3b82f6' }}
            >
              ← Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
