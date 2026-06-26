import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const AuthProvider = dynamic(() => import('@/lib/auth').then(m => m.AuthProvider), { ssr: false });
const Web3Providers = dynamic(() => import('@/lib/web3/providers'), { ssr: false });
const Navbar = dynamic(() => import('@/components/Navbar').then(m => m.Navbar), { ssr: false });
const Toaster = dynamic(() => import('react-hot-toast').then(m => m.Toaster), { ssr: false });

export const metadata: Metadata = {
  title: 'LUNIM — Web3 Creative Rights & Revenue Distribution Platform',
  description: 'LUNIM is the premium Web3 standard for creative rights and cinematic revenue distribution. Manage rights and split revenue streams instantly via automated, gasless smart contracts on Base Sepolia.',
  keywords: ['LUNIM', 'Web3', 'Creative Rights', 'Revenue Distribution', 'Smart Contracts', 'Account Abstraction', 'Base Sepolia', 'Cinematic Rights', 'Privy', 'Alchemy'],
  authors: [{ name: 'LUNIM Protocol' }],
  openGraph: {
    title: 'LUNIM — Web3 Creative Rights & Revenue Distribution Platform',
    description: 'Split cinematic revenue streams instantly via automated, gasless smart contracts on Base Sepolia. Complete transparency for creative rights.',
    url: 'https://lunim.io',
    siteName: 'LUNIM Protocol',
    images: [
      {
        url: 'https://lunim.io/og-image.png',
        width: 1200,
        height: 630,
        alt: 'LUNIM Protocol',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LUNIM — Web3 Creative Rights & Revenue Distribution Platform',
    description: 'Split cinematic revenue streams instantly via automated, gasless smart contracts on Base Sepolia.',
    images: ['https://lunim.io/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0B0C10] text-gray-100 min-h-screen selection:bg-indigo-500/30">
        <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-[#0B0C10] to-[#0B0C10]"></div>
        <Web3Providers>
          <AuthProvider>
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
          </AuthProvider>
        </Web3Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
