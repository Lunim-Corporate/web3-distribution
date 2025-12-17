import { NextResponse } from 'next/server';
import { mockRevenue } from '@/data/mockData';

let revenueStore = [...mockRevenue];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  let filteredRevenue = revenueStore;

  // Filter by user if userId is provided
  if (userId) {
    filteredRevenue = filteredRevenue.filter(r => r.contributorId === userId);
  }

  // Filter by status if provided
  if (status) {
    filteredRevenue = filteredRevenue.filter(r => r.status === status);
  }

  return NextResponse.json(filteredRevenue);
}

export async function POST(request: Request) {
  const body = await request.json();

  const newRevenue = {
    id: `rev_${Date.now()}`,
    projectId: body.projectId || '',
    projectName: body.projectName || 'Untitled Project',
    amount: Number(body.amount) || 0,
    date: body.date || new Date().toISOString().split('T')[0],
    source: body.source || 'Other',
    contributor: body.contributor || 'Project Revenue',
    contributorId: body.contributorId || 'project',
    status: body.status || 'Pending',
    transactionHash: body.transactionHash,
    emailTracked: !!body.emailTracked,
    splits: body.splits || [],
  };

  revenueStore = [newRevenue, ...revenueStore];
  return NextResponse.json(newRevenue, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Revenue id is required' }, { status: 400 });
  }

  revenueStore = revenueStore.map(rev =>
    rev.id === id ? { ...rev, ...updates } : rev
  );

  const updated = revenueStore.find(r => r.id === id);
  return NextResponse.json(updated);
}

