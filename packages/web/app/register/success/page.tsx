'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { tokenManager } from '@/lib/api';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Please wait while we verify your payment...');
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const activateSubscription = async () => {
      try {
        // Log 1: Initial state
        console.log('🔍 SUCCESS PAGE: Starting activation process');
        
        const success = searchParams.get('success');
        const sessionId = searchParams.get('session_id');
        const userId = tokenManager.getUser()?.id;
        const token = tokenManager.getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        
        // Log 2: Environment and URL params
        const debugData = {
          success,
          sessionId,
          userId,
          hasToken: !!token,
          apiUrl,
          currentUrl: window.location.href,
          searchParamsString: window.location.search,
        };
        
        console.log('🔍 DEBUG INFO:', debugData);
        setDebugInfo(debugData);

        // Log 3: Validation checks
        if (success !== 'true') {
          console.error('❌ SUCCESS: success param is not true:', success);
          throw new Error(`Invalid success parameter: ${success}`);
        }

        if (!userId) {
          console.error('❌ USER: No user ID found in token');
          throw new Error('User not authenticated');
        }

        console.log('✅ VALIDATION: Passed initial checks');

        // Construct the full API URL
        const updateUrl = `${apiUrl}/api/auth/update-subscription/${userId}`;
        console.log('🌐 API URL:', updateUrl);

        // Log 4: Making API request
        console.log('📡 MAKING REQUEST:', {
          url: updateUrl,
          method: 'PATCH',
          hasAuth: !!token,
          body: { subscription_status: 'active' }
        });

        const response = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ subscription_status: 'active' }),
        });

        // Log 5: Response status
        console.log('📥 RESPONSE:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: response.url,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API ERROR:', errorText);
          throw new Error(`API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('✅ SUCCESS RESPONSE:', data);

        setStatus('success');
        setMessage('Payment successful! Your subscription is now active.');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          console.log('🔄 REDIRECTING to /clients');
          router.push('/clients');
        }, 3000);

      } catch (err: any) {
        console.error('❌ ACTIVATION ERROR:', err);
        console.error('ERROR STACK:', err.stack);
        
        setStatus('error');
        setMessage(err.message || 'Failed to activate subscription');
      }
    };

    activateSubscription();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* Logo */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">BBSyncr</h1>
          </div>

          {/* Processing State */}
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Processing Payment
              </h2>
              <p className="text-gray-600">{message}</p>
            </>
          )}

          {/* Success State */}
          {status === 'success' && (
            <>
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Payment Successful!
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Activation Issue
              </h2>
              <p className="text-gray-600 mb-4">{message}</p>
              <button
                onClick={() => router.push('/register')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Try Again
              </button>
            </>
          )}

          {/* Debug Info Section (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
              <h3 className="font-semibold mb-2">Debug Information:</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
}