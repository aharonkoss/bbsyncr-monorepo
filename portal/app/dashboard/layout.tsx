'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';
import { useBranding } from '@/lib/hooks/useBranding';
import { apiClient } from '@/lib/api/client';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const { branding, loading: brandingLoading } = useBranding(); // ← Hook called BEFORE any returns
  // ✅ ADD DEBUG LOGGING
    useEffect(() => {
      if (user) {
        console.log('=== LAYOUT USER DEBUG ===');
        console.log('User object:', user);
        console.log('User role:', user.role);
        console.log('Role type:', typeof user.role);
        console.log('Is company_admin?', user.role === 'company_admin');
        console.log('========================');
      }
    }, [user]);
  // All useEffect hooks BEFORE any conditional returns
  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (branding) {
      document.documentElement.style.setProperty('--primary-color', branding.primary_color);
      document.documentElement.style.setProperty('--secondary-color', branding.secondary_color);
    }
  }, [branding]);

  // Event handlers
  const handleLogout = () => {
    localStorage.removeItem('auth-storage');
    delete apiClient.defaults.headers.common['Authorization'];
    useAuthStore.setState({ user: null, token: null });
    router.push('/login');
  };

  // Conditional rendering AFTER all hooks
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav 
        className="shadow-sm"
        style={{ 
          backgroundColor: branding?.primary_color || '#3b82f6'
        }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              {/* Logo */}
              <div className="flex flex-shrink-0 items-center">
                {branding?.logo_url ? (
                  <img
                    className="h-8 w-auto"
                    src={branding.logo_url}
                    alt={branding.company_name}
                  />
                ) : (
                  <span className="text-xl font-bold text-white">
                    {branding?.company_name || 'BBsynr'}
                  </span>
                )}
              </div>

              {/* Navigation Links */}
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/dashboard"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    pathname === '/dashboard'
                      ? 'border-black text-black'
                      : 'border-transparent text-black/80 hover:border-black/50 hover:text-black'
                  }`}
                >
                  Dashboard
                </Link>

                {(user.role === 'manager' || user.role === 'company_admin' || user.role === 'global_admin') && (
                  <Link
                    href="/dashboard/agents"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      pathname === '/dashboard/agents'
                        ? 'border-black text-black'
                        : 'border-transparent black-black/80 hover:border-black/50 hover:text-black'
                    }`}
                  >
                    Agents
                  </Link>
                )}

                {user.role === 'global_admin' && (
                  <Link
                    href="/dashboard/companies"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      pathname === '/dashboard/companies'
                        ? 'border-black text-black'
                        : 'border-transparent text-black/80 hover:border-black/50 hover:text-black'
                    }`}
                  >
                    Companies
                  </Link>
                )}

                {(user.role === 'company_admin' || user.role === 'global_admin') && (
                  <Link
                    href="/dashboard/team"
                    className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                      pathname === '/dashboard/team'
                        ? 'border-black text-black'
                        : 'border-transparent text-black/80 hover:border-black/50 hover:text-black'
                    }`}
                  >
                    Team
                  </Link>
                )}

                <Link
                  href="/dashboard/analytics"
                  className={`inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium ${
                    pathname === '/dashboard/analytics'
                      ? 'border-black text-black'
                      : 'border-transparent text-black/80 hover:border-black/50 hover:text-black'
                  }`}
                >
                  Analytics
                </Link>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center">
              <div className="flex items-center text-black">
                <span className="text-sm font-medium mr-4">{user.name}</span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-black/10 px-3 py-2 text-sm font-medium text-black hover:bg-black/20"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
