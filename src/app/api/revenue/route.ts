import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { normalizePaymentStatus } from '@/lib/utils';

import { getUserEarnings } from '@/lib/web3/subgraph';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const isWeb3 = searchParams.get('web3') === 'true';

  try {
    // If Web3 mode is active and we have an address, mix in protocol data
    let web3Earnings: any = null;
    if (isWeb3 && address) {
      web3Earnings = await getUserEarnings(address).catch(() => null);
    }

    let query = supabaseAdmin
      .from('payments')
      .select('*, projects(name), users!inner(name, wallet_address)')
      .order('created_at', { ascending: false });

    if (address) {
      query = query.eq('users.wallet_address', address);
    }

    const { data, error } = await query;

    if (error) throw error;
    
    const formatted = (data || []).map((p) => {
      const pr = p as Record<string, unknown>;
      const amount = Number(pr.amount ?? 0) / 100;
      const status = normalizePaymentStatus(pr.status ?? 'completed');

      const projectsRow = pr['projects'] as Record<string, unknown> | undefined;
      const projectName = projectsRow?.name || 'Unknown Project';

      const usersRow = pr['users'] as Record<string, unknown> | undefined;
      const recipientName = usersRow?.name || 'Unknown';

      return {
        id: String(pr.id ?? ''),
        projectId: String(pr.project_id ?? ''),
        projectName,
        amount,
        txHash: String(pr.tx_hash ?? ''),
        source: String(pr.source ?? pr.payment_method ?? 'Direct Payment'),
        date: String(pr.created_at ?? pr.payment_date ?? ''),
        status,
        recipientName,
        splitPercentage: pr.split_percentage ? Number(pr.split_percentage) : 0,
      };
    });

    // If we have web3 data, we can either append it or replace metrics
    // For Phase 1, we return the base data but allow the UI to consume web3Earnings separately if needed
    
    return NextResponse.json({
      revenue: formatted,
      web3: web3Earnings,
    });
  } catch (error) {
    console.error('CRITICAL Error fetching revenue:', error);
    return NextResponse.json({ revenue: [], web3: null }, { status: 200 });
  }
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
