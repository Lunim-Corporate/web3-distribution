import { supabaseAdmin } from './supabaseServer';
import type { RevenueReport, RevenueBySource, RevenueByProject, RevenueTrend } from './types';

export async function generateRevenueReport(startDate: string, endDate: string, projectId?: string, walletAddress?: string): Promise<RevenueReport> {
  try {
    const endOfDay = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;

    // Step 1: Fetch payments
    let paymentQuery = supabaseAdmin
      .from('payments')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endOfDay);

    if (projectId && projectId !== 'all') {
      paymentQuery = paymentQuery.eq('project_id', projectId);
    }

    const { data: payments, error: paymentError } = await paymentQuery;
    if (paymentError) throw paymentError;

    // Step 2: Fetch all projects for mapping
    const { data: projects, error: projectError } = await supabaseAdmin.from('projects').select('id, name');
    if (projectError) throw projectError;
    const projectLookup = (projects || []).reduce((acc: any, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    // Step 3: Fetch contributors
    const projectIds = Array.from(new Set(payments?.map(p => p.project_id) || []));
    let contributors: any[] = [];
    if (projectIds.length > 0) {
      const { data: contribs, error: contribError } = await supabaseAdmin
        .from('project_contributors')
        .select('project_id, user_id, revenue_share, role')
        .in('project_id', projectIds);
      if (!contribError) contributors = contribs || [];
    }

    // Step 3.5: Fetch all users for name mapping
    const { data: allUsers } = await supabaseAdmin.from('users').select('id, name');
    const userNames: Record<string, string> = (allUsers || []).reduce((acc: any, u) => {
      acc[u.id] = u.name;
      return acc;
    }, {});

    // Step 4: Aggregate
    const sourceMap = new Map<string, { amount: number; count: number }>();
    const projectMap = new Map<string, { revenue: number; paid: number; contributors: Set<string>; name: string; rightsHolders: any[] }>();
    const uniqueTxHashes = new Set<string>();
    let totalRevenue = 0;

    payments?.forEach((payment) => {
      const amount = (Number(payment.amount) || 0) / 100;
      totalRevenue += amount;

      if (payment.tx_hash) {
        uniqueTxHashes.add(payment.tx_hash);
      } else {
        uniqueTxHashes.add(payment.id);
      }

      const source = payment.source || 'Client Payment';
      sourceMap.set(source, {
        amount: (sourceMap.get(source)?.amount || 0) + amount,
        count: (sourceMap.get(source)?.count || 0) + 1,
      });

      const projData = projectLookup[payment.project_id];
      if (projData) {
        const projId = projData.id;
        const current = projectMap.get(projId) || {
          revenue: 0,
          paid: 0,
          contributors: new Set<string>(),
          name: projData.name || 'Unknown',
          rightsHolders: []
        };
        
        current.revenue += amount;
        current.paid += amount;
        
        const projectContributors = contributors.filter(c => c.project_id === projId);
        current.rightsHolders = projectContributors.map(c => ({
          name: userNames[c.user_id] || 'Unknown',
          role: c.role || 'Contributor',
          percentage: c.revenue_share || 0
        }));
        projectContributors.forEach(c => {
          current.contributors.add(c.user_id);
        });

        projectMap.set(projId, current);
      }
    });

    const transactionCount = uniqueTxHashes.size || 0;

    return {
      id: `report-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      reportPeriod: { startDate, endDate },
      totalRevenue,
      totalPending: 0,
      averagePaymentAmount: transactionCount > 0 ? totalRevenue / transactionCount : 0,
      paymentCount: transactionCount,
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
        rightsHolders: data.rightsHolders || [],
      })),
      topContributors: [],
      trends: payments?.map((p) => ({
        date: p.payment_date || p.created_at,
        amount: (Number(p.amount) || 0) / 100,
        source: p.source || 'Client Payment',
        projectName: projectLookup[p.project_id]?.name || 'Unknown',
      })) || [],
    };
  } catch (error) {
    console.error('Failed to generate revenue report:', error);
    throw error;
  }
}
