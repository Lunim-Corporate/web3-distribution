import { NextResponse } from 'next/server';
import { generateRevenueReport } from '@/lib/reports.server';
import type { RevenueReport, RevenueBySource, RevenueByProject, RevenueTrend } from '@/lib/types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');
    const walletAddress = searchParams.get('address');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const report = await generateRevenueReport(startDate, endDate, projectId || undefined, walletAddress || undefined);

    return NextResponse.json({ data: report }, { status: 200 });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { startDate, endDate, projectId, address, format } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    const report = await generateRevenueReport(startDate, endDate, projectId, address);

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
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
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
  lines.push(`Total Revenue,${report.totalRevenue}`);
  lines.push(`Total Pending,${report.totalPending}`);
  lines.push(`Payment Count,${report.paymentCount}`);
  lines.push(`Average Payment,${report.averagePaymentAmount}`);
  lines.push('');

  // By Source
  lines.push('REVENUE BY SOURCE');
  lines.push('Source,Amount,Percentage,Count');
  report.sources?.forEach((source: RevenueBySource) => {
    lines.push(`${source.source},${source.amount},${source.percentage.toFixed(2)}%,${source.paymentCount}`);
  });
  lines.push('');

  // By Project
  lines.push('REVENUE BY PROJECT');
  lines.push('Project,Total Revenue,Paid,Pending,Contributors');
  report.projects?.forEach((project: RevenueByProject) => {
    lines.push(
      `${project.projectName},${project.totalRevenue},${project.paidRevenue},${project.pendingRevenue},${project.contributorCount}`
    );
  });
  lines.push('');

  // Trends
  lines.push('PAYMENT TRENDS');
  lines.push('Date,Amount,Source,Project');
  report.trends?.slice(0, 100).forEach((trend: RevenueTrend) => {
    lines.push(`${trend.date},${trend.amount},${trend.source},${trend.projectName}`);
  });

  return lines.join('\n');
}

export const dynamic = 'force-dynamic';
