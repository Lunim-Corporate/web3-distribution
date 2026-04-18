import { getSplitsClient } from './client';

export interface UserEarnings {
  distributed: number;
  activeBalances: {
    [token: string]: bigint;
  };
}

/**
 * Fetches user earnings from the 0xSplits protocol using the SDK.
 * This utilizes the underlying 0xSplits subgraph internally.
 */
export const getUserEarnings = async (address: string): Promise<UserEarnings> => {
  const client = await getSplitsClient();
  
  try {
    const earnings = await client.getUserEarnings({
      userAddress: address,
    });
    
    // Convert BigInts or strings to a clean format for the UI
    // 0xSplits returns earnings by token address.
    return {
      distributed: 0, // SDK v2 handles this differently, usually via account metadata
      activeBalances: earnings.activeBalances,
    };
  } catch (error) {
    console.error('Error fetching splits earnings:', error);
    throw error;
  }
};

/**
 * Direct GraphQL query for 0xSplits Sepolia Subgraph (Historical tracking)
 */
export const fetchSplitsHistory = async (address: string) => {
  const SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/0xsplits/splits-sepolia';
  
  const query = `
    query GetUserSplits($user: ID!) {
      receivers(where: { account: $user }) {
        split {
          id
          controller
          distributorFee
          recipients {
            account { id }
            ownership
          }
        }
      }
    }
  `;

  const response = await fetch(SUBGRAPH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { user: address.toLowerCase() } }),
  });

  return response.json();
};
