import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { base, baseSepolia, hardhat } from 'viem/chains';

// Using Privy's wagmi createConfig wrapper which ensures compatibility with Privy wallets
export const config = createConfig({
  chains: [baseSepolia, base, hardhat],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_MAINNET_RPC),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});
