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

export const formatUSD = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatETH = (amount: number) => {
  return `${amount.toFixed(4)} ETH`;
};
