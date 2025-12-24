import { User, Project, CreativeRight, Revenue, Milestone, SmartContract, EmailTracking, Contributor, PaymentSplit } from '@/lib/types';

// Enhanced Mock Users
export const mockUsers: User[] = [
  {
    id: 'user_1',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@email.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'creator',
    walletAddress: '0x1234567890123456789012345678901234567890',
    totalEarnings: 127500,
    activeProjects: 4,
    joinDate: '2024-01-15',
    isOnline: true,
  },
  {
    id: 'user_2',
    name: 'Maya Chen',
    email: 'maya.chen@email.com',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612ff84?w=150&h=150&fit=crop&crop=face',
    role: 'contributor',
    walletAddress: '0x2345678901234567890123456789012345678901',
    totalEarnings: 89200,
    activeProjects: 3,
    joinDate: '2024-02-20',
    isOnline: false,
  },
  {
    id: 'user_3',
    name: 'Sarah Kim',
    email: 'sarah.kim@email.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'creator',
    walletAddress: '0x3456789012345678901234567890123456789012',
    totalEarnings: 156800,
    activeProjects: 5,
    joinDate: '2023-11-10',
    isOnline: true,
  },
  {
    id: 'user_4',
    name: 'David Park',
    email: 'david.park@email.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'contributor',
    walletAddress: '0x4567890123456789012345678901234567890123',
    totalEarnings: 74300,
    activeProjects: 2,
    joinDate: '2024-03-12',
    isOnline: true,
  },
  {
    id: 'user_5',
    name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    walletAddress: '0x5678901234567890123456789012345678901234',
    totalEarnings: 203400,
    activeProjects: 7,
    joinDate: '2023-12-05',
    isOnline: true,
  },
];

// Enhanced Mock Projects with Contributors
export const mockProjects: Project[] = [
  {
    id: 'proj_1',
    name: 'Neon Dreams Music Video',
    type: 'Music Production',
    status: 'Active',
    description: 'A futuristic synthwave music video featuring stunning neon-lit cityscapes and cutting-edge visual effects.',
    totalRevenue: 85400,
    pendingPayments: 18200,
    creatorId: 'user_1', // Alex Rodriguez is the creator
    contributors: [
      {
        id: 'user_1',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@email.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        revenueShare: 45,
        totalEarned: 38430,
        role: 'Producer/Director'
      },
      {
        id: 'user_2',
        name: 'Maya Chen',
        email: 'maya.chen@email.com',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612ff84?w=150&h=150&fit=crop&crop=face',
        revenueShare: 30,
        totalEarned: 25620,
        role: 'Composer'
      },
      {
        id: 'user_4',
        name: 'David Park',
        email: 'david.park@email.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        revenueShare: 25,
        totalEarned: 21350,
        role: 'Visual Effects Artist'
      }
    ],
    createdDate: '2024-03-15',
    lastUpdated: '2024-09-18',
    contractAddress: '0x1111111111111111111111111111111111111111',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
    progress: 78,
  },
  {
    id: 'proj_2',
    name: 'Sustainable Brand Identity',
    type: 'Design',
    status: 'Completed',
    description: 'Complete eco-friendly brand identity package for a sustainable fashion startup, including logo, packaging, and digital assets.',
    totalRevenue: 64200,
    pendingPayments: 0,
    creatorId: 'user_3', // Sarah Kim is the creator
    contributors: [
      {
        id: 'user_3',
        name: 'Sarah Kim',
        email: 'sarah.kim@email.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        revenueShare: 70,
        totalEarned: 44940,
        role: 'Lead Designer'
      },
      {
        id: 'user_5',
        name: 'Emma Wilson',
        email: 'emma.wilson@email.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        revenueShare: 30,
        totalEarned: 19260,
        role: 'Brand Strategist'
      }
    ],
    createdDate: '2024-01-20',
    lastUpdated: '2024-08-15',
    contractAddress: '0x2222222222222222222222222222222222222222',
    coverImage: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=250&fit=crop',
    progress: 100,
  },
  {
    id: 'proj_3',
    name: 'Ocean Conservation Documentary',
    type: 'Film Production',
    status: 'In Progress',
    description: 'Feature-length documentary exploring marine conservation efforts and the impact of climate change on ocean ecosystems.',
    totalRevenue: 142800,
    pendingPayments: 47600,
    creatorId: 'user_5', // Emma Wilson is the creator
    contributors: [
      {
        id: 'user_5',
        name: 'Emma Wilson',
        email: 'emma.wilson@email.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        revenueShare: 40,
        totalEarned: 57120,
        role: 'Director/Producer'
      },
      {
        id: 'user_1',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@email.com',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        revenueShare: 25,
        totalEarned: 35700,
        role: 'Cinematographer'
      },
      {
        id: 'user_3',
        name: 'Sarah Kim',
        email: 'sarah.kim@email.com',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        revenueShare: 20,
        totalEarned: 28560,
        role: 'Editor'
      },
      {
        id: 'user_4',
        name: 'David Park',
        email: 'david.park@email.com',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        revenueShare: 15,
        totalEarned: 21420,
        role: 'Sound Designer'
      }
    ],
    createdDate: '2024-02-01',
    lastUpdated: '2024-09-17',
    contractAddress: '0x3333333333333333333333333333333333333333',
    coverImage: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=400&h=250&fit=crop',
    progress: 65,
  },
];

