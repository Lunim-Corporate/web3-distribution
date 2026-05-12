import { supabase } from './supabaseClient';
import type { ProjectUpdate, ContributorUpdate, CreativeRightUpdate, MilestoneUpdate } from './types';

// Projects
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  
  return data.map(d => ({
    ...d,
    total_revenue: d.total_distributed || 0,
    cover_image: d.poster_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop'
  }));
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      rights_holders(*),
      transactions(*)
    `)
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

export async function createProject(project: any) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: any) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Contributors
export async function addContributor(data: any) {
  return null; // Disabled for LUNIM read-only schema
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
    user_id: h.id,
    role: h.role,
    revenue_share: h.percentage,
    total_earned: h.total_received || 0,
    users: {
      name: h.name || h.full_name || 'Unknown',
      wallet_address: h.wallet_address,
      avatar: h.avatar_initials || '',
    }
  }));
}

export async function updateContributor(id: string, updates: any) {
  return null; // Disabled
}

// Payments
export async function recordPayment(data: any) {
  return null; // Handled by server/index.js contract listener now
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

// Creative Rights
export async function addCreativeRight(data: any) { return null; }
export async function getCreativeRights(projectId: string) { return []; }
export async function updateCreativeRight(id: string, updates: any) { return null; }

// Milestones
export async function addMilestone(data: any) { return null; }
export async function getMilestones(projectId: string) { return []; }
export async function updateMilestone(id: string, updates: any) { return null; }

// Search
export async function searchProjects(query: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(d => ({
    ...d,
    total_revenue: d.total_distributed || 0,
    cover_image: d.poster_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop'
  }));
}

// Activities
export async function logActivity(data: any) { return null; }
export async function getActivities(userId: string) { return []; }

// Reports
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
      if (isDemo) {
        paymentQuery = paymentQuery.eq('is_demo', true);
      } else {
        paymentQuery = paymentQuery.or('is_demo.eq.false,is_demo.is.null');
      }
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        
        // Process splits
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      trends: payments?.map((p: any) => ({
        date: p.created_at,
        amount: Number(p.total_amount_eth || p.total_amount) || 0,
        source: 'Client Payment',
        projectName: p.projects?.name || 'Unknown',
      })) || [],
    };
  } catch (error) {
    console.error('Failed to generate revenue report:', error);
    throw error;
  }
}