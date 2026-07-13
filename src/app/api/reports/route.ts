import { NextResponse } from 'next/server';
import { generateRevenueReport } from '@/lib/database';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';
import type { RevenueReport, RevenueBySource, RevenueByProject } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const blocked = await checkRateLimit('read');
    if (blocked) return blocked;

    await requireAuth();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const isDemo = isDemoAccessEnabled && searchParams.get('demo') === 'true';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const report = await generateRevenueReport(startDate, endDate, projectId || undefined, undefined, supabaseAdmin, isDemo);

    return NextResponse.json({ data: report }, { status: 200 });
  } catch (error: any) {
    const msg = error?.message || String(error) || 'Unknown error';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAuth();

    const body = await request.json();
    const { startDate, endDate, projectId, format, demo } = body;
    const isDemo = isDemoAccessEnabled && demo === true;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const report = await generateRevenueReport(startDate, endDate, projectId, undefined, supabaseAdmin, isDemo);
    const ethPrice = await getEthPriceUSD();

    // If CSV export requested, format appropriately
    if (format === 'csv') {
      const csv = generateReportCSV(report, ethPrice);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="revenue-report.csv"',
        },
      });
    }

    return NextResponse.json({ data: report }, { status: 200 });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error?.message || error || 'Unknown error' },
      { status: 500 }
    );
  }
}

function escapeCSV(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.startsWith('=') || str.startsWith('+') || str.startsWith('-') || str.startsWith('@') || str.startsWith('\t')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generateReportCSV(report: RevenueReport, ethPrice: number): string {
  const lines: string[] = [];

  lines.push('Creative Rights Tracker - Revenue Report');
  lines.push(`Generated: ${escapeCSV(report.generatedAt)}`);
  lines.push(`Period: ${escapeCSV(report.reportPeriod.startDate)} to ${escapeCSV(report.reportPeriod.endDate)}`);
  lines.push('');

  lines.push('SUMMARY');
  lines.push(`Total Revenue,$${(report.totalRevenue * ethPrice).toFixed(2)}`);
  lines.push(`Total Paid,$${(report.totalPaid * ethPrice).toFixed(2)}`);
  lines.push(`Payment Count,${report.paymentCount}`);
  lines.push(`Average Payment,$${(report.averagePaymentAmount * ethPrice).toFixed(2)}`);
  lines.push('');

  lines.push('REVENUE BY SOURCE');
  lines.push('Source,Amount,Percentage,Count');
  report.sources?.forEach((source: RevenueBySource) => {
    lines.push(`${escapeCSV(source.source)},$${(source.amount * ethPrice).toFixed(2)},${source.percentage.toFixed(2)}%,${source.paymentCount}`);
  });
  lines.push('');

  lines.push('REVENUE BY PROJECT');
  lines.push('Project,Total Revenue,Paid,Share (%)');
  report.projects?.forEach((project: RevenueByProject) => {
    lines.push(
      `${escapeCSV(project.projectName)},$${(project.totalRevenue * ethPrice).toFixed(2)},$${(project.paidRevenue * ethPrice).toFixed(2)},${project.sharePercentage.toFixed(2)}%`
    );
  });
  lines.push('');

  lines.push('PAYMENT TRENDS');
  lines.push('Date,Amount (ETH),Value (USD),Source,Project');
  report.trends?.slice(0, 100).forEach((trend: any) => {
    const txPrice = trend.ethPriceAtTx || ethPrice;
    lines.push(`${escapeCSV(trend.date)},${trend.amount.toFixed(4)} ETH,$${(trend.amount * txPrice).toFixed(2)},${escapeCSV(trend.source)},${escapeCSV(trend.projectName)}`);
  });

  return lines.join('\n');
}

export const dynamic = 'force-dynamic';
