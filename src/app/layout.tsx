import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { WalletProvider } from '@/lib/wallet';
import { Toaster } from 'react-hot-toast';
import { Navbar } from '@/components/Navbar';
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
      <body className="pt-16">
        <AuthProvider>
          <WalletProvider>
            <Navbar />
            {children}
            <Toaster position="top-right" />
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
