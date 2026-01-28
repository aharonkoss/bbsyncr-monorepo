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
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchParams]);

  // ✅ Separate useEffect for redirect - triggered when countdown reaches 0
  useEffect(() => {
    if (countdown === 0) {
      console.log('🔄 Redirecting to login page');
      router.push('/login');
    }
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Payment Successful! 🎉
        </h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Your subscription has been created successfully.
            </h3>

            {/* Activation Info */}
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-sm text-blue-800 mb-2">
                🔄 Your account is being activated.
              </p>
              <p className="text-sm text-blue-800 mb-2">
                Please log in to access your dashboard.
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Redirecting to login in <strong>{countdown}</strong> seconds...
              </p>
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                ⚡ Your account will be activated within a few seconds.
              </p>
              <p className="text-xs text-yellow-800 mt-1">
                If you have any issues, please contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}