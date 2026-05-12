import { NextResponse } from 'next/server';
import { generateRevenueReport } from '@/lib/database';
import { supabaseAdmin } from '@/app/lib/supabaseServer';
import { ETH_PRICE_USD } from '@/app/lib/constants';
import type { RevenueReport, RevenueBySource, RevenueByProject, RevenueTrend } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const isDemo = searchParams.get('demo') === 'true';

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const report = await generateRevenueReport(startDate, endDate, projectId || undefined, undefined, supabaseAdmin, isDemo);

    return NextResponse.json({ data: report }, { status: 200 });
  } catch (error: any) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error?.message || error || 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate, projectId, format, demo } = body;
    const isDemo = demo === true;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const report = await generateRevenueReport(startDate, endDate, projectId, undefined, supabaseAdmin, isDemo);

    // If CSV export requested, format appropriately
    if (format === 'csv') {
      const csv = generateReportCSV(report);
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

function generateReportCSV(report: RevenueReport): string {
  const lines: string[] = [];

  // Header
  lines.push('Creative Rights Tracker - Revenue Report');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Period: ${report.reportPeriod.startDate} to ${report.reportPeriod.endDate}`);
  lines.push('');

  // Summary
  lines.push('SUMMARY');
  lines.push(`Total Revenue,$${(report.totalRevenue * ETH_PRICE_USD).toFixed(2)}`);
  lines.push(`Total Paid,$${(report.totalPaid * ETH_PRICE_USD).toFixed(2)}`);
  lines.push(`Payment Count,${report.paymentCount}`);
  lines.push(`Average Payment,$${(report.averagePaymentAmount * ETH_PRICE_USD).toFixed(2)}`);
  lines.push('');

  // By Source
  lines.push('REVENUE BY SOURCE');
  lines.push('Source,Amount,Percentage,Count');
  report.sources?.forEach((source: RevenueBySource) => {
    lines.push(`${source.source},$${(source.amount * ETH_PRICE_USD).toFixed(2)},${source.percentage.toFixed(2)}%,${source.paymentCount}`);
  });
  lines.push('');

  // By Project
  lines.push('REVENUE BY PROJECT');
  lines.push('Project,Total Revenue,Paid,Share (%)');
  report.projects?.forEach((project: RevenueByProject) => {
    lines.push(
      `${project.projectName},$${(project.totalRevenue * ETH_PRICE_USD).toFixed(2)},$${(project.paidRevenue * ETH_PRICE_USD).toFixed(2)},${project.sharePercentage.toFixed(2)}%`
    );
  });
  lines.push('');

  // Trends
  lines.push('PAYMENT TRENDS');
  lines.push('Date,Amount,Source,Project');
  report.trends?.slice(0, 100).forEach((trend: RevenueTrend) => {
    lines.push(`${trend.date},$${(trend.amount * ETH_PRICE_USD).toFixed(2)},${trend.source},${trend.projectName}`);
  });

  return lines.join('\n');
}

export const dynamic = 'force-dynamic';
