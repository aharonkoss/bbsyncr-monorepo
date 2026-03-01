'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [statusMsg, setStatusMsg] = useState('⏳ Activating your account...');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 12; // 12 × 2.5s = 30 seconds

  useEffect(() => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatusMsg('⚠️ Missing session ID. Please contact support.');
      return;
    }

    if (attempts >= MAX_ATTEMPTS) {
      setStatusMsg(
        '⚠️ Activation is taking longer than expected. Please try logging in — your account may already be active.'
      );
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          // No credentials needed — this endpoint is public
          `${process.env.NEXT_PUBLIC_API_URL}/api/payments/verify-session?session_id=${sessionId}`
        );
        const data = await res.json();

        if (data.status === 'active') {
          setStatusMsg('✅ Account activated! Redirecting to login...');
          setTimeout(() => router.push('/login'), 1500);
        } else {
          setAttempts((prev) => prev + 1);
        }
      } catch (err) {
        console.error('Poll error:', err);
        setAttempts((prev) => prev + 1);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [attempts, searchParams, router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
        <p className="text-gray-600">{statusMsg}</p>
        {attempts > 0 && attempts < 12 && (
          <p className="text-sm text-gray-400">Checking... ({attempts}/12)</p>
        )}
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessPageContent />
    </Suspense>
  );
}