// Enhanced Mock Revenue with Payment Splits
export const mockRevenue: Revenue[] = [
  {
    id: 'rev_1',
    projectId: 'proj_1',
    projectName: 'Neon Dreams Music Video',
    amount: 15000,
    date: '2024-09-15',
    source: 'Streaming Royalties',
    contributor: 'Project Revenue',
    contributorId: 'project',
    status: 'Paid',
    transactionHash: '0xabc123def456ghi789jkl012mno345pqr678stu901',
    emailTracked: true,
    splits: [
      {
        contributorId: 'user_1',
        contributorName: 'Alex Rodriguez',
        amount: 6750,
        percentage: 45,
        status: 'Paid'
      },
      {
        contributorId: 'user_2',
        contributorName: 'Maya Chen',
        amount: 4500,
        percentage: 30,
        status: 'Paid'
      },
      {
        contributorId: 'user_4',
        contributorName: 'David Park',
        amount: 3750,
        percentage: 25,
        status: 'Paid'
      }
    ]
  },
  {
    id: 'rev_2',
    projectId: 'proj_2',
    projectName: 'Sustainable Brand Identity',
    amount: 32000,
    date: '2024-08-15',
    source: 'Project Completion',
    contributor: 'Project Revenue',
    contributorId: 'project',
    status: 'Paid',
    emailTracked: true,
    splits: [
      {
        contributorId: 'user_3',
        contributorName: 'Sarah Kim',
        amount: 22400,
        percentage: 70,
        status: 'Paid'
      },
      {
        contributorId: 'user_5',
        contributorName: 'Emma Wilson',
        amount: 9600,
        percentage: 30,
        status: 'Paid'
      }
    ]
  },
  {
    id: 'rev_3',
    projectId: 'proj_3',
    projectName: 'Ocean Conservation Documentary',
    amount: 75000,
    date: '2024-09-10',
    source: 'Distribution Deal',
    contributor: 'Project Revenue',
    contributorId: 'project',
    status: 'Processing',
    emailTracked: true,
    splits: [
      {
        contributorId: 'user_5',
        contributorName: 'Emma Wilson',
        amount: 30000,
        percentage: 40,
        status: 'Pending'
      },
      {
        contributorId: 'user_1',
        contributorName: 'Alex Rodriguez',
        amount: 18750,
        percentage: 25,
        status: 'Pending'
      },
      {
        contributorId: 'user_3',
        contributorName: 'Sarah Kim',
        amount: 15000,
        percentage: 20,
        status: 'Pending'
      },
      {
        contributorId: 'user_4',
        contributorName: 'David Park',
        amount: 11250,
        percentage: 15,
        status: 'Pending'
      }
    ]
  },
];

