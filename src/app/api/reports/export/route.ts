import { NextResponse } from 'next/server';
// Use Node-specific distribution to avoid browser global dependencies
const { jsPDF } = require('jspdf/dist/jspdf.node.min');
import { generateRevenueReport } from '@/lib/database';

export async function GET(request: Request) {
  try {
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
    doc.text(`Total Revenue: USD ${report.totalRevenue.toLocaleString()}`, 20, 78);
    doc.text(`Total Pending: USD ${report.totalPending.toLocaleString()}`, 20, 94);
    doc.text(`Payment Count: ${report.paymentCount}`, 20, 102);

    // Projects & Rights Holders Section
    doc.setFontSize(14);
    doc.text('PROJECTS & RIGHTS HOLDERS', 20, 118);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    let y = 128;

    if (report.projects && report.projects.length > 0) {
      report.projects.slice(0, 10).forEach((proj: any) => {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont('helvetica', 'bold');
        doc.text(proj.projectName + ': USD ' + proj.totalRevenue.toLocaleString(), 25, y);
        y += 6;

        if (proj.rightsHolders && proj.rightsHolders.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(100, 100, 100);
          proj.rightsHolders.forEach((holder: any) => {
            if (y > 280) { doc.addPage(); y = 20; }
            const sharePercent = holder.percentage ? holder.percentage.toFixed(1) : '0.0';
            doc.text('  → ' + holder.name + ' (' + holder.role + '): ' + sharePercent + '%', 30, y);
            y += 5;
          });
          doc.setTextColor(0, 0, 0);
        }
        y += 8;
      });
    } else {
      doc.text('No matching project data found for this period.', 25, y);
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

