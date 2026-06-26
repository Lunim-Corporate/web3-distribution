import { base, baseSepolia, hardhat } from 'viem/chains';

// We default to Base Sepolia for testing unless explicitly configured otherwise
export const activeChain = process.env.NEXT_PUBLIC_CHAIN_ID === '8453' ? base : 
                           process.env.NEXT_PUBLIC_CHAIN_ID === '31337' ? hardhat : baseSepolia;

export const SUPPORTED_CHAINS = [baseSepolia, base, hardhat] as const;

export const getBaseSepoliaRpc = () => process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || baseSepolia.rpcUrls.default.http[0];
export const getBaseMainnetRpc = () => process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || base.rpcUrls.default.http[0];

export const ADMIN_LIVE_ADDRESS = (process.env.NEXT_PUBLIC_ADMIN_LIVE_ADDRESS || '') as `0x${string}` | '';
