import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { getDb } from '@/lib/db';
import { mockProjects } from '@/data/mockData';
import { Project } from '@/lib/types';

export const runtime = 'nodejs';

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
          `pc_${randomUUID()}`,
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

export async function GET(request: Request) {
  seedProjects();
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('userEmail');

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

  let projectRows: any[] = [];
  if (userId || userEmail) {
    const filters: string[] = [];
    const params: string[] = [];
    if (userId) {
      filters.push('contributor_id = ?');
      params.push(userId);
    }
    if (userEmail) {
      filters.push('email = ?');
      params.push(userEmail);
    }
    const projectIds = db
      .prepare(`SELECT DISTINCT project_id FROM project_contributors WHERE ${filters.join(' OR ')}`)
      .all(...params)
      .map((row: any) => row.project_id);
    if (projectIds.length === 0) return NextResponse.json([]);
    const placeholders = projectIds.map(() => '?').join(', ');
    projectRows = db.prepare(`SELECT * FROM projects WHERE id IN (${placeholders})`).all(...projectIds);
  } else {
    projectRows = db.prepare('SELECT * FROM projects').all();
  }

  const projects = projectRows.map((row) =>
    mapProject(row, contributorsByProject[row.id] || [])
  );
  return NextResponse.json(projects);
}

export async function POST(request: Request) {
  const db = getDb();
  const body = await request.json();

  const newProject = {
    id: `proj_${randomUUID()}`,
    name: body.name || 'Untitled Project',
    type: body.type || 'General',
    status: body.status || 'In Progress',
    description: body.description || 'New project created by admin',
    totalRevenue: body.totalRevenue ? Number(body.totalRevenue) : 0,
    pendingPayments: body.pendingPayments ? Number(body.pendingPayments) : 0,
    creatorId: body.creatorId || body.ownerId || '',
    contributors: body.contributors || [],
    createdDate: new Date().toISOString().split('T')[0],
    lastUpdated: new Date().toISOString().split('T')[0],
    contractAddress: body.contractAddress || '',
    coverImage: body.coverImage || 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
    progress: body.progress ? Number(body.progress) : 0,
  };

  const insertProject = db.prepare(
    `INSERT INTO projects (id, name, type, status, description, total_revenue, pending_payments, creator_id, created_date, last_updated, contract_address, cover_image, progress)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertContributor = db.prepare(
    `INSERT INTO project_contributors (id, project_id, contributor_id, name, email, avatar, revenue_share, total_earned, role, wallet_address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const tx = db.transaction(() => {
    insertProject.run(
      newProject.id,
      newProject.name,
      newProject.type,
      newProject.status,
      newProject.description,
      Number(newProject.totalRevenue || 0),
      Number(newProject.pendingPayments || 0),
      newProject.creatorId || '',
      newProject.createdDate,
      newProject.lastUpdated,
      newProject.contractAddress || '',
      newProject.coverImage || '',
      Number(newProject.progress || 0)
    );

    for (const contributor of newProject.contributors || []) {
      insertContributor.run(
        `pc_${randomUUID()}`,
        newProject.id,
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
  });

  tx();
  return NextResponse.json(newProject, { status: 201 });
}

export async function PUT(request: Request) {
  const db = getDb();
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
  }

  const nextLastUpdated = new Date().toISOString().split('T')[0];
  const fields: string[] = [];
  const params: any[] = [];
  const columnMap: Record<string, string> = {
    name: 'name',
    type: 'type',
    status: 'status',
    description: 'description',
    totalRevenue: 'total_revenue',
    pendingPayments: 'pending_payments',
    creatorId: 'creator_id',
    createdDate: 'created_date',
    contractAddress: 'contract_address',
    coverImage: 'cover_image',
    progress: 'progress',
  };
  for (const [key, column] of Object.entries(columnMap)) {
    if (updates[key] !== undefined) {
      fields.push(`${column} = ?`);
      params.push(
        key === 'totalRevenue' || key === 'pendingPayments' || key === 'progress'
          ? Number(updates[key] || 0)
          : updates[key]
      );
    }
  }
  fields.push('last_updated = ?');
  params.push(nextLastUpdated, id);

  const tx = db.transaction(() => {
    if (fields.length > 0) {
      db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    }
    if (Array.isArray(updates.contributors)) {
      db.prepare('DELETE FROM project_contributors WHERE project_id = ?').run(id);
      const insertContributor = db.prepare(
        `INSERT INTO project_contributors (id, project_id, contributor_id, name, email, avatar, revenue_share, total_earned, role, wallet_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const contributor of updates.contributors) {
        insertContributor.run(
          `pc_${randomUUID()}`,
          id,
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

  const updatedRow = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  const contributorRows = db
    .prepare('SELECT * FROM project_contributors WHERE project_id = ?')
    .all(id);
  const contributors = contributorRows.map((row: any) => ({
    id: row.contributor_id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    revenueShare: Number(row.revenue_share || 0),
    totalEarned: Number(row.total_earned || 0),
    role: row.role,
    walletAddress: row.wallet_address || '',
  }));
  const updated = updatedRow ? mapProject(updatedRow, contributors) : null;
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const db = getDb();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM project_contributors WHERE project_id = ?').run(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  });
  tx();
  return NextResponse.json({ success: true });
}
