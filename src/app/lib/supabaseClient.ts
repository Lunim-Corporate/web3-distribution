import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(url, anonKey);

export async function fetchProjectByName(name: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('id,name,description,total_revenue,is_public,created_at,cover_image,status,progress')
    .ilike('name', `%${name}%`)
    .limit(1)
    .single();
  if (error) throw error;
  return data;
}