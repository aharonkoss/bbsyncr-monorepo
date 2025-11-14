'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    console.log('✅ SUCCESS: Payment completed via Stripe');
    console.log('🔍 Session ID:', searchParams.get('session_id'));
    console.log('✅ Webhook will activate subscription automatically');

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          console.log('🔄 Redirecting to login page');
          router.push('/login');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h2>
          <p className="text-gray-600 mb-6">
            Your subscription has been created successfully.
          </p>

          {/* Activation Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Your account is being activated.</span>
              <br />
              Please log in to access your dashboard.
            </p>
          </div>

          {/* Redirect Counter */}
          <div className="text-sm text-gray-500 mb-4">
            Redirecting to login in <span className="font-bold text-blue-600">{countdown}</span> seconds...
          </div>

          {/* Manual Login Button */}
          <button
            onClick={() => router.push('/login')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition duration-200"
          >
            Go to Login Now
          </button>

          {/* Help Text */}
          <p className="mt-6 text-xs text-gray-500">
            Your account will be activated within a few seconds.
            <br />
            If you have any issues, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}