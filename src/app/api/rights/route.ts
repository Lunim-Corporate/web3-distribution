import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('creative_rights')
      .select('*, projects(name), users:owner_id(id,name,email)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    const formatted = (data || []).map((r) => {
      const row = r as Record<string, unknown>;
      const projectRow = row['projects'] as Record<string, unknown> | undefined;
      const ownerRow = row['users'] as Record<string, unknown> | undefined;

      const projectName =
        projectRow && typeof projectRow.name === 'string' ? projectRow.name : 'Unknown Project';
      const ownerName =
        ownerRow && typeof ownerRow.name === 'string'
          ? ownerRow.name
          : ownerRow && typeof ownerRow.email === 'string'
            ? ownerRow.email
            : 'Unknown';

      return {
        id: String(row.id ?? ''),
        projectId: String(row.project_id ?? ''),
        projectName,
        rightsType: String(row.rights_type ?? ''),
        owner: ownerName,
        ownerId: String(row.owner_id ?? ''),
        revenueShare: Number(row.revenue_share ?? 0),
        status: String(row.status ?? 'active'),
        expirationDate: String(row.expiration_date ?? ''),
      };
    });

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching rights:', error);
    return NextResponse.json([], { status: 200 });
  }
}


