// Supabase Auth demo utilities for the Creative Rights Tracker.
// This replaces the previous localStorage-only “auth”, so your dashboard can safely
// interact with Supabase data under RLS (when enabled).

import { supabase } from '@/lib/supabaseClient';

type Role = 'admin' | 'creator' | 'contributor';

interface SimpleUser {
  name: string;
  email: string;
  role: Role;
}

const DEMO_PASSWORD = 'demo123';

const admin: SimpleUser = { name: 'Admin User', email: 'admin@risidio.com', role: 'admin' };
const demoUsers: SimpleUser[] = [
  { name: 'Alex Johnson', email: 'alex@example.com', role: 'creator' },
  { name: 'Sarah Chen', email: 'sarah@example.com', role: 'creator' },
  { name: 'Mike Rodriguez', email: 'mike@example.com', role: 'contributor' },
  { name: 'Emma Wilson', email: 'emma@example.com', role: 'contributor' },
  { name: 'David Kim', email: 'david@example.com', role: 'contributor' },
];

async function ensureAuthUser(user: SimpleUser) {
  const { error } = await supabase.auth.signUp({
    email: user.email,
    password: DEMO_PASSWORD,
    options: { data: { name: user.name, role: user.role } },
  });

  // Idempotency: ignore “already exists” errors.
  if (error) {
    const message = error && 'message' in error ? String(error.message) : String(error);
    const alreadyExists =
      message.toLowerCase().includes('already') || message.toLowerCase().includes('exists');
    if (!alreadyExists) throw error;
  }
}

export const setupAdminDemo = async () => {
  await ensureAuthUser(admin);
  for (const u of demoUsers) {
    await ensureAuthUser(u);
  }

  return {
    admin,
    demoUsers,
    totalUsers: demoUsers.length + 1,
  };
};

export async function quickLoginAsAdmin() {
  const { error } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password: DEMO_PASSWORD,
  });
  if (error) throw error;
}

export async function quickLoginAsCreator() {
  const firstCreator = demoUsers.find((u) => u.role === 'creator') ?? demoUsers[0];
  const { error } = await supabase.auth.signInWithPassword({
    email: firstCreator.email,
    password: DEMO_PASSWORD,
  });
  if (error) throw error;
}

export async function quickLoginAsContributor() {
  const firstContributor = demoUsers.find((u) => u.role === 'contributor') ?? demoUsers[0];
  const { error } = await supabase.auth.signInWithPassword({
    email: firstContributor.email,
    password: DEMO_PASSWORD,
  });
  if (error) throw error;
}
