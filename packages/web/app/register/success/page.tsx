'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { tokenManager } from '@/lib/api';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        const success = searchParams.get('success');
        const userId = tokenManager.getUser()?.id;

        if (success === 'true' && userId) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/update-subscription/${userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${tokenManager.getToken()}`,
            },
            body: JSON.stringify({ subscription_status: "active" }),
          });

          if (!response.ok) {
            throw new Error('Failed to activate subscription');
          }

          setStatus('success');
          
          setTimeout(() => {
            router.push('/clients');
          }, 3000);
        } else {
          setError('Payment verification failed');
          setStatus('error');
        }
      } catch (err: any) {
        console.error('Activation error:', err);
        setError(err.message || 'Failed to activate subscription');
        setStatus('error');
      }
    };

    activateSubscription();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <Image
            src="/logo.png"
            alt="BBSynr Logo"
            width={120}
            height={48}
            className="mx-auto"
          />
        </div>

        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7] mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">Please wait while we set up your subscription...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Your account is now active and ready to use.</p>
            <p className="text-sm text-gray-500 mt-4">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => router.push('/register')}
              className="px-6 py-2 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1]"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
}