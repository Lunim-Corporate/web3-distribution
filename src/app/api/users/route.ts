import { NextResponse } from 'next/server';
import { mockUsers } from '@/data/mockData';

let usersStore = [...mockUsers];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const email = searchParams.get('email');

  let filteredUsers = usersStore;

  // Filter by role if provided
  if (role) {
    filteredUsers = filteredUsers.filter(u => u.role === role);
  }

  // Filter by email if provided
  if (email) {
    filteredUsers = filteredUsers.filter(u => u.email === email);
  }

  return NextResponse.json(filteredUsers);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, role } = body;

  if (!email || !role) {
    return NextResponse.json({ error: 'Email and role are required' }, { status: 400 });
  }

  const newUser = {
    id: `user_${Date.now()}`,
    name: name || email.split('@')[0],
    email,
    role,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(email)}`,
    walletAddress: '',
    totalEarnings: 0,
    activeProjects: 0,
    joinDate: new Date().toISOString().split('T')[0],
    isOnline: false,
  };

  usersStore = [newUser, ...usersStore];
  return NextResponse.json(newUser, { status: 201 });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, role, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  usersStore = usersStore.map(user =>
    user.id === id ? { ...user, role: role || user.role, ...updates } : user
  );

  const updated = usersStore.find(u => u.id === id);
  return NextResponse.json(updated);
}

