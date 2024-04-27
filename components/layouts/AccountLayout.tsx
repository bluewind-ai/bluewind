// AccountLayout.tsx
import React from 'react';
import AppShell from '../shared/shell/AppShell';
import { SWRConfig } from 'swr';
import { Navbar } from '@/components/Navbar';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <SWRConfig
      value={{
        revalidateOnFocus: false,
      }}
    >
      <AppShell>
        <Navbar />
        {children}
      </AppShell>
    </SWRConfig>
  );
}
