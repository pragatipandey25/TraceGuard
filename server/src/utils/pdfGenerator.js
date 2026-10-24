import PDFDocument from 'pdfkit';

/**
 * Generates an executive security assessment report PDF.
 * Sanitizes all output and clearly documents assessment scope, findings,
 * and security posture disclaimer.
 */
export function buildAssessmentPdf(assessment, target, findings, user) {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    info: {
      Title: `TraceGuard Security Report - ${target.name}`,
      Author: 'TraceGuard Security Assessment Platform',
      Subject: `Automated Security Assessment for ${target.baseUrl}`
    }
  });

  const primaryColor = '#0f172a'; // Deep slate
  const secondaryColor = '#3b82f6'; // Indigo/blue
  const textMuted = '#64748b';
  const borderLine = '#cbd5e1';

  const severityColors = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#d97706',
    Low: '#2563eb',
    Informational: '#10b981'
  };

  // --- HEADER ---
  doc.rect(40, 40, 515, 60).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('TRACEGUARD', 55, 52);
  doc.fontSize(10).font('Helvetica').fillColor('#94a3b8').text('Web Security Assessment & Remediation Report', 55, 78);

  doc.fillColor('#ffffff').fontSize(9).font('Helvetica')
    .text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`, 380, 56, { align: 'right', width: 160 })
    .text(`Auditor: ${user.name}`, 380, 72, { align: 'right', width: 160 });

  doc.moveDown(3);

  // --- TARGET METADATA CARD ---
  const metaY = 115;
  doc.rect(40, metaY, 515, 70).fillAndStroke('#f8fafc', borderLine);

  doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold').text('TARGET ASSESSMENT SCOPE', 55, metaY + 10);

  doc.fontSize(9).font('Helvetica').fillColor(primaryColor);
  doc.text(`Target Name: ${target.name}`, 55, metaY + 28);
  doc.text(`Environment: ${target.environment.toUpperCase()}`, 55, metaY + 44);

  doc.text(`Base URL: ${target.baseUrl}`, 280, metaY + 28);
  doc.text(`Assessment Status: ${assessment.status.toUpperCase()} (${assessment.durationMs}ms)`, 280, metaY + 44);

  // --- EXECUTIVE SUMMARY ---
  let curY = 200;
  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text('Executive Summary & Posture Heuristic', 40, curY);
  curY += 20;

  const score = assessment.summary?.postureScore ?? 100;
  doc.rect(40, curY, 110, 60).fillAndStroke('#f1f5f9', borderLine);
  doc.fillColor(primaryColor).fontSize(22).font('Helvetica-Bold').text(`${score}/100`, 40, curY + 12, { width: 110, align: 'center' });
  doc.fontSize(8).font('Helvetica').fillColor(textMuted).text('POSTURE SCORE', 40, curY + 40, { width: 110, align: 'center' });

  // Severity metrics boxes
  const metrics = [
    { label: 'Critical', count: assessment.summary?.criticalCount || 0, color: severityColors.Critical },
    { label: 'High', count: assessment.summary?.highCount || 0, color: severityColors.High },
    { label: 'Medium', count: assessment.summary?.mediumCount || 0, color: severityColors.Medium },
    { label: 'Low', count: assessment.summary?.lowCount || 0, color: severityColors.Low },
    { label: 'Info', count: assessment.summary?.infoCount || 0, color: severityColors.Informational }
  ];

  let boxX = 160;
  for (const m of metrics) {
    doc.rect(boxX, curY, 75, 60).fillAndStroke('#f8fafc', borderLine);
    doc.fillColor(m.color).fontSize(18).font('Helvetica-Bold').text(`${m.count}`, boxX, curY + 14, { width: 75, align: 'center' });
    doc.fontSize(8).font('Helvetica-Bold').fillColor(m.color).text(m.label.toUpperCase(), boxX, curY + 40, { width: 75, align: 'center' });
    boxX += 80;
  }

  curY += 75;

  // Disclaimer notice
  doc.rect(40, curY, 515, 36).fill('#fffbeb').stroke('#fef3c7');
  doc.fillColor('#92400e').fontSize(7.5).font('Helvetica')
    .text(
      'LEGAL DISCLAIMER: TraceGuard performs passive and non-intrusive configuration checks against explicitly authorized targets. This assessment is an automated heuristic baseline and does NOT constitute a comprehensive penetration test or guarantee that the system is impervious to attack.',
      48,
      curY + 8,
      { width: 500 }
    );

  curY += 50;

  // --- CHECKS TABLE ---
  doc.fillColor(primaryColor).fontSize(12).font('Helvetica-Bold').text('Assessment Checks Summary', 40, curY);
  curY += 16;

  doc.rect(40, curY, 515, 20).fill('#0f172a');
  doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold')
    .text('CHECK MODULE', 48, curY + 6)
    .text('CATEGORY', 250, curY + 6)
    .text('STATUS', 460, curY + 6);
  curY += 20;

  const checks = assessment.checkResults || [];
  for (const c of checks) {
    if (curY > 730) {
      doc.addPage();
      curY = 40;
    }
    doc.rect(40, curY, 515, 18).fillAndStroke('#ffffff', '#f1f5f9');
    doc.fillColor(primaryColor).fontSize(8).font('Helvetica').text(c.name, 48, curY + 5);
    doc.fillColor(textMuted).text(c.category.toUpperCase(), 250, curY + 5);

    const statusColor = c.status === 'passed' ? '#16a34a' : c.status === 'failed' ? '#dc2626' : '#d97706';
    doc.fillColor(statusColor).font('Helvetica-Bold').text(c.status.toUpperCase(), 460, curY + 5);
    curY += 18;
  }

  curY += 25;

  // --- FINDINGS SECTION ---
  if (curY > 650) {
    doc.addPage();
    curY = 40;
  }

  doc.fillColor(primaryColor).fontSize(13).font('Helvetica-Bold').text(`Detailed Findings (${findings.length})`, 40, curY);
  curY += 18;

  if (findings.length === 0) {
    doc.fillColor('#16a34a').fontSize(9).font('Helvetica').text('No security misconfigurations or findings were identified during this assessment.', 40, curY);
  } else {
    for (let i = 0; i < findings.length; i++) {
      const f = findings[i];

      // Page break check
      if (curY > 620) {
        doc.addPage();
        curY = 40;
      }

      const sColor = severityColors[f.severity] || '#64748b';

      doc.rect(40, curY, 515, 22).fill('#f1f5f9');
      doc.rect(40, curY, 4, 22).fill(sColor);

      doc.fillColor(primaryColor).fontSize(9.5).font('Helvetica-Bold').text(`${i + 1}. ${f.title}`, 50, curY + 6);
      doc.fillColor(sColor).fontSize(8).font('Helvetica-Bold').text(`[${f.severity.toUpperCase()}]`, 480, curY + 6, { align: 'right', width: 65 });
      curY += 26;

      doc.fillColor(textMuted).fontSize(8).font('Helvetica')
        .text(`Rule ID: ${f.ruleId}  |  Category: ${f.category}  |  Confidence: ${f.confidence}  |  Status: ${f.status}`, 48, curY);
      curY += 14;

      doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('Description:', 48, curY);
      doc.fillColor('#334155').font('Helvetica').text(f.description, 105, curY, { width: 440 });
      curY += doc.heightOfString(f.description, { width: 440 }) + 6;

      if (f.impact) {
        doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('Impact:', 48, curY);
        doc.fillColor('#334155').font('Helvetica').text(f.impact, 105, curY, { width: 440 });
        curY += doc.heightOfString(f.impact, { width: 440 }) + 6;
      }

      if (f.remediation?.summary) {
        doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('Remediation:', 48, curY);
        doc.fillColor('#166534').font('Helvetica').text(f.remediation.summary, 105, curY, { width: 440 });
        curY += doc.heightOfString(f.remediation.summary, { width: 440 }) + 6;
      }

      curY += 12;
    }
  }

  // Final footer page info
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fillColor(textMuted).fontSize(7.5).font('Helvetica')
      .text(`TraceGuard Security Assessment  •  Page ${i + 1} of ${range.count}  •  Confidential`, 40, 790, { align: 'center', width: 515 });
  }

  return doc;
}
