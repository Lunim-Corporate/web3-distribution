import { NextResponse } from 'next/server';
// Use Node-specific distribution to avoid browser global dependencies
const { jsPDF } = require('jspdf/dist/jspdf.node.min');
import { generateRevenueReport } from '@/app/lib/database';
import { requireAuth } from '@/app/lib/apiSecurity';
import { checkRateLimit } from '@/app/lib/rateLimit';
import { getEthPriceUSD } from '@/app/lib/ethPrice';
import { isDemoAccessEnabled } from '@/app/lib/demoAccess';

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
    const isDemo = isDemoAccessEnabled && searchParams.get('demo') === 'true';
    const report = await generateRevenueReport(startDate, endDate, searchParams.get('projectId') || undefined, undefined, undefined, isDemo);
    const ethPrice = await getEthPriceUSD();
    
    // GENERATE PDF ON SERVER (Node-compatible version)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      putOnlyUsedFonts: true
    });

    // ── PAGE WIDTH & MARGINS ──
    const PW = 210;
    const ML = 20;
    const MR = 20;
    const contentW = PW - ML - MR;

    // ── DEEP NAVY HEADER BRANDING BANNER ──
    doc.setFillColor(18, 28, 58);
    doc.rect(0, 0, PW, 42, 'F');

    // Accent stripe
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 42, PW, 2, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('LUNIM', ML, 20);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('CREATIVE RIGHTS PLATFORM — PLATFORM REPORT', ML, 28);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated: ${new Date().toLocaleString()}  |  Period: ${startDate} — ${endDate}`, ML, 35);

    let y = 58;

    // ── EXECUTIVE SUMMARY BOX ──
    const boxX = ML;
    const boxY = y;
    const boxH = 44;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(boxX, boxY, contentW, boxH, 3, 3, 'FD');

    // Left accent
    doc.setFillColor(59, 130, 246);
    doc.rect(boxX, boxY, 3, boxH, 'F');

    doc.setTextColor(18, 28, 58);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('EXECUTIVE SUMMARY', boxX + 10, boxY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);

    const metrics = [
      { label: 'Total Revenue', value: `$${(report.totalRevenue * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [59, 130, 246] },
      { label: 'Total Paid', value: `$${(report.totalPaid * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [34, 197, 94] },
      { label: 'Total Pending', value: `$${(report.totalPending * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: [234, 179, 8] },
      { label: 'Payment Count', value: String(report.paymentCount), color: [139, 92, 246] },
    ];

    const metricW = contentW / metrics.length;
    metrics.forEach((m, i) => {
      const mx = boxX + 10 + i * metricW;
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text(m.label.toUpperCase(), mx, boxY + 22);
      doc.setTextColor(m.color[0], m.color[1], m.color[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(m.value, mx, boxY + 35);
    });

    y = boxY + boxH + 12;

    // ── PROJECTS TABLE ──
    if (report.projects && report.projects.length > 0) {
      doc.setTextColor(18, 28, 58);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PROJECTS & REVENUE', ML, y);
      y += 8;

      // Table header
      doc.setFillColor(241, 245, 249);
      doc.rect(ML, y - 4, contentW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Project', ML + 4, y + 1);
      doc.text('Contributors', ML + 90, y + 1);
      doc.text('Share', ML + 120, y + 1, { align: 'right' });
      doc.text('Revenue (USD)', ML + 145, y + 1, { align: 'right' });
      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      report.projects.slice(0, 15).forEach((proj: any, i: number, _arr: any[]) => {
        if (y > 255) {
          addFooter(doc);
          doc.addPage();
          addHeader(doc);
          y = 52;
        }
        // Alternating row background
        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(ML, y - 4, contentW, 7, 'F');
        }
        doc.text(proj.projectName.length > 24 ? proj.projectName.slice(0, 24) + '…' : proj.projectName, ML + 4, y + 1);
        doc.text(String(proj.contributorCount || 0), ML + 90, y + 1);
        doc.text(`${(proj.sharePercentage || 0).toFixed(1)}%`, ML + 120, y + 1, { align: 'right' });
        doc.text(`$${(proj.totalRevenue * ethPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ML + 145, y + 1, { align: 'right' });
        y += 8;
      });
      y += 6;
    }

    // ── TRANSACTION HISTORY TABLE ──
    if (report.trends && report.trends.length > 0) {
      if (y > 245) {
        addFooter(doc);
        doc.addPage();
        addHeader(doc);
        y = 52;
      }

      doc.setTextColor(18, 28, 58);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('TRANSACTION HISTORY', ML, y);
      y += 8;

      // Table header
      doc.setFillColor(241, 245, 249);
      doc.rect(ML, y - 4, contentW, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Date & Time', ML + 4, y + 1);
      doc.text('Project', ML + 60, y + 1);
      doc.text('Amount (ETH)', ML + 105, y + 1, { align: 'right' });
      doc.text('Value (USD)', ML + 130, y + 1, { align: 'right' });
      doc.text('Status', ML + 168, y + 1);
      y += 9;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      report.trends.slice(0, 25).forEach((t: any, i: number) => {
        if (y > 255) {
          addFooter(doc);
          doc.addPage();
          addHeader(doc);
          y = 52;
        }
        if (i % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(ML, y - 4, contentW, 7, 'F');
        }
        const formattedDate = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const txPrice = t.ethPriceAtTx || ethPrice;
        const usdValue = t.amount * txPrice;
        doc.text(formattedDate, ML + 4, y + 1);
        doc.text(t.projectName.slice(0, 20), ML + 60, y + 1);
        doc.text(t.amount.toFixed(4), ML + 105, y + 1, { align: 'right' });
        doc.text(`$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ML + 130, y + 1, { align: 'right' });
        doc.text('Confirmed', ML + 168, y + 1);
        y += 8;
      });
    }

    // ── FOOTER (all pages) ──
    addFooter(doc, true);

    // Helper functions for page management
    function addHeader(doc: any) {
      doc.setFillColor(18, 28, 58);
      doc.rect(0, 0, PW, 42, 'F');
      doc.setFillColor(59, 130, 246);
      doc.rect(0, 42, PW, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('LUNIM', ML, 20);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('CREATIVE RIGHTS PLATFORM — PLATFORM REPORT (cont.)', ML, 28);
    }

    function addFooter(doc: any, includeLast = false) {
      const totalPages = (doc as any).internal.getNumberOfPages();
      const pagesToProcess = includeLast ? totalPages : totalPages - 1;
      for (let i = 1; i <= pagesToProcess; i++) {
        doc.setPage(i);
        // Footer line
        doc.setDrawColor(226, 232, 240);
        doc.line(ML, 280, PW - MR, 280);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(148, 163, 184);
        doc.text('LUNIM Creative Hub — Confidential', ML, 286);
        doc.text(`Page ${i} of ${totalPages}`, PW - MR, 286, { align: 'right' });
      }
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
    const msg = error?.message || String(error) || 'Unknown error';
    if (msg === 'Unauthorized' || msg === 'Forbidden: Admins only') {
      return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 403 });
    }
    console.error('SERVER-SIDE PDF GENERATION FAILED:', error);
    return NextResponse.json({ 
      error: 'PDF generation failed on server', 
      details: msg,
      environment: 'node-jspdf'
    }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
