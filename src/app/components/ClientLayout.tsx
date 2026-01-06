'use client';

import { AuthProvider } from '../lib/auth';
import { WalletProvider } from '../lib/wallet';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <WalletProvider>
        {children}
      </WalletProvider>
    </AuthProvider>
  );
}