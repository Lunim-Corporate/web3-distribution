'use client';

import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (params: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

type Address = `0x${string}`;

const REVENUE_SPLITTER_ADDRESS = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS as
  | Address
  | undefined;

const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string | undefined;

function requireContractAddress(): Address {
  if (!REVENUE_SPLITTER_ADDRESS) {
    throw new Error('Missing NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS');
  }
  return REVENUE_SPLITTER_ADDRESS;
}

function getFallbackAbi(): string[] {
  // Fallback ABI that supports common “release payments” patterns.
  // If your deployed contract uses different method names/signatures,
  // set NEXT_PUBLIC_REVENUE_SPLITTER_ABI_JSON accordingly.
  return ['function releasePayments() external', 'event PaymentReleased(address indexed payee, uint256 amount)'];
}

function getContractAbi(): ethers.InterfaceAbi {
  const raw = process.env.NEXT_PUBLIC_REVENUE_SPLITTER_ABI_JSON;
  if (!raw) return getFallbackAbi();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as ethers.InterfaceAbi;
  } catch {
    // ignore and fallback
  }
  return getFallbackAbi();
}

function getWindowEthereum(): NonNullable<Window['ethereum']> {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('MetaMask not detected (window.ethereum is missing).');
  }
  return window.ethereum;
}

function getReadOnlyProvider(): ethers.Provider {
  const address = requireContractAddress();
  void address;

  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(getWindowEthereum());
  }
  if (!RPC_URL) {
    throw new Error('Missing NEXT_PUBLIC_RPC_URL for read-only contract calls.');
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

export class RevenueSplitterService {
  private readonly contractAddress: Address;
  private readonly abi: ethers.InterfaceAbi;

  constructor(contractAddress: Address, abi: ethers.InterfaceAbi) {
    this.contractAddress = contractAddress;
    this.abi = abi;
  }

  static create(): RevenueSplitterService {
    return new RevenueSplitterService(requireContractAddress(), getContractAbi());
  }

  async getContractBalanceEth(): Promise<string> {
    const provider = getReadOnlyProvider();
    const balanceWei = await provider.getBalance(this.contractAddress);
    return ethers.formatEther(balanceWei);
  }

  async sendETHToContract(amountEth: string): Promise<string> {
    const ethereum = getWindowEthereum();
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    const valueWei = ethers.parseEther(amountEth);
    const tx = await signer.sendTransaction({
      to: this.contractAddress,
      value: valueWei,
    });

    return tx.hash;
  }

  async releasePayments(): Promise<string> {
    const ethereum = getWindowEthereum();
    const provider = new ethers.BrowserProvider(ethereum);
    const signer = await provider.getSigner();

    const contract = new ethers.Contract(this.contractAddress, this.abi, signer);
    const tx = await contract.releasePayments();
    return tx.hash;
  }
}


