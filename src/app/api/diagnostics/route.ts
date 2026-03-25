import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

interface DiagnosticsResult {
  timestamp: string;
  environment: {
    supabaseUrl: string;
    supabaseKey: string;
    serviceRole: string;
  };
  tables: Record<string, {
    status: string;
    recordCount?: number;
    error?: string;
  }>;
}

export async function GET() {
  try {
    const diagnostics: DiagnosticsResult = {
      timestamp: new Date().toISOString(),
      environment: {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
        serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing',
      },
      tables: {},
    };

    // Test each table
    const tables = ['users', 'projects', 'project_contributors', 'creative_rights', 'payments', 'milestones', 'activities'];

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
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
