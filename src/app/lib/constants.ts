export const ETH_PRICE_USD = 3200;
export const HARDHAT_CHAIN_ID = 31337;
export const HARDHAT_CHAIN_ID_HEX = '0x7a69';

export const APP_CONFIG = {
  name: 'LUNIM',
  version: '1.0.0',
  defaultNetwork: 'localhost',
  hardhatChainId: HARDHAT_CHAIN_ID,
  hardhatRpcUrl: 'http://127.0.0.1:8545',
};

const EXPLORERS: Record<number, string> = {
  84532: 'https://sepolia.basescan.org',
  8453: 'https://basescan.org',
  31337: 'http://127.0.0.1:8545',
};

export function getExplorerUrl(type: 'tx' | 'address', hash: string): string {
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || '84532');
  const base = EXPLORERS[chainId] || EXPLORERS[84532];
  return `${base}/${type}/${hash}`;
}

export const formatUSD = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatETH = (amount: number) => {
  return `${amount.toFixed(4)} ETH`;
};
