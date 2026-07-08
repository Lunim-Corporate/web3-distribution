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
}

export interface Contributor {
  id: string;
  name: string;
  email: string;
  avatar: string;
  revenueShare: number;
  totalEarned: number;
  role: string;
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
  status: 'Paid' | 'Pending';
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

export interface RevenueReport {
  id: string;
  generatedAt: string;
  reportPeriod: { startDate: string; endDate: string };
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  averagePaymentAmount: number;
  paymentCount: number;
  sources: RevenueBySource[];
  projects: RevenueByProject[];
  topContributors: TopContributor[];
  trends: RevenueTrend[];
}

export interface RevenueBySource {
  source: string;
  amount: number;
  percentage: number;
  paymentCount: number;
}

export interface RevenueByProject {
  projectId: string;
  projectName: string;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  contributorCount: number;
  sharePercentage: number;
  splits?: any[];
}

export interface TopContributor {
  contributorId: string;
  contributorName: string;
  totalEarned: number;
  percentage: number;
  activeProjects: number;
}

export interface RevenueTrend {
  date: string;
  amount: number;
  source: string;
  projectName: string;
}
