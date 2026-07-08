import { CreativeRight, Milestone } from '@/lib/types';

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
