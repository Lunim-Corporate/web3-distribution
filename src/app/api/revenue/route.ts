import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';
import { normalizePaymentStatus } from '@/lib/utils';

import { getUserEarnings } from '@/lib/web3/subgraph';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const isWeb3 = searchParams.get('web3') === 'true';
  const projectId = searchParams.get('projectId');

  try {
    // If Web3 mode is active and we have an address, mix in protocol data
    let web3Earnings: any = null;
    if (isWeb3 && address) {
      web3Earnings = await getUserEarnings(address).catch(() => null);
    }

    let query = supabaseAdmin
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: rawPayments, error } = await query;

    if (error) throw error;

    let payments = rawPayments || [];

    // Manually fetch and filter by users if address is provided
    let usersMap: Record<string, {name: string, wallet_address: string}> = {};
    if (payments.length > 0) {
      const userIds = Array.from(new Set(payments.map(p => p.user_id).filter(Boolean)));
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, name, wallet_address')
          .in('id', userIds);
        
        if (users) {
          usersMap = users.reduce((acc: any, u) => {
            acc[u.id] = u;
            return acc;
          }, {});
        }
      }
    }

    if (address) {
      payments = payments.filter(p => usersMap[p.user_id]?.wallet_address === address);
    }

    if (projectId && projectId !== 'all') {
      payments = payments.filter(p => p.project_id === projectId);
    }

    // Manually fetch projects
    let projectsMap: Record<string, string> = {};
    if (payments.length > 0) {
      const projectIds = Array.from(new Set(payments.map(p => p.project_id).filter(Boolean)));
      if (projectIds.length > 0) {
        const { data: projects } = await supabaseAdmin
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        
        if (projects) {
          projectsMap = projects.reduce((acc: any, proj) => {
            acc[proj.id] = proj.name;
            return acc;
          }, {});
        }
      }
    }

    const formatted = payments.map((pr) => {
      const amount = Number(pr.amount ?? 0) / 100;
      const status = normalizePaymentStatus(pr.status ?? 'completed');

      const projectName = projectsMap[pr.project_id] || 'Unknown Project';
      const recipientName = usersMap[pr.user_id]?.name || 'Unknown';

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
