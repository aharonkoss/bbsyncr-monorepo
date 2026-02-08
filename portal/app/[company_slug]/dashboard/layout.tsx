'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuthStore } from '@/lib/store/authStore';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { company, loading: companyLoading } = useCompany();
  const router = useRouter();
  const pathname = usePathname();
  
  // Use authStore instead of localStorage
  const { user, isAuthenticated, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated && !companyLoading) {
      console.log('❌ Not authenticated, redirecting to login');
      if (company?.subdomain) {
        router.push(`/${company.subdomain}/login`);
      } else {
        router.push('/');
      }
    }
  }, [isAuthenticated, company, companyLoading, router]);

  const handleSignOut = async () => {
    console.log('🚪 Signing out...');
    await logout();
    
    if (company?.subdomain) {
      router.push(`/${company.subdomain}/login`);
    } else {
      router.push('/');
    }
  };

  // Navigation items with role-based visibility
  const navigationItems = [
    {
      name: 'Dashboard',
      href: `/${company?.subdomain}/dashboard`,
      icon: '📊',
      roles: ['global_admin', 'company_admin', 'manager'],
    },
    {
      name: 'Agents',
      href: `/${company?.subdomain}/dashboard/agents`,
      icon: '👥',
      roles: ['global_admin', 'company_admin', 'manager'],
    },
    {
      name: 'Analytics',
      href: `/${company?.subdomain}/dashboard/analytics`,
      icon: '📈',
      roles: ['global_admin', 'company_admin', 'manager'],
    },
    {
      name: 'Team',
      href: `/${company?.subdomain}/dashboard/team`,
      icon: '👨‍💼',
      roles: ['global_admin', 'company_admin'],
    },
    {
      name: 'Companies',
      href: `/${company?.subdomain}/dashboard/companies`,
      icon: '🏢',
      roles: ['global_admin'],
    },
  ];

  // Filter navigation based on user role
  const visibleNavItems = navigationItems.filter((item) =>
    item.roles.includes(user?.role || '')
  );

  if (companyLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side - Logo & Company Name */}
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
              >
                <span className="sr-only">Open menu</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Company Logo */}
              <div className="flex items-center">
                {company?.logo_url ? (
                  <img
                    src={company.logo_url}
                    alt={company.company_name || 'Company Logo'}
                    className="h-10 w-auto object-contain bg-white rounded p-1"
                  />
                ) : (
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: company?.primary_color || '#1a9aff' }}
                  >
                    {company?.company_name?.charAt(0) || 'B'}
                  </div>
                )}
                <span className="ml-3 text-xl font-semibold text-gray-900">
                  {company?.company_name || 'BBsynr'}
                </span>
              </div>
            </div>

            {/* Right side - User info & Sign out */}
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">
                  {user?.role === 'global_admin' && 'Global Admin'}
                  {user?.role === 'company_admin' && 'Company Admin'}
                  {user?.role === 'manager' && 'Manager'}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                style={{ backgroundColor: company?.primary_color || '#1a9aff' }}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white border-r border-gray-200 pt-5 pb-4">
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {visibleNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                    style={
                      isActive
                        ? { backgroundColor: `${company?.primary_color}15`, color: company?.primary_color }
                        : {}
                    }
                  >
                    <span className="mr-3 text-xl">{item.icon}</span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="lg:hidden fixed inset-0 flex z-40">
            <div
              className="fixed inset-0 bg-gray-600 bg-opacity-75"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <span className="sr-only">Close sidebar</span>
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {visibleNavItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        style={
                          isActive
                            ? { backgroundColor: `${company?.primary_color}15`, color: company?.primary_color }
                            : {}
                        }
                      >
                        <span className="mr-3 text-xl">{item.icon}</span>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
