import { supabase } from './supabaseClient';
import type { ProjectUpdate, ContributorUpdate, CreativeRightUpdate, MilestoneUpdate } from './types';

// Projects
export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      project_contributors(*, users(*)),
      payments(*),
      creative_rights(*),
      milestones(*)
    `)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProject(project: {
  name: string;
  description?: string;
  type?: string;
  cover_image?: string;
  owner_id: string;
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert([project])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, updates: ProjectUpdate) {
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
export async function addContributor(data: {
  project_id: string;
  user_id: string;
  role: string;
  revenue_share: number;
}) {
  const { data: result, error } = await supabase
    .from('project_contributors')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getProjectContributors(projectId: string) {
  const { data, error } = await supabase
    .from('project_contributors')
    .select('*, users(*)')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function updateContributor(id: string, updates: ContributorUpdate) {
  const { data, error } = await supabase
    .from('project_contributors')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Payments
export async function recordPayment(data: {
  project_id: string;
  amount_cents: number;
  source?: string;
  tx_hash?: string;
}) {
  const amountCents = data.amount_cents;
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert([
      {
        project_id: data.project_id,
        amount: amountCents,
        source: data.source,
        tx_hash: data.tx_hash,
      },
    ])
    .select()
    .single();
  
  if (paymentError) throw paymentError;

  // Update project total revenue
  const { data: project } = await supabase
    .from('projects')
    .select('total_revenue')
    .eq('id', data.project_id)
    .single();

  const newTotal = (project?.total_revenue || 0) + amountCents;

  await supabase
    .from('projects')
    .update({ total_revenue: newTotal })
    .eq('id', data.project_id);

  // Distribute to contributors
  const { data: contributors } = await supabase
    .from('project_contributors')
    .select('*')
    .eq('project_id', data.project_id);

  if (contributors) {
    for (const contributor of contributors) {
      const shareAmount = Math.round((contributor.revenue_share / 100) * amountCents);
      await supabase
        .from('project_contributors')
        .update({ total_earned: (contributor.total_earned || 0) + shareAmount })
        .eq('id', contributor.id);
    }
  }

  return payment;
}

export async function getPayments(projectId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('project_id', projectId)
    .order('payment_date', { ascending: false });
  if (error) throw error;
  return data;
}

// Creative Rights
export async function addCreativeRight(data: {
  project_id: string;
  rights_type: string;
  owner_id: string;
  revenue_share: number;
  expiration_date?: string;
}) {
  const { data: result, error } = await supabase
    .from('creative_rights')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getCreativeRights(projectId: string) {
  const { data, error } = await supabase
    .from('creative_rights')
    .select('*, users:owner_id(*)')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function updateCreativeRight(id: string, updates: CreativeRightUpdate) {
  const { data, error } = await supabase
    .from('creative_rights')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Milestones
export async function addMilestone(data: {
  project_id: string;
  title: string;
  target_amount: number;
  deadline?: string;
}) {
  const { data: result, error } = await supabase
    .from('milestones')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getMilestones(projectId: string) {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId);
  if (error) throw error;
  return data;
}

export async function updateMilestone(id: string, updates: MilestoneUpdate) {
  const { data, error } = await supabase
    .from('milestones')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Search
export async function searchProjects(query: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Activities
export async function logActivity(data: {
  user_id: string;
  project_id?: string;
  activity_type: string;
  description: string;
}) {
  const { data: result, error } = await supabase
    .from('activities')
    .insert([data])
    .select()
    .single();
  if (error) throw error;
  return result;
}

export async function getActivities(userId: string) {
  const { data, error } = await supabase
    .from('activities')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

// Reports
export async function generateRevenueReport(startDate: string, endDate: string, projectId?: string) {
  try {
    // Step 1: Fetch payments with projects
    let paymentQuery = supabase
      .from('payments')
      .select('*, projects(id, name)')
      .gte('payment_date', startDate)
      .lte('payment_date', endDate);

    if (projectId) {
      paymentQuery = paymentQuery.eq('project_id', projectId);
    }

    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) throw paymentError;

    // Step 2: Fetch contributors if we have projects
    const projectIds = Array.from(new Set(payments?.map(p => p.project_id) || []));
    let contributors: any[] = [];
    if (projectIds.length > 0) {
      const { data: contribs, error: contribError } = await supabase
        .from('project_contributors')
        .select('project_id, user_id, revenue_share')
        .in('project_id', projectIds);
      if (!contribError) contributors = contribs || [];
    }

    // Aggregate data
    const sourceMap = new Map<string, { amount: number; count: number }>();
    const projectMap = new Map<string, { revenue: number; paid: number; contributors: Set<string>; name: string }>();
    let totalRevenue = 0;

    payments?.forEach((payment) => {
      // HANDLE CENTS -> GBP/USD (divide by 100)
      const amount = (Number(payment.amount) || 0) / 100;
      totalRevenue += amount;

      // By source
      const source = payment.source || 'Unknown';
      sourceMap.set(source, {
        amount: (sourceMap.get(source)?.amount || 0) + amount,
        count: (sourceMap.get(source)?.count || 0) + 1,
      });

      // By project
      if (payment.projects) {
        const projId = payment.projects.id;
        const current = projectMap.get(projId) || { 
          revenue: 0, 
          paid: 0, 
          contributors: new Set<string>(),
          name: payment.projects.name || 'Unknown'
        };
        
        current.revenue += amount;
        current.paid += amount;
        
        // Find contributors for this project
        contributors.filter(c => c.project_id === projId).forEach(c => {
          current.contributors.add(c.user_id);
        });

        projectMap.set(projId, current);
      }
    });

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reportPeriod: { startDate, endDate },
      totalRevenue,
      totalPaid: totalRevenue,
      totalPending: 0,
      averagePaymentAmount: payments?.length ? totalRevenue / payments.length : 0,
      paymentCount: payments?.length || 0,
      sources: Array.from(sourceMap.entries()).map(([source, data]) => ({
        source,
        amount: data.amount,
        percentage: totalRevenue > 0 ? (data.amount / totalRevenue) * 100 : 0,
        paymentCount: data.count,
      })),
      projects: Array.from(projectMap.entries()).map(([projId, data]: [string, any]) => ({
        projectId: projId,
        projectName: data.name,
        totalRevenue: data.revenue,
        paidRevenue: data.paid,
        pendingRevenue: 0,
        contributorCount: data.contributors.size,
      })),
      topContributors: [],
      trends: payments?.map((p) => ({
        date: p.payment_date,
        amount: (Number(p.amount) || 0) / 100,
        source: p.source,
        projectName: p.projects?.name || 'Unknown',
      })) || [],
    };
  } catch (error) {
    console.error('Failed to generate revenue report:', error);
    throw error;
  }
}