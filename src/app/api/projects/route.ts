import { NextResponse } from 'next/server';
import { mockProjects } from '@/data/mockData';

let projectsStore = [...mockProjects];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const userEmail = searchParams.get('userEmail');

  let filteredProjects = projectsStore;

  // Filter by user if userId or userEmail is provided
  if (userId || userEmail) {
    filteredProjects = projectsStore.filter(project =>
      project.contributors.some(c => 
        (userId && c.id === userId) || (userEmail && c.email === userEmail)
      )
    );
  }

  return NextResponse.json(filteredProjects);
}

export async function POST(request: Request) {
  const body = await request.json();

  const newProject = {
    id: `proj_${Date.now()}`,
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

  projectsStore = [newProject, ...projectsStore];
  return NextResponse.json(newProject, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
  }

  projectsStore = projectsStore.map(project =>
    project.id === id ? { ...project, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : project
  );

  const updated = projectsStore.find(p => p.id === id);
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Project id is required' }, { status: 400 });
  }

  projectsStore = projectsStore.filter(project => project.id !== id);
  return NextResponse.json({ success: true });
}

