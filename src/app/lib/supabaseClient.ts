import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anonKey);

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