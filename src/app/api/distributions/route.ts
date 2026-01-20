import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/db';
import { Distribution, DistributionItem } from '@/lib/types';

export const runtime = 'nodejs';

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
  const { searchParams } = new URL(request.url);
  const contributorUserId = searchParams.get('contributorUserId');
  const projectId = searchParams.get('projectId');
  const db = getDb();
  let distributions: Distribution[] = [];
  let items: DistributionItem[] = [];

  if (contributorUserId) {
    const itemConditions: string[] = ['contributor_user_id = ?'];
    const itemParams: Array<string> = [contributorUserId];
    if (projectId) {
      itemConditions.push('project_id = ?');
      itemParams.push(projectId);
    }
    const itemRows = db
      .prepare(
        `SELECT * FROM distribution_items WHERE ${itemConditions.join(' AND ')} ORDER BY created_at DESC`
      )
      .all(...itemParams);
    items = itemRows.map(mapDistributionItem);

    const distributionIds = Array.from(new Set(items.map((i) => i.distributionId)));
    if (distributionIds.length === 0) {
      return NextResponse.json({ distributions: [], items });
    }
    const placeholders = distributionIds.map(() => '?').join(', ');
    const distRows = db
      .prepare(
        `SELECT * FROM distributions WHERE id IN (${placeholders}) ORDER BY created_at DESC`
      )
      .all(...distributionIds);
    distributions = distRows.map(mapDistribution);
    return NextResponse.json({ distributions, items });
  }

  const distConditions: string[] = [];
  const distParams: Array<string> = [];
  if (projectId) {
    distConditions.push('project_id = ?');
    distParams.push(projectId);
  }
  const distWhere = distConditions.length ? `WHERE ${distConditions.join(' AND ')}` : '';
  const distRows = db
    .prepare(`SELECT * FROM distributions ${distWhere} ORDER BY created_at DESC`)
    .all(...distParams);
  distributions = distRows.map(mapDistribution);

  const itemConditions: string[] = [];
  const itemParams: Array<string> = [];
  if (projectId) {
    itemConditions.push('project_id = ?');
    itemParams.push(projectId);
  }
  const itemWhere = itemConditions.length ? `WHERE ${itemConditions.join(' AND ')}` : '';
  const itemRows = db
    .prepare(`SELECT * FROM distribution_items ${itemWhere} ORDER BY created_at DESC`)
    .all(...itemParams);
  items = itemRows.map(mapDistributionItem);

  return NextResponse.json({ distributions, items });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { distribution, items } = body;

  if (!distribution || !items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Distribution and items are required' }, { status: 400 });
  }

  const createdAt = distribution.createdAt || new Date().toISOString();
  const distributionId = distribution.id || `dist_${randomUUID()}`;
  const db = getDb();

  const createdDistribution: Distribution = {
    id: distributionId,
    projectId: distribution.projectId,
    projectName: distribution.projectName || 'Project',
    creatorUserId: distribution.creatorUserId,
    totalAmount: Number(distribution.totalAmount),
    chainId: Number(distribution.chainId),
    txHash: distribution.txHash,
    createdAt,
  };

  const createdItems: DistributionItem[] = items.map((item: any) => ({
    id: item.id || `dist_item_${randomUUID()}`,
    distributionId,
    projectId: createdDistribution.projectId,
    projectName: createdDistribution.projectName,
    contributorUserId: item.contributorUserId,
    contributorWallet: item.contributorWallet,
    amount: Number(item.amount),
    createdAt,
    txHash: createdDistribution.txHash,
    chainId: createdDistribution.chainId,
  }));

  const insert = db.transaction(() => {
    db.prepare(
      `INSERT INTO distributions (id, project_id, project_name, creator_user_id, total_amount, chain_id, tx_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      createdDistribution.id,
      createdDistribution.projectId,
      createdDistribution.projectName,
      createdDistribution.creatorUserId,
      createdDistribution.totalAmount,
      createdDistribution.chainId,
      createdDistribution.txHash,
      createdDistribution.createdAt
    );

    const insertItem = db.prepare(
      `INSERT INTO distribution_items (id, distribution_id, project_id, project_name, contributor_user_id, contributor_wallet, amount, created_at, tx_hash, chain_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const item of createdItems) {
      insertItem.run(
        item.id,
        item.distributionId,
        item.projectId,
        item.projectName,
        item.contributorUserId,
        item.contributorWallet,
        item.amount,
        item.createdAt,
        item.txHash,
        createdDistribution.chainId
      );
    }
  });

  insert();
  return NextResponse.json({ distribution: createdDistribution, items: createdItems }, { status: 201 });
}
