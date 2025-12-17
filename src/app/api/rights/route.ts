import { NextResponse } from 'next/server';
import { mockRights } from '@/data/mockData';

let rightsStore = [...mockRights];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const status = searchParams.get('status');

  let filteredRights = rightsStore;

  // Filter by user if userId is provided
  if (userId) {
    filteredRights = filteredRights.filter(r => r.ownerId === userId);
  }

  // Filter by status if provided
  if (status) {
    filteredRights = filteredRights.filter(r => r.status === status);
  }

  return NextResponse.json(filteredRights);
}

export async function POST(request: Request) {
  const body = await request.json();

  const newRight = {
    id: `right_${Date.now()}`,
    projectId: body.projectId || '',
    projectName: body.projectName || 'Untitled Project',
    rightsType: body.rightsType || 'Rights',
    owner: body.owner || 'Unassigned',
    ownerId: body.ownerId || '',
    status: body.status || 'Active',
    expirationDate: body.expirationDate || new Date().toISOString().split('T')[0],
    revenueShare: Number(body.revenueShare) || 0,
    createdDate: new Date().toISOString().split('T')[0],
  };

  rightsStore = [newRight, ...rightsStore];
  return NextResponse.json(newRight, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Right id is required' }, { status: 400 });
  }

  rightsStore = rightsStore.map(right =>
    right.id === id ? { ...right, ...updates } : right
  );

  const updated = rightsStore.find(r => r.id === id);
  return NextResponse.json(updated);
}

