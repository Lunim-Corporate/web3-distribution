import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Project, TopUp, Distribution, DistributionItem } from '@/lib/types';
import { mockProjects } from '@/data/mockData';

export const runtime = 'nodejs';

const parseUserFromCookie = (cookieValue: string | undefined) => {
  if (!cookieValue) return null;
  try {
    return JSON.parse(decodeURIComponent(cookieValue));
  } catch {
    return null;
  }
};

const seedProjects = () => {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (count.count > 0) return;

  const insertProject = db.prepare(
    `INSERT INTO projects (id, name, type, status, description, total_revenue, pending_payments, creator_id, created_date, last_updated, contract_address, cover_image, progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertContributor = db.prepare(
    `INSERT INTO project_contributors (id, project_id, contributor_id, name, email, avatar, revenue_share, total_earned, role, wallet_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    for (const project of mockProjects) {
      insertProject.run(
        project.id,
        project.name,
        project.type,
        project.status,
        project.description || '',
        Number(project.totalRevenue || 0),
        Number(project.pendingPayments || 0),
        project.creatorId || '',
        project.createdDate || new Date().toISOString().split('T')[0],
        project.lastUpdated || new Date().toISOString().split('T')[0],
        project.contractAddress || '',
        project.coverImage || '',
        Number(project.progress || 0)
      );

      for (const contributor of project.contributors || []) {
        insertContributor.run(
          `pc_${project.id}_${contributor.id}`,
          project.id,
          contributor.id,
          contributor.name,
          contributor.email,
          contributor.avatar || '',
          Number(contributor.revenueShare || 0),
          Number(contributor.totalEarned || 0),
          contributor.role || 'Contributor',
          contributor.walletAddress || ''
        );
      }
    }
  });

  tx();
};

const mapProject = (row: any, contributors: any[]): Project => ({
  id: row.id,
  name: row.name,
  type: row.type,
  status: row.status,
  description: row.description,
  totalRevenue: Number(row.total_revenue || 0),
  pendingPayments: Number(row.pending_payments || 0),
  creatorId: row.creator_id,
  contributors,
  createdDate: row.created_date,
  lastUpdated: row.last_updated,
  contractAddress: row.contract_address,
  coverImage: row.cover_image,
  progress: Number(row.progress || 0),
});

const mapTopUp = (row: any): TopUp => ({
  id: row.id,
  projectId: row.project_id,
  projectName: row.project_name,
  creatorUserId: row.creator_user_id,
  amount: Number(row.amount),
  currency: row.currency,
  chainId: Number(row.chain_id),
  txHash: row.tx_hash,
  createdAt: row.created_at,
});

const mapDistribution = (row: any): Distribution => ({
  id: row.id,
  projectId: row.project_id,
  projectName: row.project_name,
  creatorUserId: row.creator_user_id,
  totalAmount: Number(row.total_amount),
  chainId: Number(row.chain_id),
  txHash: row.tx_hash,
  createdAt: row.created_at,
});

const mapDistributionItem = (row: any): DistributionItem => ({
  id: row.id,
  distributionId: row.distribution_id,
  projectId: row.project_id,
  projectName: row.project_name,
  contributorUserId: row.contributor_user_id,
  contributorWallet: row.contributor_wallet,
  amount: Number(row.amount),
  createdAt: row.created_at,
  txHash: row.tx_hash,
  chainId: Number(row.chain_id || 0),
});

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || '';
  const cookieValue = cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('crt_user='))
    ?.split('=')[1];

  const user = parseUserFromCookie(cookieValue);
  if (!user) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
  }
  const adminEmails = (process.env.ADMIN_EMAILS || 'admin@risidio.com')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdminEmail = user?.email && adminEmails.includes(String(user.email).toLowerCase());
  if (!isAdminEmail) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const shouldSeed = process.env.NODE_ENV === 'development' && searchParams.get('seed') === '1';
  if (shouldSeed) {
    seedProjects();
  }
  const db = getDb();

  const contributorRows = db.prepare('SELECT * FROM project_contributors').all();
  const contributorsByProject = contributorRows.reduce((acc: Record<string, any[]>, row: any) => {
    if (!acc[row.project_id]) acc[row.project_id] = [];
    acc[row.project_id].push({
      id: row.contributor_id,
      name: row.name,
      email: row.email,
      avatar: row.avatar,
      revenueShare: Number(row.revenue_share || 0),
      totalEarned: Number(row.total_earned || 0),
      role: row.role,
      walletAddress: row.wallet_address || '',
    });
    return acc;
  }, {});

  const projectRows = db.prepare('SELECT * FROM projects').all();
  const projects = projectRows.map((row: any) =>
    mapProject(row, contributorsByProject[row.id] || [])
  );

  const topups = db.prepare('SELECT * FROM topups ORDER BY created_at DESC').all().map(mapTopUp);
  const distributions = db
    .prepare('SELECT * FROM distributions ORDER BY created_at DESC')
    .all()
    .map(mapDistribution);
  const distributionItems = db
    .prepare('SELECT * FROM distribution_items ORDER BY created_at DESC')
    .all()
    .map(mapDistributionItem);

  return NextResponse.json({ projects, topups, distributions, distributionItems });
}
