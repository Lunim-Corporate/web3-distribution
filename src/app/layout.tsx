import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { WalletProvider } from '@/lib/wallet';
import './globals.css';

export const metadata: Metadata = {
  title: 'Creative Rights Tracker',
  description: 'Manage creative rights and revenue distribution',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <WalletProvider>
            {children}
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
