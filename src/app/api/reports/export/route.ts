import { NextResponse } from 'next/server';
// Use Node-specific distribution to avoid browser global dependencies
const { jsPDF } = require('jspdf/dist/jspdf.node.min');
import { generateRevenueReport } from '@/app/lib/database';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { getEthPriceUSD } from '@/app/lib/ethPrice';

export async function GET(request: Request) {
  try {
    const blocked = await checkRateLimit('write');
    if (blocked) return blocked;

    await requireAuth();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period');
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate') || now.toISOString().split('T')[0];
    let filenameSuffix = 'report';

    if (period === 'ytd' || (!startDate && !period)) {
      startDate = `${currentYear}-01-01`;
      filenameSuffix = 'ytd_report';
    } else if (period === '4months') {
      // 4-month cycles: Jan-Apr (0-3), May-Aug (4-7), Sep-Dec (8-11)
      const startMonth = Math.floor(currentMonth / 4) * 4;
      startDate = new Date(currentYear, startMonth, 1).toISOString().split('T')[0];
      filenameSuffix = 'q_cycle_report';
    } else if (!startDate) {
      // Fallback to beginning of previous year if really no data
      startDate = `${currentYear - 1}-01-01`;
    }
    
    // FETCH DATA ON SERVER
    const report = await generateRevenueReport(startDate, endDate, searchParams.get('projectId') || undefined);
    const ethPrice = await getEthPriceUSD();
    
    // GENERATE PDF ON SERVER (Node-compatible version)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    // Branding
    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('LUNIM', 20, 25);
    doc.setFontSize(10);
    doc.text('CREATIVE RIGHTS PLATFORM — PLATFORM REPORT', 20, 32);

    // Summary Section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text('EXECUTIVE SUMMARY', 20, 55);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 20, 62);
    doc.text(`Reporting Period: ${startDate} to ${endDate}`, 20, 68);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Revenue: USD ${(report.totalRevenue * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 78);
    doc.text(`Total Paid: USD ${(report.totalPaid * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 86);
    doc.text(`Total Pending: USD ${(report.totalPending * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, 94);
    doc.text(`Payment Count: ${report.paymentCount}`, 20, 102);

    // Top Projects Section
    doc.setFontSize(14);
    doc.text('RECENT PROJECTS & REVENUE', 20, 118);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 128;
    
    if (report.projects && report.projects.length > 0) {
      report.projects.slice(0, 15).forEach((proj: any) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(`${proj.projectName}: USD ${(proj.totalRevenue * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 25, y);
        y += 8;
      });
    } else {
      doc.text('No matching project data found for this period.', 25, y);
    }

    // Transaction History Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TRANSACTION HISTORY', 20, y + 10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y += 20;

    if (report.trends && report.trends.length > 0) {
      // Headers
      doc.setFont('helvetica', 'bold');
      doc.text('Date & Time', 25, y);
      doc.text('Project', 75, y);
      doc.text('Amount (ETH)', 135, y);
      doc.text('Value (USD)', 170, y);
      doc.setFont('helvetica', 'normal');
      y += 8;

      report.trends.slice(0, 20).forEach((t: any) => {
        if (y > 270) { doc.addPage(); y = 20; }
        const formattedDate = new Date(t.date).toLocaleString();
        const txPrice = t.ethPriceAtTx || ethPrice; // Fallback to current live price if not stored
        const usdValue = t.amount * txPrice;
        
        doc.text(formattedDate, 25, y);
        doc.text(t.projectName.slice(0, 20), 75, y);
        doc.text(`${t.amount.toFixed(4)} ETH`, 135, y);
        doc.text(`$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 170, y);
        y += 8;
      });
    } else {
      doc.text('No transactions found for this period.', 25, y);
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
      doc.text('LUNIM Creative Hub - Confidential', 20, 287);
    }

    // BINARY OUTPUT
    // v4.x in Node returns a Buffer or ArrayBuffer
    const pdfData = doc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfData);

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="lunim_${filenameSuffix}_${new Date().toISOString().slice(0, 10)}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error: any) {
    console.error('SERVER-SIDE PDF GENERATION FAILED:', error);
    return NextResponse.json({ 
      error: 'PDF generation failed on server', 
      details: error.message,
      environment: 'node-jspdf'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

