'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { fetchCurrentUser, fetchClients, logout, CurrentUser } from '@/lib/api';

interface Client {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  created_at: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try {
        const [user, clientsRes] = await Promise.all([
          fetchCurrentUser(),
          fetchClients(),
        ]);
        if (!cancelled) {
          setCurrentUser(user);
          setClients(clientsRes.clients || []);
          setLoading(false);
        }
      } catch {
        if (!cancelled) router.replace('/login');
      }
    };
    init();
    return () => { cancelled = true; };
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch {
      // continue regardless
    } finally {
      router.replace('/login');
    }
  };

  const filtered = clients.filter(c =>
    c.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0284C7]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white shadow-md border-b-4 border-[#0284C7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Image src="/logo.png" alt="BBSynr Logo" width={120} height={48} className="h-12 w-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
                {currentUser && (
                  <p className="text-xs text-gray-500">{currentUser.realtor_name} · {currentUser.email}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/clients/new')}
                className="flex items-center gap-2 px-4 py-2 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Contract
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {loggingOut ? 'Logging out...' : 'Log Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search clients by name or email..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0284C7] text-gray-900 bg-white shadow-sm"
          />
        </div>

        {/* Stats bar */}
        <div className="mb-6 flex items-center gap-2 text-sm text-gray-500">
          <span>{filtered.length} {filtered.length === 1 ? 'client' : 'clients'}</span>
          {searchQuery && <span>matching "{searchQuery}"</span>}
        </div>

        {/* Client list */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {searchQuery ? (
              <>
                <p className="text-gray-500 font-medium">No clients found for "{searchQuery}"</p>
                <button onClick={() => setSearchQuery('')} className="mt-2 text-sm text-[#0284C7] hover:underline">Clear search</button>
              </>
            ) : (
              <>
                <p className="text-gray-500 font-medium">No clients yet</p>
                <p className="text-sm text-gray-400 mt-1">Start a new contract to add your first client</p>
                <button onClick={() => router.push('/clients/new')} className="mt-4 px-5 py-2.5 bg-[#0284C7] text-white rounded-lg hover:bg-[#0369A1] font-medium text-sm">
                  + New Contract
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(client => (
              <div
                key={client.id}
                onClick={() => router.push(`/clients/${client.id}/contracts`)}
                className="bg-white rounded-lg shadow px-5 py-4 flex justify-between items-center cursor-pointer hover:shadow-md hover:border-[#0284C7] border border-transparent transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#0284C7] text-white flex items-center justify-center font-semibold text-sm shrink-0">
                    {client.customer_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{client.customer_name}</p>
                    <p className="text-sm text-gray-500">{client.email}{client.phone ? ` · ${client.phone}` : ''}</p>
                    {client.address && <p className="text-xs text-gray-400 mt-0.5">{client.address}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <p className="text-xs text-gray-400 hidden sm:block">
                    Added {new Date(client.created_at).toLocaleDateString()}
                  </p>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
