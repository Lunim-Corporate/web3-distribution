import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

/**
 * GET /api/activities
 * 
 * Fetches recent transactions directly from the `payments` table
 * and synthetically formats them into an activity feed.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const mode = searchParams.get('mode'); // 'demo' or 'live'

    console.log(`[Activities API] Fetching for projectId: ${projectId}, mode: ${mode}`);

    // 0. Fetch projects for mapping (Resilient)
    let projectNamesMap: Record<string, string> = {};
    try {
      const { data: allProjects } = await supabaseAdmin.from('projects').select('id, name');
      if (allProjects) {
        projectNamesMap = allProjects.reduce((acc: any, p) => {
          acc[p.id] = p.name;
          return acc;
        }, {});
      }
    } catch (e) {
      console.warn('[Activities API] Projects fetch failed', e);
    }

    // 1. Fetch explicit activities (Resilient)
    let explicitActivities: any[] = [];
    try {
      let actQuery = supabaseAdmin
        .from('activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
        
      if (projectId && projectId !== 'all') {
        actQuery = actQuery.eq('project_id', projectId);
      }
      const { data: actData, error: actError } = await actQuery;
      
      if (!actError && actData) {
        // Filter explicit activities by description keywords for mode
        explicitActivities = actData.filter(a => {
          const desc = a.description?.toLowerCase() || '';
          const isDemoActivity = desc.includes('demo') || 
                               desc.includes('simulated') || 
                               desc.includes('client payment') ||
                               desc.includes('influx'); // common in seed
          
          if (mode === 'demo') return isDemoActivity;
          return !isDemoActivity;
        });
      }
    } catch (e) {
      console.warn('[Activities API] Explicit activities fetch failed', e);
    }
      
    // 2. Fetch recent payments (grouped by tx_hash)
    let paymentActivities: any[] = [];
    try {
      let payQuery = supabaseAdmin
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (projectId && projectId !== 'all') {
        payQuery = payQuery.eq('project_id', projectId);
      }

      // Strict Mode Filtering:
      if (mode === 'live') {
        payQuery = payQuery.eq('source', 'Blockchain');
      } else {
        // For demo/dev, show anything NOT explicit live blockchain transactions
        payQuery = payQuery.neq('source', 'Blockchain');
      }

      const { data: payments, error: payError } = await payQuery;
      if (!payError && payments && payments.length > 0) {
        // 3. Group payments by tx_hash to prevent duplicate project entries
        const groupedPaymentsMap = new Map();
        payments.forEach(p => {
          const hash = p.tx_hash || `no-hash-${p.id}`;
          if (!groupedPaymentsMap.has(hash)) {
            groupedPaymentsMap.set(hash, {
              ...p,
              projectName: projectNamesMap[p.project_id] || 'Project Update',
              total_batch_amount: 0,
              count: 0
            });
          }
          const item = groupedPaymentsMap.get(hash);
          item.total_batch_amount += (Number(p.amount) / 100);
          item.count += 1;
        });

        paymentActivities = Array.from(groupedPaymentsMap.values()).map(p => ({
          id: `pay-${p.tx_hash || p.id}`,
          project_id: p.project_id,
          activity_type: 'payment_recorded',
          description: `Distribution: $${p.total_batch_amount.toLocaleString()} for ${p.projectName}.`,
          created_at: p.created_at || new Date().toISOString(),
          is_synthetic: true
        }));
      }
    } catch (e) {
      console.warn('[Activities API] Payments fetch failed', e);
    }

    // 4. Merge and de-duplicate (prefer synthetic for payments)
    // Ensure all items have a valid date for sorting
    const combined = [...paymentActivities, ...explicitActivities.filter(a => a.activity_type !== 'payment_recorded')]
      .filter(a => a.created_at) // Must have date
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 20);

    console.log(`[Activities API] Returning ${combined.length} items`);
    return NextResponse.json(combined);
  } catch (error) {
    console.error('Critical Error fetching activities:', error);
    return NextResponse.json([], { status: 200 });
  }
}


export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
