import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/db';
import { TopUp } from '@/lib/types';

export const runtime = 'nodejs';

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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get('projectId');
  const creatorUserId = searchParams.get('creatorUserId');

  const db = getDb();
  const conditions: string[] = [];
  const params: Array<string> = [];

  if (projectId) {
    conditions.push('project_id = ?');
    params.push(projectId);
  }
  if (creatorUserId) {
    conditions.push('creator_user_id = ?');
    params.push(creatorUserId);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM topups ${where} ORDER BY created_at DESC`)
    .all(...params);

  return NextResponse.json(rows.map(mapTopUp));
}

export async function POST(request: Request) {
  const body = await request.json();
  const { projectId, projectName, creatorUserId, amount, currency, chainId, txHash } = body;

  if (!projectId || !creatorUserId || !amount || !currency || !chainId || !txHash) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const createdAt = body.createdAt || new Date().toISOString();
  const id = `topup_${randomUUID()}`;
  const db = getDb();

  db.prepare(
    `INSERT INTO topups (id, project_id, project_name, creator_user_id, amount, currency, chain_id, tx_hash, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    projectId,
    projectName || 'Project',
    creatorUserId,
    Number(amount),
    currency,
    Number(chainId),
    txHash,
    createdAt
  );

  return NextResponse.json(
    {
      id,
      projectId,
      projectName: projectName || 'Project',
      creatorUserId,
      amount: Number(amount),
      currency,
      chainId: Number(chainId),
      txHash,
      createdAt,
    },
    { status: 201 }
  );
}
