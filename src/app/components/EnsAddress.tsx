'use client';

import React from 'react';
import { useEnsName, formatAddress } from '@/hooks/useEnsResolver';

interface EnsAddressProps {
  address: string | null | undefined;
  className?: string;
  /** Show full address on hover via title attribute */
  showTitle?: boolean;
}

/**
 * EnsAddress — drop-in component that resolves and displays ENS names.
 *
 * If the address has a registered .eth name, it renders the name.
 * Otherwise, it renders a truncated hex address (0x12…34).
 *
 * @example
 * <EnsAddress address="0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" />
 * // renders: vitalik.eth
 */
export const EnsAddress: React.FC<EnsAddressProps> = ({
  address,
  className = '',
  showTitle = true,
}) => {
  const ensName = useEnsName(address);
  const display = address ? formatAddress(address, ensName) : 'N/A';

  return (
    <code
      className={`text-[11px] font-mono bg-indigo-500/5 px-2 py-1 rounded ${
        ensName ? 'text-emerald-400' : 'text-indigo-300'
      } ${className}`}
      title={showTitle && address ? address : undefined}
    >
      {display}
    </code>
  );
};
