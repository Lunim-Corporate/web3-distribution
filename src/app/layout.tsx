import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import { WalletProvider } from '@/lib/wallet';
import { Web3ModalBootstrap } from '@/lib/walletProvider';
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
    <html lang="en" className="dark">
      <body className="pt-16 bg-[#0B0C10] text-gray-100 min-h-screen selection:bg-indigo-500/30">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B0C10] to-[#0B0C10]"></div>
        <AuthProvider>
          <WalletProvider>
            <Web3ModalBootstrap>
              <Navbar />
              {children}
              <Toaster position="top-right" toastOptions={{
                style: {
                  background: '#1F2937',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)',
                }
              }} />
            </Web3ModalBootstrap>
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
