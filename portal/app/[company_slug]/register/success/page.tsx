'use client';

import { useSearchParams, useParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function RegistrationSuccessContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const success = searchParams.get('success');
  const sessionId = searchParams.get('session_id');
  const companySlug = params.company_slug as string;

  const [statusMsg, setStatusMsg] = useState('⏳ Activating your account...');
  const [activated, setActivated] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const MAX_ATTEMPTS = 12; // 12 × 2.5s = 30 seconds

  useEffect(() => {
    // If no success flag or no session_id, don't poll
    if (success !== 'true' || !sessionId) return;

    // If already activated, don't keep polling
    if (activated) return;

    if (attempts >= MAX_ATTEMPTS) {
      setTimedOut(true);
      setStatusMsg('⚠️ Activation is taking longer than expected. Try logging in — your account may already be active.');
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/portal/payments/verify-portal-session?session_id=${sessionId}`
          // No credentials needed — this endpoint is public
        );
        const data = await res.json();

        if (data.status === 'active') {
          setActivated(true);
          setStatusMsg('✅ Account activated! Redirecting to login...');
          setTimeout(() => {
            window.location.href = 'https://app.bbsynr.com/login';
          }, 2000);
        } else {
          setAttempts((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Portal session poll error:', err);
        setAttempts((prev) => prev + 1);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [attempts, activated, success, sessionId]);

  // ❌ Payment failed screen
  if (success !== 'true') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

  // ✅ Success + polling screen
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg p-8 text-center">

        {/* Icon — spinner while waiting, checkmark when activated */}
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${activated ? 'bg-green-100' : 'bg-blue-100'}`}>
          {activated ? (
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {activated ? 'Welcome to BBsynr!' : 'Payment Received!'}
        </h2>

        <p className="text-gray-600 mb-2">
          {activated
            ? 'Your registration is complete and your subscription is active.'
            : 'We are activating your account. This only takes a few seconds.'}
        </p>

        {/* Status message */}
        <div className={`border rounded-lg p-4 mb-6 ${timedOut ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
          <p className={`text-sm font-medium ${timedOut ? 'text-yellow-800' : 'text-blue-800'}`}>
            {statusMsg}
          </p>
          {!activated && !timedOut && (
            <p className="text-xs text-blue-600 mt-1">
              Checking... ({attempts}/{MAX_ATTEMPTS})
            </p>
          )}
        </div>

        {/* Manual login button — always visible as fallback */}
        <a
          href="https://app.bbsynr.com/login"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          Go to BBsynr Login Now
        </a>

        <p className="mt-6 text-xs text-gray-500">
          Need help? Contact{' '}
          <a href="mailto:support@bbsynr.com" className="underline">
            support@bbsynr.com
          </a>
        </p>
      </div>
    </div>
  );
}

export default function RegistrationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    }>
      <RegistrationSuccessContent />
    </Suspense>
  );
}
