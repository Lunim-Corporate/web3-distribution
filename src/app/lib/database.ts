import { supabase } from './supabaseClient';

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*, rights_holders(*), transactions(*)')
    .eq('id', id)
    .single();
  if (error) throw error;

  return {
    ...data,
    total_revenue: data.total_distributed || 0,
    cover_image: data.poster_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
    project_contributors: (data.rights_holders || []).map((h: any) => ({
      id: h.id,
      project_id: data.id,
      user_id: h.id,
      role: h.role,
      revenue_share: h.percentage,
      total_earned: h.total_received || 0,
      users: {
        name: h.name || h.full_name || 'Unknown',
        wallet_address: h.wallet_address,
        avatar: h.avatar_initials || '',
      }
    })),
    payments: (data.transactions || []).map((t: any) => ({
      id: t.id,
      project_id: data.id,
      amount: t.total_amount_eth || t.total_amount || 0,
      source: 'Client Payment',
      tx_hash: t.tx_hash,
      payment_date: t.created_at,
    })),
    creative_rights: [],
    milestones: []
  };
}

export async function addContributor(data: any) {
  const { data: inserted, error } = await supabase
    .from('rights_holders')
    .insert([{
      project_id: data.project_id,
      user_id: data.user_id || null,
      full_name: data.name || 'Unknown',
      role: data.role || 'Contributor',
      wallet_address: data.wallet_address || '0x0000000000000000000000000000000000000000',
      percentage: Number(data.revenue_share || 0),
      email: data.email || null,
      status: 'ACTIVE'
    }])
    .select()
    .single();
  if (error) throw error;
  return inserted;
}

export async function getProjectContributors(projectId: string) {
  const { data, error } = await supabase
    .from('rights_holders')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;

  return data.map((h: any) => ({
    id: h.id,
    project_id: h.project_id,
    user_id: h.user_id || h.id,
    role: h.role,
    revenue_share: h.percentage,
    total_earned: h.total_received || 0,
    users: {
      name: h.full_name || 'Unknown',
      wallet_address: h.wallet_address,
      avatar: h.avatar_initials || '',
    }
  }));
}

export async function getPayments(projectId: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return data.map((t: any) => ({
    id: t.id,
    project_id: t.project_id,
    amount: t.total_amount_eth || t.total_amount || 0,
    source: 'Client Payment',
    tx_hash: t.tx_hash,
    payment_date: t.created_at,
  }));
}

export async function recordPayment(data: {
  project_id: string;
  amount_cents: number;
  source: string;
}): Promise<any> {
  const amountEth = data.amount_cents / 100;

  const { data: inserted, error } = await supabase
    .from('transactions')
    .insert([{
      project_id: data.project_id,
      tx_hash: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      sender_address: '0x0000000000000000000000000000000000000000',
      total_amount_eth: amountEth,
      method: 'manual',
      is_demo: false,
      status: 'confirmed',
    }])
    .select()
    .single();
  if (error) throw error;
  return inserted;
}

export async function getMilestones(projectId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function generateRevenueReport(startDate: string, endDate: string, projectId?: string, walletAddress?: string, client: any = supabase, isDemo?: boolean) {
  try {
    const endOfDay = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;

    let paymentQuery = client
      .from('transactions')
      .select('*, projects(id, name), transaction_splits(*)')
      .gte('created_at', startDate)
      .lte('created_at', endOfDay);

    if (projectId && projectId !== 'all') paymentQuery = paymentQuery.eq('project_id', projectId);

    if (isDemo !== undefined) {
      paymentQuery = isDemo
        ? paymentQuery.eq('is_demo', true)
        : paymentQuery.or('is_demo.eq.false,is_demo.is.null');
    }

    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) throw paymentError;

    const sourceMap = new Map<string, { amount: number; count: number }>();
    const projectMap = new Map<string, {
      revenue: number;
      paid: number;
      contributors: Set<string>;
      name: string;
      splitSummary: Map<string, { name: string; amount: number; percentage: number }>
    }>();
    const uniqueTxHashes = new Set<string>();
    let totalRevenue = 0;

    payments?.forEach((payment: Record<string, any>) => {
      const amount = Number(payment.total_amount_eth || payment.total_amount) || 0;
      totalRevenue += amount;
      if (payment.tx_hash) uniqueTxHashes.add(payment.tx_hash);

      const source = 'Client Payment';
      sourceMap.set(source, {
        amount: (sourceMap.get(source)?.amount || 0) + amount,
        count: (sourceMap.get(source)?.count || 0) + 1,
      });

      if (payment.projects) {
        const projId = payment.projects.id;
        const current = projectMap.get(projId) || {
          revenue: 0,
          paid: 0,
          contributors: new Set<string>(),
          name: payment.projects.name || 'Unknown',
          splitSummary: new Map<string, { name: string; amount: number; percentage: number }>()
        };
        current.revenue += amount;
        current.paid += amount;

        if (payment.transaction_splits) {
          payment.transaction_splits.forEach((s: any) => {
            current.contributors.add(s.rights_holder_id);
            const holderId = s.rights_holder_id;
            const existing = current.splitSummary.get(holderId) || {
              name: s.full_name || 'Unknown',
              amount: 0,
              percentage: s.percentage || 0
            };
            existing.amount += Number(s.amount_eth || 0);
            current.splitSummary.set(holderId, existing);
          });
        }

        projectMap.set(projId, current);
      }
    });

    const transactionCount = uniqueTxHashes.size || 0;

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reportPeriod: { startDate, endDate },
      totalRevenue,
      totalPaid: totalRevenue,
      totalPending: 0,
      averagePaymentAmount: transactionCount > 0 ? totalRevenue / transactionCount : 0,
      paymentCount: transactionCount,
      sources: Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        amount: data.amount,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0,
        paymentCount: transactionCount,
      })),
      projects: Array.from(projectMap.entries()).map(([projId, data]: [string, any]) => ({
        projectId: projId,
        projectName: data.name,
        totalRevenue: data.revenue,
        paidRevenue: data.paid,
        pendingRevenue: 0,
        contributorCount: data.contributors.size,
        sharePercentage: totalRevenue > 0 ? (data.revenue / totalRevenue) * 100 : 0,
        splits: Array.from(data.splitSummary.values())
      })),
      topContributors: [],
      trends: payments?.map((p: any) => ({
        date: p.created_at,
        amount: Number(p.total_amount_eth || p.total_amount) || 0,
        source: 'Client Payment',
        projectName: p.projects?.name || 'Unknown',
        ethPriceAtTx: p.eth_price_at_tx ? Number(p.eth_price_at_tx) : null,
      })) || [],
    };
  } catch (error) {
    console.error('Failed to generate revenue report:', error);
    throw error;
  }
}
