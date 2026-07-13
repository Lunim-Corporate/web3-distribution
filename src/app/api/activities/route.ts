import { NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/app/lib/supabaseServer';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';
import { demoActivities } from '@/app/lib/demoData';

export async function GET(req: Request) {
  try {
    const ethPrice = await getEthPriceUSD();
    // Rate limit: read tier
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    // Auth required
    await requireAuth();

    const { searchParams } = new URL(req.url);
    const isDemoMode = isDemoAccessEnabled && searchParams.get('demo') === 'true';

    const configured = isSupabaseConfigured();

    if (configured) {
      // 1. Try to get actual activities from the activities table
      const actQuery = supabaseAdmin
        .from('activities')
        .select('*, projects(name)')
        .order('timestamp', { ascending: false });

      const { data: directActivities, error: activityError } = await actQuery.limit(15);

      if (!activityError && directActivities && directActivities.length > 0) {
        return NextResponse.json(directActivities.map(a => ({
          id: a.id,
          activity_type: a.action || 'info',
          description: a.description,
          projectName: a.projects?.name || 'LUNIM',
          created_at: a.timestamp,
          icon: a.action === 'payment_recorded' ? '💰' : '🔔'
        })));
      }
    } else {
      return NextResponse.json(demoActivities.map(a => ({
        id: a.id,
        activity_type: a.action || 'info',
        description: a.description,
        projectName: a.project_id === 'demo-project-1' ? 'Neon Requiem' : 'The Salt Coast',
        created_at: a.timestamp,
        icon: a.action === 'holder_added' ? '👥' : '💰'
      })));
    }

    // 2. Fallback to transactions if activities table is empty (for legacy display)
    let txQuery = supabaseAdmin
      .from('transactions')
      .select('id, total_amount_eth, created_at, tx_hash, projects(name)')
      .order('created_at', { ascending: false });

    if (isDemoMode) {
      txQuery = txQuery.eq('is_demo', true);
    } else {
      txQuery = txQuery.or('is_demo.eq.false,is_demo.is.null');
    }

    const { data: transactions, error } = await txQuery.limit(10);

    if (error) throw error;

    const activities = (transactions || []).map((p: any) => {
      const projectName = p.projects?.name || 'Unknown Project';
      const ethAmount = Number(p.total_amount_eth || 0);
      const usdValue = ethAmount * ethPrice; 
      
      const formattedUSD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(usdValue);
      const formattedETH = `${ethAmount.toFixed(4)} ETH`;

      return {
        id: p.id,
        activity_type: 'payment_recorded',
        description: `Revenue split of ${formattedETH} (${formattedUSD}) distributed for ${projectName}.`,
        projectName,
        created_at: p.created_at,
        icon: '💰'
      };
    });

    return NextResponse.json(activities);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;
