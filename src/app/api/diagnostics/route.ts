import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { requireAdmin } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
interface DiagnosticsResult {
  timestamp: string;
  environment: {
    supabaseUrl: string;
    supabaseKey: string;
    serviceRole: string;
    privyAppId: string;
    stripeKey: string;
    chainId: string;
  };
  tables: Record<string, {
    status: string;
    recordCount?: number;
    error?: string;
  }>;
}

export async function GET() {
  try {
    const blocked = await checkRateLimit('sensitive');
    if (blocked) return blocked;

    // Admin only — diagnostics exposes infrastructure details
    await requireAdmin();

    const diagnostics: DiagnosticsResult = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
        serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
        privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID ? '✓ Set' : '✗ Missing',
        stripeKey: process.env.STRIPE_SECRET_KEY ? '✓ Set' : '✗ Missing',
        chainId: process.env.NEXT_PUBLIC_CHAIN_ID || 'Not set (defaults to Hardhat 31337)',
      },
      tables: {},
    };

    // Test each table — use the actual schema tables
    const tables = ['users_profile', 'projects', 'rights_holders', 'transactions', 'transaction_splits', 'activities'];

    for (const table of tables) {
      try {
        const { count, error } = await supabaseAdmin
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          diagnostics.tables[table] = {
            status: '✗ Error',
            error: error.message,
          };
        } else {
          diagnostics.tables[table] = {
            status: '✓ OK',
            recordCount: count ?? undefined,
          };
        }
      } catch (err) {
        diagnostics.tables[table] = {
          status: '✗ Exception',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      }
    }

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