// Enhanced Mock Smart Contracts
export const mockContracts: SmartContract[] = [
  {
    id: 'contract_1',
    name: 'Creative Rights Manager',
    address: '0x1234567890123456789012345678901234567890',
    network: 'Polygon',
    deployedDate: '2024-03-15',
    type: 'Rights Management',
    isActive: true,
    totalTransactions: 156,
    totalValue: 485200,
    functions: [
      {
        name: 'createProject',
        type: 'write',
        inputs: [
          { name: '_name', type: 'string' },
          { name: '_contributors', type: 'address[]' },
          { name: '_shares', type: 'uint256[]' }
        ]
      },
      {
        name: 'distributeRevenue',
        type: 'write',
        inputs: [
          { name: '_projectId', type: 'uint256' },
          { name: '_amount', type: 'uint256' }
        ]
      },
      {
        name: 'getProject',
        type: 'read',
        inputs: [{ name: '_projectId', type: 'uint256' }],
        outputs: [{ name: 'project', type: 'tuple' }]
      },
      {
        name: 'getContributorShare',
        type: 'read',
        inputs: [
          { name: '_projectId', type: 'uint256' },
          { name: '_contributor', type: 'address' }
        ],
        outputs: [{ name: 'share', type: 'uint256' }]
      }
    ]
  },
  {
    id: 'contract_2',
    name: 'Revenue Splitter',
    address: '0x2345678901234567890123456789012345678901',
    network: 'Ethereum',
    deployedDate: '2024-01-20',
    type: 'Payment Distribution',
    isActive: true,
    totalTransactions: 89,
    totalValue: 324800,
    functions: [
      {
        name: 'splitPayment',
        type: 'write',
        inputs: [
          { name: '_recipients', type: 'address[]' },
          { name: '_shares', type: 'uint256[]' }
        ]
      },
      {
        name: 'withdraw',
        type: 'write',
        inputs: [{ name: '_amount', type: 'uint256' }]
      },
      {
        name: 'getBalance',
        type: 'read',
        inputs: [{ name: '_address', type: 'address' }],
        outputs: [{ name: 'balance', type: 'uint256' }]
      }
    ]
  }
];

// Mock Creative Rights
export const mockRights: CreativeRight[] = [
  {
    id: 'right_1',
    projectId: 'proj_1',
    projectName: 'Neon Dreams Music Video',
    rightsType: 'Distribution Rights',
    owner: 'Alex Rodriguez',
    ownerId: 'user_1',
    status: 'Active',
    expirationDate: '2025-12-31',
    revenueShare: 45,
    createdDate: '2024-03-15',
  },
  {
    id: 'right_2',
    projectId: 'proj_1',
    projectName: 'Neon Dreams Music Video',
    rightsType: 'Sync Rights',
    owner: 'Maya Chen',
    ownerId: 'user_2',
    status: 'Active',
    expirationDate: '2026-03-15',
    revenueShare: 30,
    createdDate: '2024-03-15',
  },
  {
    id: 'right_3',
    projectId: 'proj_2',
    projectName: 'Sustainable Brand Identity',
    rightsType: 'Licensing',
    owner: 'Sarah Kim',
    ownerId: 'user_3',
    status: 'Expiring Soon',
    expirationDate: '2024-10-15',
    revenueShare: 70,
    createdDate: '2024-01-20',
  },
];

// Mock Milestones
export const mockMilestones: Milestone[] = [
  {
    id: 'mile_1',
    title: 'Q4 Revenue Review',
    description: 'Quarterly review of all active projects and revenue projections',
    date: '2024-09-30',
    status: 'Upcoming',
    priority: 'high',
  },
  {
    id: 'mile_2',
    title: 'Rights Renewal - Brand Identity',
    description: 'Renew licensing rights for Sustainable Brand Identity project',
    date: '2024-10-15',
    status: 'Upcoming',
    priority: 'critical',
    projectId: 'proj_2',
  },
  {
    id: 'mile_3',
    title: 'Documentary Distribution',
    description: 'Finalize distribution agreement for Ocean Conservation Documentary',
    date: '2024-11-01',
    status: 'In Progress',
    priority: 'medium',
    projectId: 'proj_3',
  },
];

// Utility Functions
export function getTotalRevenue(): number {
  return mockRevenue.reduce((total, revenue) => total + revenue.amount, 0);
}

export function getPendingPayments(): number {
  return mockRevenue
    .filter(revenue => revenue.status === 'Pending' || revenue.status === 'Processing')
    .reduce((total, revenue) => total + revenue.amount, 0);
}

export function getActiveProjects(): number {
  return mockProjects.filter(project => project.status === 'Active' || project.status === 'In Progress').length;
}

export function getTotalContributors(): number {
  return mockUsers.length;
}

export function getProjectContributors(projectId: string) {
  const project = mockProjects.find(p => p.id === projectId);
  return project?.contributors || [];
}

export function getUserById(userId: string) {
  return mockUsers.find(user => user.id === userId);
}

export function getProjectById(projectId: string) {
  return mockProjects.find(project => project.id === projectId);
}
