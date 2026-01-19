export const getTxExplorerUrl = (chainId?: number | null, txHash?: string | null): string | null => {
  if (!chainId || !txHash) return null;
  const base: Record<number, string> = {
    1: 'https://etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    137: 'https://polygonscan.com',
    80001: 'https://mumbai.polygonscan.com',
    80002: 'https://amoy.polygonscan.com',
  };
  const explorer = base[chainId];
  if (!explorer) return null;
  return `${explorer}/tx/${txHash}`;
};
