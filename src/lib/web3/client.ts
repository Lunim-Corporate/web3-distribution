import { SplitsClient } from '@0xsplits/splits-sdk';
import { BrowserProvider, JsonRpcProvider } from 'ethers';

const SEPOLIA_CHAIN_ID = 11155111;

let splitsClient: SplitsClient | null = null;

/**
 * Initializes the SplitsClient for the Sepolia testnet.
 * In a browser environment, it uses the window.ethereum provider.
 * Falls back to a public RPC if no provider is available (read-only mode).
 */
export const getSplitsClient = async (provider?: any) => {
  if (splitsClient && !provider) return splitsClient;

  let ethersProvider;

  if (provider) {
    ethersProvider = new BrowserProvider(provider);
  } else if (typeof window !== 'undefined' && window.ethereum) {
    ethersProvider = new BrowserProvider(window.ethereum);
  } else {
    // Fallback to public Sepolia RPC
    ethersProvider = new JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
  }

  const signer = await ethersProvider.getSigner().catch(() => undefined);

  splitsClient = new SplitsClient({
    chainId: SEPOLIA_CHAIN_ID,
    provider: ethersProvider,
    signer: signer,
  });

  return splitsClient;
};

export default getSplitsClient;
