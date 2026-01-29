'use client';

import { CompanyProvider } from '@/contexts/CompanyContext';

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      {children}
    </CompanyProvider>
  );
}
