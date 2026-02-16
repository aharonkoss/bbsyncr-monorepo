'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function RegistrationSuccessPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const success = searchParams.get('success');
  const companySlug = params.company_slug as string;

  useEffect(() => {
    // ✅ Redirect to app.bbsynr.com login after 5 seconds
    const timer = setTimeout(() => {
      window.location.href = 'https://app.bbsynr.com/login';
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (success !== 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Payment Failed</h3>
          <p className="mt-2 text-sm text-gray-500">
            There was an issue processing your payment. Please try again.
          </p>
          <div className="mt-6">
            <a
              href={`/${companySlug}/register`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <svg
            className="h-10 w-10 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to BBsynr!
        </h2>
        
        <p className="text-gray-600 mb-2">
          Your registration is complete and your subscription is active.
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          You can now log in and start managing your real estate documents.
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800 font-medium">
            Redirecting to app.bbsynr.com in 5 seconds...
          </p>
        </div>

        {/* ✅ Updated button to go to app.bbsynr.com */}
        <a
          href="https://app.bbsynr.com/login"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Go to BBsynr Login Now
        </a>

        <p className="mt-6 text-xs text-gray-500">
          Need help? Contact support@bbsynr.com
        </p>
      </div>
    </div>
  );
}
