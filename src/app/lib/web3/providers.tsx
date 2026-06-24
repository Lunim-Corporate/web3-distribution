'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { WagmiProvider } from '@privy-io/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './wagmiConfig';
import { SUPPORTED_CHAINS } from './config';

const queryClient = new QueryClient();

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  
  if (!privyAppId) {
    if (typeof window !== 'undefined') {
      console.warn('[LUNIM] NEXT_PUBLIC_PRIVY_APP_ID is not set. Web3 features (wallet connection, on-chain transactions) are disabled. Authentication via Privy is also unavailable.');
    }
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#4F46E5', // Indigo-600
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
        defaultChain: SUPPORTED_CHAINS[0],
        supportedChains: [...SUPPORTED_CHAINS],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
