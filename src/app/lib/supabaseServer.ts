import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

export const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
         !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
         !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
         !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder-key') &&
         !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key');
}


export async function computeDistributions(
  projectId: string,
  amountCents: number
) {
  const { data: shares, error } = await supabaseAdmin
    .from('rights_holders')
    .select('id,wallet_address,full_name,percentage')
    .eq('project_id', projectId);

  if (error) throw error;

  return (shares || []).map((s: { id: string; wallet_address: string; full_name: string; percentage: number | string }) => ({
    rights_holder_id: s.id,
    wallet_address: s.wallet_address,
    full_name: s.full_name,
    percent: Number(s.percentage),
    amount_cents: Math.round((Number(s.percentage) / 100) * amountCents),
  }));
}