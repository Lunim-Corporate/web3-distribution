import { NextResponse } from 'next/server';
import * as jsPDFModule from 'jspdf/dist/jspdf.node.min';
import { generateRevenueReport } from '@/lib/reports.server';

const { jsPDF } = jsPDFModule as {
  jsPDF: new (options: {
    orientation: string;
    unit: string;
    format: string;
    putOnlyUsedFonts: boolean;
  }) => {
    setFillColor: (...args: number[]) => void;
    rect: (...args: (number | string)[]) => void;
    setTextColor: (...args: number[]) => void;
    setFont: (font: string, style: string) => void;
    setFontSize: (size: number) => void;
    text: (text: string, x: number, y: number, options?: { align?: string }) => void;
    setDrawColor: (...args: number[]) => void;
    roundedRect: (...args: (number | string)[]) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    addPage: () => void;
    setPage: (page: number) => void;
    output: (type: string) => ArrayBuffer;
    internal: { getNumberOfPages: () => number };
  };
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function buildQuarterLabel(date: Date) {
  return `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const now = new Date();
    const period = searchParams.get('period');
    const projectId = searchParams.get('projectId') || undefined;
    const walletAddress = searchParams.get('address') || undefined;

    let startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate') || now.toISOString().split('T')[0];
    let title = 'Revenue Report';
    let filenameSuffix = 'custom_report';

    if (!startDate && period === 'yearly') {
      startDate = `${now.getFullYear()}-01-01`;
      title = `Yearly Revenue Report ${now.getFullYear()}`;
      filenameSuffix = `yearly_${now.getFullYear()}`;
    } else if (!startDate && period === 'quarterly') {
      const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0];
      title = `Quarterly Revenue Report ${buildQuarterLabel(now)}`;
      filenameSuffix = `quarterly_${buildQuarterLabel(now).toLowerCase().replace(/\s+/g, '_')}`;
    } else if (!startDate) {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString().split('T')[0];
    }

    const report = await generateRevenueReport(startDate, endDate, projectId, walletAddress);
    const rightsHolderCount = report.projects.reduce((sum, project) => sum + project.contributorCount, 0);
    const scopeLabel = report.projects.length === 1 ? 'Specific Project' : 'LUNIM Ecosystem';

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true,
    });

    doc.setFillColor(14, 18, 32);
    doc.rect(0, 0, 210, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('LUNIM', 18, 18);
    doc.setFontSize(14);
    doc.text(title, 18, 27);

    doc.setTextColor(35, 35, 35);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 18, 44);
    doc.text(`Reporting period: ${report.reportPeriod.startDate} to ${report.reportPeriod.endDate}`, 18, 50);
    doc.text(`Scope: ${scopeLabel}`, 18, 56);

    const cards = [
      { label: 'Total Distributed', value: formatCurrency(report.totalRevenue), sublabel: 'Platform Total' },
      { label: 'Rights Holders', value: String(rightsHolderCount), sublabel: 'Active Contributors' },
      { label: 'Transactions', value: String(report.paymentCount), sublabel: 'On-chain Events' },
      { label: 'Project Status', value: 'active', sublabel: 'Verified Sync' },
    ];

    let cardX = 18;
    for (const card of cards) {
      doc.setDrawColor(225, 228, 235);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(cardX, 64, 40, 24, 3, 3, 'FD');
      doc.setFontSize(8);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'bold');
      doc.text(card.label.toUpperCase(), cardX + 3, 71);
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text(card.value, cardX + 3, 79);
      doc.setFontSize(7);
      doc.setTextColor(107, 114, 128);
      doc.setFont('helvetica', 'normal');
      doc.text(card.sublabel, cardX + 3, 84);
      cardX += 45;
    }

    let y = 100;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(17, 24, 39);
    doc.text('Revenue by Project', 18, y);
    y += 8;

    doc.setFillColor(245, 247, 250);
    doc.rect(18, y, 174, 10, 'F');
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text('PROJECT', 22, y + 6.5);
    doc.text('TOTAL', 106, y + 6.5);
    doc.text('CONTRIBUTORS', 140, y + 6.5);
    doc.text('SHARE (%)', 176, y + 6.5);
    y += 14;

    if (report.projects.length === 0) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(90, 90, 90);
      doc.text('No matching report data found for this period.', 22, y);
      y += 12;
    } else {
      report.projects.forEach((project) => {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }

        const sharePercent = report.totalRevenue > 0
          ? `${((project.totalRevenue / report.totalRevenue) * 100).toFixed(1)}%`
          : '0.0%';

        doc.setDrawColor(236, 239, 244);
        doc.line(18, y - 4, 192, y - 4);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(17, 24, 39);
        doc.text(project.projectName, 22, y);
        doc.text(formatCurrency(project.totalRevenue), 106, y, { align: 'right' });
        doc.text(String(project.contributorCount), 146, y, { align: 'center' });
        doc.text(sharePercent, 188, y, { align: 'right' });
        y += 7;

        if (project.rightsHolders && project.rightsHolders.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(95, 99, 110);
          project.rightsHolders.slice(0, 6).forEach((holder: { name: string; role: string; percentage: number }) => {
            if (y > 265) {
              doc.addPage();
              y = 20;
            }
            doc.text(
              `${holder.name} · ${holder.role} · ${Number(holder.percentage || 0).toFixed(1)}%`,
              26,
              y
            );
            y += 5;
          });
        }

        y += 4;
      });
    }

    if (report.sources.length > 0) {
      if (y > 235) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(17, 24, 39);
      doc.text('Revenue Sources', 18, y);
      y += 8;

      report.sources.forEach((source) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(55, 65, 81);
        doc.text(
          `${source.source}: ${formatCurrency(source.amount)} (${source.percentage.toFixed(1)}%) · ${source.paymentCount} payment(s)`,
          22,
          y
        );
        y += 6;
      });
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 140);
      doc.text('LUNIM Revenue & Rights Dashboard', 18, 288);
      doc.text(`Page ${page} of ${pageCount}`, 192, 288, { align: 'right' });
    }

    const pdfData = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfData);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lunim_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: unknown) {
    console.error('Report PDF generation failed:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'PDF generation failed' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
