import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  throw new Error('Missing Supabase server env variables');
}

export const supabaseAdmin = createClient(url, serviceKey);

export async function computeDistributions(
  projectId: string,
  amountCents: number
) {
  const { data: shares, error } = await supabaseAdmin
    .from('project_contributors')
    .select('user_id,revenue_share')
    .eq('project_id', projectId);

  if (error) throw error;

  return (shares || []).map((s: { user_id: string; revenue_share: number | string }) => ({
    user_id: s.user_id,
    percent: Number(s.revenue_share),
    amount_cents: Math.round((Number(s.revenue_share) / 100) * amountCents),
  }));
}