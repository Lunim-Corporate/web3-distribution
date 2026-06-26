'use client';

import { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, createWalletClient, http, custom, encodeFunctionData, parseEther, formatEther } from 'viem';
import { hardhat } from 'viem/chains';
import { activeChain, ADMIN_LIVE_ADDRESS } from './web3/config';
import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';

type Address = `0x${string}`;

const DEMO_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_DEMO_CONTRACT_ADDRESS as Address | undefined;
const LIVE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LIVE_CONTRACT_ADDRESS as Address | undefined;
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const LOCAL_RPC = 'http://127.0.0.1:8545';
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || ALCHEMY_RPC;
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL || ALCHEMY_RPC;



const ABI = [
  {
    type: 'function',
    name: 'distributeRevenue',
    inputs: [],
    outputs: [],
    stateMutability: 'payable'
  },
  {
    type: 'function',
    name: 'getContractBalance',
    inputs: [],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'accruedBalances',
    inputs: [{ type: 'address', name: '' }],
    outputs: [{ type: 'uint256', name: '' }],
    stateMutability: 'view'
  },
  {
    type: 'function',
    name: 'claim',
    inputs: [],
    outputs: [],
    stateMutability: 'nonpayable'
  }
];

export function useRevenueSplitter() {
  const { wallets } = useWallets();
  
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDemoMode(localStorage.getItem('demo_mode') === 'true');
      const handleDemo = (e: any) => setIsDemoMode(e.detail);
      window.addEventListener('demo-mode-changed', handleDemo);
      return () => window.removeEventListener('demo-mode-changed', handleDemo);
    }
  }, []);

  useEffect(() => {
    async function initSmartAccount() {
      const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
      if (!activeWallet || isDemoMode) {
        setSmartAccountAddress(null);
        return;
      }
      if (!LIVE_CONTRACT_ADDRESS) {
        setSmartAccountAddress(null);
        return;
      }

      const walletChainId = typeof activeWallet.chainId === 'string' 
        ? parseInt(activeWallet.chainId.replace('eip155:', '')) 
        : activeWallet.chainId;

      if (walletChainId === 31337) {
        setSmartAccountAddress(activeWallet.address as Address);
        setIsInitializing(false);
        return;
      }

      setIsInitializing(true);
      try {
        const provider = await activeWallet.getEthereumProvider();
        const publicClient = createPublicClient({
          chain: activeChain,
          transport: http(ALCHEMY_RPC),
        });

        const smartAccount = await toSafeSmartAccount({
          client: publicClient,
          owners: [provider as any],
          version: '1.4.1',
          entryPoint: {
            address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
            version: '0.6',
          },
        });
        setSmartAccountAddress(smartAccount.address);
      } catch (err) {
        console.error('Failed to init smart account:', err);
        setSmartAccountAddress(null);
      } finally {
        setIsInitializing(false);
      }
    }
    initSmartAccount();
  }, [wallets, isDemoMode]);

  const resolveContractAddress = (): Address => {
    const addr = isDemoMode ? DEMO_CONTRACT_ADDRESS : LIVE_CONTRACT_ADDRESS;
    if (!addr) throw new Error('Contract address not configured');
    return addr;
  };

  const resolveChain = () => {
    if (isDemoMode) return { chain: hardhat, rpc: LOCAL_RPC };
    const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    if (activeWallet) {
      const walletChainId = typeof activeWallet.chainId === 'string' 
        ? parseInt(activeWallet.chainId.replace('eip155:', '')) 
        : activeWallet.chainId;
      if (walletChainId === 31337) return { chain: hardhat, rpc: LOCAL_RPC };
    }
    return { chain: activeChain, rpc: ALCHEMY_RPC };
  };

  const getContractBalanceEth = async (): Promise<string> => {
    const contractAddress = resolveContractAddress();
    
    const { chain, rpc } = resolveChain();
    const publicClient = createPublicClient({
      chain,
      transport: http(rpc),
    });
    
    const balance = await publicClient.getBalance({ address: contractAddress });
    return formatEther(balance);
  };

  const getAccruedBalanceEth = async (address: string): Promise<string> => {
    if (!address) return '0.0';
    let contractAddress: Address;
    try {
      contractAddress = resolveContractAddress();
    } catch {
      return '0.0';
    }

    try {
      const { chain, rpc } = resolveChain();
      const publicClient = createPublicClient({
        chain,
        transport: http(rpc),
      });

      const balance = await publicClient.readContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'accruedBalances',
        args: [address as Address],
      }) as bigint;

      return formatEther(balance);
    } catch (err) {
      console.error('Failed to get accrued balance:', err);
      return '0.0';
    }
  };

  const claimRevenue = async (): Promise<string> => {
    const contractAddress = resolveContractAddress();

    const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    
    if (isDemoMode) {
      const hasMetaMask = typeof window !== 'undefined' && !!window.ethereum;
      let activeMetaMaskAcc = '';
      let activeChainIdHex = '';

      if (hasMetaMask) {
        try {
          const accounts = await window.ethereum!.request({ method: 'eth_accounts' }) as string[];
          activeMetaMaskAcc = accounts[0] || '';
          activeChainIdHex = await window.ethereum!.request({ method: 'eth_chainId' }) as string;
        } catch (e) {
          console.warn('MetaMask sandbox claim check skipped', e);
        }
      }

      const activeDemoWallet = localStorage.getItem('active_demo_wallet') || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      const isMetaMaskMatching = activeMetaMaskAcc && activeMetaMaskAcc.toLowerCase() === activeDemoWallet.toLowerCase();
      const isChainHardhat = parseInt(activeChainIdHex, 16) === 31337;

      if (hasMetaMask && isMetaMaskMatching && isChainHardhat) {
        const callData = encodeFunctionData({
          abi: ABI,
          functionName: 'claim',
        });
        const txHash = await window.ethereum!.request({
          method: 'eth_sendTransaction',
          params: [{
            from: activeDemoWallet,
            to: contractAddress,
            data: callData,
            gasPrice: '0x0'
          }]
        }) as string;

        const publicClient = createPublicClient({
          chain: hardhat,
          transport: http(LOCAL_RPC),
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash as Address });
        return txHash;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const mockHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('');
        return mockHash;
      }
    } else {
      if (!activeWallet) {
        throw new Error('No connected wallet found. Please connect your wallet.');
      }

      const walletChainId = typeof activeWallet.chainId === 'string' 
        ? parseInt(activeWallet.chainId.replace('eip155:', '')) 
        : activeWallet.chainId;
      const useLocalhost = walletChainId === 31337;
      const txChain = useLocalhost ? hardhat : activeChain;
      const txRpc = useLocalhost ? LOCAL_RPC : ALCHEMY_RPC;

      const publicClient = createPublicClient({
        chain: txChain,
        transport: http(txRpc),
      });

      const callData = encodeFunctionData({
        abi: ABI,
        functionName: 'claim',
      });

      if (useLocalhost && ADMIN_LIVE_ADDRESS && activeWallet.address.toLowerCase() !== ADMIN_LIVE_ADDRESS.toLowerCase()) {
        const accounts = typeof window !== 'undefined' && window.ethereum
          ? await window.ethereum.request({ method: 'eth_accounts' }) as string[]
          : [];
        const hasAdminLive = accounts.some(a => a.toLowerCase() === ADMIN_LIVE_ADDRESS.toLowerCase());
        if (hasAdminLive) {
          const txHash = await window.ethereum!.request({
            method: 'eth_sendTransaction',
            params: [{
              from: ADMIN_LIVE_ADDRESS,
              to: contractAddress,
              data: callData,
              gasPrice: '0x0'
            }]
          }) as string;
          await publicClient.waitForTransactionReceipt({ hash: txHash as Address });
          return txHash;
        }
      }

      const provider = await activeWallet.getEthereumProvider();

      const walletClient = createWalletClient({
        account: activeWallet.address as Address,
        chain: txChain,
        transport: custom(provider as any),
      });

      const txHash = await walletClient.sendTransaction({
        account: activeWallet.address as Address,
        to: contractAddress,
        data: callData,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    }
  };

  const distributeRevenue = async (amountEth: string): Promise<string> => {
    const contractAddress = resolveContractAddress();
    
    const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    if (!activeWallet) {
      throw new Error('No connected wallet found. Please connect your wallet.');
    }

    const walletChainId = typeof activeWallet.chainId === 'string' 
      ? parseInt(activeWallet.chainId.replace('eip155:', '')) 
      : activeWallet.chainId;
    const useLocalhost = walletChainId === 31337;
    const txChain = useLocalhost ? hardhat : activeChain;
    const txRpc = useLocalhost ? LOCAL_RPC : ALCHEMY_RPC;

    const provider = await activeWallet.getEthereumProvider();
    
    const publicClient = createPublicClient({
      chain: txChain,
      transport: http(txRpc),
    });

    const valueWei = parseEther(amountEth);
    const callData = encodeFunctionData({
      abi: ABI,
      functionName: 'distributeRevenue',
    });

    if (useLocalhost) {
      const walletClient = createWalletClient({
        account: activeWallet.address as Address,
        chain: hardhat,
        transport: custom(provider as any),
      });

      const txHash = await walletClient.sendTransaction({
        account: activeWallet.address as Address,
        to: contractAddress,
        value: valueWei,
        data: callData,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    }

    try {
      if (!process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID) {
        throw new Error('GASLESS_MODE_UNAVAILABLE');
      }

      const smartAccount = await toSafeSmartAccount({
        client: publicClient,
        owners: [provider as any],
        version: '1.4.1',
        entryPoint: {
          address: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
          version: '0.6',
        },
      });

      const smartAccountClient: any = createSmartAccountClient({
        account: smartAccount,
        chain: activeChain,
        bundlerTransport: http(BUNDLER_URL),
        middleware: {
          sponsorUserOperation: async ({ userOperation }: { userOperation: any }) => {
            // 10s timeout for paymaster request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            try {
              const response = await fetch(PAYMASTER_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  jsonrpc: '2.0',
                  id: 1,
                  method: 'alchemy_requestGasAndPaymasterAndData',
                  params: [
                    {
                      ...userOperation,
                      nonce: `0x${BigInt(userOperation.nonce || 0).toString(16)}`,
                      sender: smartAccount.address,
                      callData: userOperation.callData,
                    },
                    { policyId: process.env.NEXT_PUBLIC_ALCHEMY_GAS_POLICY_ID },
                  ],
                }),
                signal: controller.signal,
              });

              const result = await response.json();
              if (result.error) throw new Error(result.error.message);
              return {
                paymasterAndData: result.result.paymasterAndData,
                preVerificationGas: result.result.preVerificationGas,
                verificationGasLimit: result.result.verificationGasLimit,
                callGasLimit: result.result.callGasLimit,
              };
            } finally {
              clearTimeout(timeoutId);
            }
          },
        },
      } as any);

      const txHash = await smartAccountClient.sendTransaction({
        account: smartAccount,
        to: contractAddress,
        value: valueWei,
        data: callData,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      return txHash;

    } catch (smartAccountError: any) {
      const isGaslessUnavailable = smartAccountError?.message === 'GASLESS_MODE_UNAVAILABLE';
      const msg = isGaslessUnavailable
        ? 'Gasless mode not configured — you will pay gas fees for this transaction'
        : `Paymaster failed (${smartAccountError?.message || 'unknown error'}) — falling back to direct EOA`;
      console.warn(msg, smartAccountError);

      const walletClient = createWalletClient({
        account: activeWallet.address as Address,
        chain: activeChain,
        transport: custom(provider as any),
      });

      const txHash = await walletClient.sendTransaction({
        account: activeWallet.address as Address,
        to: contractAddress,
        value: valueWei,
        data: callData,
      });

      await publicClient.waitForTransactionReceipt({ hash: txHash });
      return txHash;
    }
  };

  return {
    smartAccountAddress,
    isInitializing,
    getContractBalanceEth,
    getAccruedBalanceEth,
    claimRevenue,
    distributeRevenue,
  };
}
