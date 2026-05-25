'use client';

import React, { useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, custom, encodeFunctionData, parseEther, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { createSmartAccountClient } from 'permissionless';
import { toSafeSmartAccount } from 'permissionless/accounts';

type Address = `0x${string}`;

const REVENUE_SPLITTER_ADDRESS = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS as Address;
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org';
const PAYMASTER_URL = process.env.NEXT_PUBLIC_PAYMASTER_URL || ALCHEMY_RPC;
const BUNDLER_URL = process.env.NEXT_PUBLIC_BUNDLER_URL || ALCHEMY_RPC;

// Safe specific addresses for Base Sepolia (Entrypoint v0.6)
const SAFE_4337_MODULE_ADDRESS = '0x39E9269c98CAF0ca8675071f105b31057022f462';
const SAFE_FACTORY_ADDRESS = '0x4e1C6295da940866A45F924e38e65fB84F0E01a6';

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
  }
];

export function useRevenueSplitter() {
  const { wallets } = useWallets();
  
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    async function initSmartAccount() {
      const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
      if (!activeWallet || !REVENUE_SPLITTER_ADDRESS) {
        setSmartAccountAddress(null);
        return;
      }

      setIsInitializing(true);
      try {
        const provider = await activeWallet.getEthereumProvider();
        const publicClient = createPublicClient({
          chain: baseSepolia,
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
  }, [wallets]);

  const getContractBalanceEth = async (): Promise<string> => {
    if (!REVENUE_SPLITTER_ADDRESS) throw new Error('Missing contract address');
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
      transport: http(ALCHEMY_RPC),
    });
    
    const balance = await publicClient.getBalance({ address: REVENUE_SPLITTER_ADDRESS });
    return formatEther(balance);
  };

  const distributeRevenue = async (amountEth: string): Promise<string> => {
    if (!REVENUE_SPLITTER_ADDRESS) throw new Error('Missing contract address');
    
    const activeWallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0];
    if (!activeWallet) {
      throw new Error('No connected wallet found. Please connect your wallet.');
    }

    const provider = await activeWallet.getEthereumProvider();
    
    const publicClient = createPublicClient({
      chain: baseSepolia,
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

    const smartAccountClient: any = createSmartAccountClient({
      account: smartAccount,
      chain: baseSepolia,
      bundlerTransport: http(BUNDLER_URL),
      middleware: {
        sponsorUserOperation: async ({ userOperation }: { userOperation: any }) => {
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
          });
          const result = await response.json();
          if (result.error) throw new Error(result.error.message);
          return {
            paymasterAndData: result.result.paymasterAndData,
            preVerificationGas: result.result.preVerificationGas,
            verificationGasLimit: result.result.verificationGasLimit,
            callGasLimit: result.result.callGasLimit,
          };
        },
      },
    } as any);

    const valueWei = parseEther(amountEth);
    const callData = encodeFunctionData({
      abi: ABI,
      functionName: 'distributeRevenue',
    });

    // Send the UserOperation
    const txHash = await smartAccountClient.sendTransaction({
      account: smartAccount,
      to: REVENUE_SPLITTER_ADDRESS,
      value: valueWei,
      data: callData,
    });

    // Wait for the transaction to be mined
    await publicClient.waitForTransactionReceipt({ hash: txHash });

    return txHash;
  };

  return {
    smartAccountAddress,
    isInitializing,
    getContractBalanceEth,
    distributeRevenue,
  };
}
