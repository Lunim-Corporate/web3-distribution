// Dummy Wallet Data for Creative Rights Tracker
// This file contains realistic dummy wallet data that aligns with the project structure

export interface DummyWallet {
  address: string;
  userId: string;
  name: string;
  balance: string; // in ETH
  balanceUSD: number;
  network: string;
  chainId: number;
  isConnected: boolean;
  lastConnected: string;
  transactions: DummyTransaction[];
  paymentDistributions: DummyPaymentDistribution[];
}

export interface DummyTransaction {
  id: string;
  from: string;
  to: string;
  amount: string; // in ETH
  amountUSD: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
  txHash: string;
  projectId: string;
  projectName: string;
  description: string;
}

export interface DummyPaymentDistribution {
  id: string;
  paymentId: string;
  projectId: string;
  projectName: string;
  fromWallet: string;
  distributions: {
    recipientAddress: string;
    recipientName: string;
    amount: string; // in ETH
    amountUSD: number;
    percentage: number;
  }[];
  totalAmount: string;
  totalAmountUSD: number;
  status: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

// Dummy wallet addresses that match users from mockData
const dummyWalletAddresses = {
  'user_1': '0x1A2b3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b', // Alex Rodriguez
  'user_2': '0x2B3c4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c', // Maya Chen
  'user_3': '0x3C4d5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d', // Sarah Kim
  'user_4': '0x4D5e6F7a8B9c0D1e2F3a4B5c6D7e8F9a0B1c2D3e', // David Park
  'user_5': '0x5E6f7A8b9C0d1E2f3A4b5C6d7E8f9A0b1C2d3E4f', // Emma Wilson
};

// Dummy ETH/USD exchange rate (approximate for dummy data)
const ETH_TO_USD = 2500;

// Helper function to generate dummy wallet data
export const generateDummyWallet = (userId: string, userName: string): DummyWallet => {
  const address = dummyWalletAddresses[userId as keyof typeof dummyWalletAddresses] || `0x${Math.random().toString(16).slice(2)}`;
  const balance = (Math.random() * 50).toFixed(4); // 0-50 ETH
  const balanceUSD = parseFloat(balance) * ETH_TO_USD;

  return {
    address,
    userId,
    name: userName,
    balance,
    balanceUSD: Math.round(balanceUSD),
    network: 'Polygon Mumbai',
    chainId: 80001,
    isConnected: false,
    lastConnected: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    transactions: [],
    paymentDistributions: [],
  };
};

// Dummy wallets for all users
export const dummyWallets: DummyWallet[] = [
  {
    address: dummyWalletAddresses['user_1'],
    userId: 'user_1',
    name: 'Alex Rodriguez',
    balance: '12.5430',
    balanceUSD: 31358,
    network: 'Polygon Mumbai',
    chainId: 80001,
    isConnected: false,
    lastConnected: '2024-12-28T14:30:00Z',
    transactions: [
      {
        id: 'tx_1',
        from: dummyWalletAddresses['user_1'],
        to: dummyWalletAddresses['user_2'],
        amount: '2.5',
        amountUSD: 6250,
        status: 'completed',
        timestamp: '2024-12-28T10:15:00Z',
        txHash: '0xabcd1234efgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012',
        projectId: 'proj_1',
        projectName: 'Neon Dreams Music Video',
        description: 'Revenue split payment for Composer role',
      },
      {
        id: 'tx_2',
        from: dummyWalletAddresses['user_1'],
        to: dummyWalletAddresses['user_4'],
        amount: '1.8',
        amountUSD: 4500,
        status: 'completed',
        timestamp: '2024-12-27T15:45:00Z',
        txHash: '0x1234abcdefgh5678ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9',
        projectId: 'proj_1',
        projectName: 'Neon Dreams Music Video',
        description: 'Revenue split payment for Sound Engineer role',
      },
      {
        id: 'tx_3',
        from: dummyWalletAddresses['user_1'],
        to: dummyWalletAddresses['user_3'],
        amount: '0.75',
        amountUSD: 1875,
        status: 'pending',
        timestamp: '2024-12-29T09:00:00Z',
        txHash: '0x5678efgh1234ijkl9012mnop3456qrst7890uvwx1234yzab5678cdef9012ab',
        projectId: 'proj_2',
        projectName: 'Cinematic Horizon',
        description: 'Revenue split payment for Cinematographer role',
      },
    ],
    paymentDistributions: [
      {
        id: 'dist_1',
        paymentId: 'payment_1',
        projectId: 'proj_1',
        projectName: 'Neon Dreams Music Video',
        fromWallet: dummyWalletAddresses['user_1'],
        distributions: [
          {
            recipientAddress: dummyWalletAddresses['user_2'],
            recipientName: 'Maya Chen',
            amount: '2.5',
            amountUSD: 6250,
            percentage: 30,
          },
          {
            recipientAddress: dummyWalletAddresses['user_4'],
            recipientName: 'David Park',
            amount: '1.8',
            amountUSD: 4500,
            percentage: 20,
          },
          {
            recipientAddress: dummyWalletAddresses['user_1'],
            recipientName: 'Alex Rodriguez',
            amount: '4.2',
            amountUSD: 10500,
            percentage: 50,
          },
        ],
        totalAmount: '8.5',
        totalAmountUSD: 21250,
        status: 'completed',
        timestamp: '2024-12-28T10:15:00Z',
      },
    ],
  },
  {
    address: dummyWalletAddresses['user_2'],
    userId: 'user_2',
    name: 'Maya Chen',
    balance: '8.2150',
    balanceUSD: 20538,
    network: 'Polygon Mumbai',
    chainId: 80001,
    isConnected: false,
    lastConnected: '2024-12-27T11:20:00Z',
    transactions: [
      {
        id: 'tx_4',
        from: dummyWalletAddresses['user_2'],
        to: dummyWalletAddresses['user_3'],
        amount: '1.2',
        amountUSD: 3000,
        status: 'completed',
        timestamp: '2024-12-26T16:30:00Z',
        txHash: '0x9abc2345defg6789hijk0123lmno4567pqrs8901tuvw2345xyza6789bcde0123',
        projectId: 'proj_2',
        projectName: 'Cinematic Horizon',
        description: 'Collaboration payment for Visual Effects',
      },
    ],
    paymentDistributions: [
      {
        id: 'dist_2',
        paymentId: 'payment_2',
        projectId: 'proj_2',
        projectName: 'Cinematic Horizon',
        fromWallet: dummyWalletAddresses['user_2'],
        distributions: [
          {
            recipientAddress: dummyWalletAddresses['user_3'],
            recipientName: 'Sarah Kim',
            amount: '1.2',
            amountUSD: 3000,
            percentage: 40,
          },
          {
            recipientAddress: dummyWalletAddresses['user_2'],
            recipientName: 'Maya Chen',
            amount: '1.8',
            amountUSD: 4500,
            percentage: 60,
          },
        ],
        totalAmount: '3.0',
        totalAmountUSD: 7500,
        status: 'completed',
        timestamp: '2024-12-26T16:30:00Z',
      },
    ],
  },
  {
    address: dummyWalletAddresses['user_3'],
    userId: 'user_3',
    name: 'Sarah Kim',
    balance: '18.7620',
    balanceUSD: 46906,
    network: 'Polygon Mumbai',
    chainId: 80001,
    isConnected: false,
    lastConnected: '2024-12-29T08:00:00Z',
    transactions: [
      {
        id: 'tx_5',
        from: dummyWalletAddresses['user_3'],
        to: dummyWalletAddresses['user_5'],
        amount: '0.5',
        amountUSD: 1250,
        status: 'completed',
        timestamp: '2024-12-25T12:00:00Z',
        txHash: '0x3def4567ghi8901jkl2345mno6789pqr0123stu4567vwx8901yza2345bcde6789',
        projectId: 'proj_3',
        projectName: 'Artistic Canvas',
        description: 'Revenue split payment for Creative Direction',
      },
    ],
    paymentDistributions: [],
  },
  {
    address: dummyWalletAddresses['user_4'],
    userId: 'user_4',
    name: 'David Park',
    balance: '5.4320',
    balanceUSD: 13580,
    network: 'Polygon Mumbai',
    chainId: 80001,
    isConnected: false,
    lastConnected: '2024-12-28T13:45:00Z',
    transactions: [],
    paymentDistributions: [],
  },
  {
    address: dummyWalletAddresses['user_5'],
    userId: 'user_5',
    name: 'Emma Wilson',
    balance: '25.9840',
    balanceUSD: 64960,
    network: 'Polygon Mumbai',
    chainId: 80001,
    isConnected: false,
    lastConnected: '2024-12-29T10:30:00Z',
    transactions: [
      {
        id: 'tx_6',
        from: dummyWalletAddresses['user_5'],
        to: dummyWalletAddresses['user_1'],
        amount: '5.0',
        amountUSD: 12500,
        status: 'completed',
        timestamp: '2024-12-24T09:15:00Z',
        txHash: '0x7hij8901klm2345nop6789qrs0123tuv4567wxy8901za2345bcde6789fghi0123',
        projectId: 'proj_4',
        projectName: 'Blockchain Dreams',
        description: 'Monthly creator fund distribution',
      },
      {
        id: 'tx_7',
        from: dummyWalletAddresses['user_5'],
        to: dummyWalletAddresses['user_2'],
        amount: '3.5',
        amountUSD: 8750,
        status: 'completed',
        timestamp: '2024-12-23T14:20:00Z',
        txHash: '0xbcde1234fghi5678jkl9012mno3456pqr7890stu1234vwx5678yza9012bcde3456',
        projectId: 'proj_4',
        projectName: 'Blockchain Dreams',
        description: 'Contributor milestone payment',
      },
    ],
    paymentDistributions: [
      {
        id: 'dist_3',
        paymentId: 'payment_3',
        projectId: 'proj_4',
        projectName: 'Blockchain Dreams',
        fromWallet: dummyWalletAddresses['user_5'],
        distributions: [
          {
            recipientAddress: dummyWalletAddresses['user_1'],
            recipientName: 'Alex Rodriguez',
            amount: '5.0',
            amountUSD: 12500,
            percentage: 50,
          },
          {
            recipientAddress: dummyWalletAddresses['user_2'],
            recipientName: 'Maya Chen',
            amount: '3.5',
            amountUSD: 8750,
            percentage: 35,
          },
          {
            recipientAddress: dummyWalletAddresses['user_5'],
            recipientName: 'Emma Wilson',
            amount: '1.5',
            amountUSD: 3750,
            percentage: 15,
          },
        ],
        totalAmount: '10.0',
        totalAmountUSD: 25000,
        status: 'completed',
        timestamp: '2024-12-24T09:15:00Z',
      },
    ],
  },
];

// Function to get wallet by address
export const getWalletByAddress = (address: string): DummyWallet | undefined => {
  return dummyWallets.find(
    (wallet) => wallet.address.toLowerCase() === address.toLowerCase()
  );
};

// Function to get wallet by user ID
export const getWalletByUserId = (userId: string): DummyWallet | undefined => {
  return dummyWallets.find((wallet) => wallet.userId === userId);
};

// Function to get all transactions for a wallet
export const getWalletTransactions = (address: string): DummyTransaction[] => {
  const wallet = getWalletByAddress(address);
  return wallet ? wallet.transactions : [];
};

// Function to get all payment distributions for a wallet
export const getWalletPaymentDistributions = (
  address: string
): DummyPaymentDistribution[] => {
  const wallet = getWalletByAddress(address);
  return wallet ? wallet.paymentDistributions : [];
};

// Function to calculate total earnings from transactions
export const calculateTotalEarnings = (address: string): number => {
  const wallet = getWalletByAddress(address);
  if (!wallet) return 0;

  const incomingTransactions = wallet.transactions.filter(
    (tx) => tx.to.toLowerCase() === address.toLowerCase() && tx.status === 'completed'
  );

  return incomingTransactions.reduce((total, tx) => total + tx.amountUSD, 0);
};

// Function to calculate total distributed
export const calculateTotalDistributed = (address: string): number => {
  const wallet = getWalletByAddress(address);
  if (!wallet) return 0;

  const outgoingTransactions = wallet.transactions.filter(
    (tx) => tx.from.toLowerCase() === address.toLowerCase() && tx.status === 'completed'
  );

  return outgoingTransactions.reduce((total, tx) => total + tx.amountUSD, 0);
};

// Function to get wallet statistics
export const getWalletStats = (
  address: string
): {
  totalEarnings: number;
  totalDistributed: number;
  netBalance: number;
  completedTransactions: number;
  pendingTransactions: number;
} => {
  const wallet = getWalletByAddress(address);
  if (!wallet) {
    return {
      totalEarnings: 0,
      totalDistributed: 0,
      netBalance: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
    };
  }

  const totalEarnings = calculateTotalEarnings(address);
  const totalDistributed = calculateTotalDistributed(address);
  const completedTransactions = wallet.transactions.filter(
    (tx) => tx.status === 'completed'
  ).length;
  const pendingTransactions = wallet.transactions.filter(
    (tx) => tx.status === 'pending'
  ).length;

  return {
    totalEarnings,
    totalDistributed,
    netBalance: totalEarnings - totalDistributed,
    completedTransactions,
    pendingTransactions,
  };
};

export default dummyWallets;
