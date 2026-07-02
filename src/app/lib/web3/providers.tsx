'use client';

import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function Web3Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [PrivyProvider, setPrivyProvider] = useState<React.ComponentType<any> | null>(null);
  const [WagmiProvider, setWagmiProvider] = useState<React.ComponentType<any> | null>(null);
  const [QueryClientProvider, setQueryClientProvider] = useState<React.ComponentType<any> | null>(null);
  const [queryClient, setQueryClient] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [SUPPORTED_CHAINS, setSupportedChains] = useState<any[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProviders() {
      try {
        const [
          { PrivyProvider: PP },
          { WagmiProvider: WP },
          { QueryClient, QueryClientProvider: QCP },
          { config: cfg },
          { SUPPORTED_CHAINS: chains }
        ] = await Promise.all([
          import('@privy-io/react-auth'),
          import('@privy-io/wagmi'),
          import('@tanstack/react-query'),
          import('./wagmiConfig'),
          import('./config'),
        ]);
        setPrivyProvider(() => PP);
        setWagmiProvider(() => WP);
        setQueryClientProvider(() => QCP);
        setQueryClient(new QueryClient());
        setConfig(cfg);
        setSupportedChains([...chains]);
        setMounted(true);
      } catch (err: any) {
        console.warn('[Web3Providers] Failed to load Web3 providers:', err.message);
        setLoadError(err.message);
        setMounted(true);
      }
    }
    loadProviders();
  }, []);

  if (!mounted) return <>{children}</>;

  if (loadError || !PrivyProvider || !WagmiProvider || !QueryClientProvider || !queryClient || !config) {
    return <>{children}</>;
  }

  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID || '';

  if (!privyAppId) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary fallback={<>{children}</>}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ['email', 'wallet'],
          appearance: {
            theme: 'dark',
            accentColor: '#4F46E5',
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
    </ErrorBoundary>
  );
}
