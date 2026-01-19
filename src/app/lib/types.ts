export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: 'admin' | 'creator' | 'contributor';
  walletAddress: string;
  totalEarnings: number;
  activeProjects: number;
  joinDate: string;
  isOnline: boolean;
}

export interface Project {
  id: string;
  name: string;
  type: string;
  status: 'Active' | 'Completed' | 'In Progress' | 'Paused';
  description: string;
  totalRevenue: number;
  pendingPayments: number;
  contributors: Contributor[];
  createdDate: string;
  lastUpdated: string;
  contractAddress?: string;
  coverImage: string;
  progress: number;
  creatorId?: string; // ID of the user who created/owns this project
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  revenueShare: number;
  totalEarned: number;
  role: string;
  walletAddress: string;
}

export interface CreativeRight {
  id: string;
  projectId: string;
  projectName: string;
  rightsType: string;
  owner: string;
  ownerId: string;
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Transferred';
  expirationDate: string;
  revenueShare: number;
  createdDate: string;
}

export interface Revenue {
  id: string;
  projectId: string;
  projectName: string;
  amount: number;
  date: string;
  source: string;
  contributor: string;
  contributorId: string;
  status: 'Paid' | 'Pending' | 'Processing';
  transactionHash?: string;
  emailTracked: boolean;
  splits?: PaymentSplit[];
}

export interface PaymentSplit {
  contributorId: string;
  contributorName: string;
  amount: number;
  percentage: number;
  status: 'Paid' | 'Pending' | 'Processing';
}

export interface TopUp {
  id: string;
  projectId: string;
  projectName: string;
  creatorUserId: string;
  amount: number;
  currency: string;
  chainId: number;
  txHash: string;
  createdAt: string;
}

export interface Distribution {
  id: string;
  projectId: string;
  projectName: string;
  creatorUserId: string;
  totalAmount: number;
  chainId: number;
  txHash: string;
  createdAt: string;
}

export interface DistributionItem {
  id: string;
  distributionId: string;
  projectId: string;
  projectName: string;
  contributorUserId: string;
  contributorWallet: string;
  amount: number;
  createdAt: string;
  txHash: string;
  chainId: number;
}

export interface SmartContract {
  id: string;
  name: string;
  address: string;
  network: string;
  deployedDate: string;
  type: string;
  isActive: boolean;
  totalTransactions: number;
  totalValue: number;
  functions: ContractFunction[];
}

export interface ContractFunction {
  name: string;
  type: 'read' | 'write';
  inputs: { name: string; type: string }[];
  outputs?: { name: string; type: string }[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  date: string;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  projectId?: string;
}

export interface EmailTracking {
  id: string;
  email: string;
  revenue: number;
  source: string;
  date: string;
  isVerified: boolean;
}
