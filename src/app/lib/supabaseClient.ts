import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDA0ODgwMDAsImV4cCI6MTkxNjA2NDAwMH0.placeholder-key';

export const supabase = createClient(url, anonKey);

export function isSupabaseConfigured(): boolean {
  const currentUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const currentKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  return !!currentUrl && 
         !currentUrl.includes('placeholder') &&
         !!currentKey &&
         !currentKey.includes('placeholder') &&
         !currentKey.includes('your-supabase-anon-key');
}


export async function fetchProjectByName(name: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, genre, description, poster_url, contract_address, network, status, total_distributed, created_at, updated_at')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}