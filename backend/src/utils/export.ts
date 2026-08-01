import { Response } from 'express';
import PDFDocument from 'pdfkit';
import * as XLSX from 'xlsx';

const sanitize = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
};

export const exportCsv = (res: Response, filename: string, rows: Record<string, unknown>[]) => {
  if (rows.length === 0) rows = [{}];
  const headers = Object.keys(rows[0]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(sanitize(row[h]))).join(',')),
  ];
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
  res.send('\uFEFF' + lines.join('\r\n'));
};

export const exportExcel = (res: Response, filename: string, rows: Record<string, unknown>[]) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`);
  res.send(buffer);
};

export const exportPdf = (
  res: Response,
  filename: string,
  title: string,
  rows: Record<string, unknown>[],
  subtitle?: string
) => {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
  doc.pipe(res);

  doc.font('Helvetica-Bold').fontSize(18).text(title, { align: 'center' });
  doc.moveDown(0.3);
  doc.font('Helvetica').fontSize(10).fillColor('#64748b');
  doc.text(
    `${subtitle ?? ''}  |  Generated: ${new Date().toLocaleString()}`,
    { align: 'center' }
  );
  doc.moveDown(1);

  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
  const colCount = headers.length;
  const tableWidth = doc.page.width - 80;
  const colWidth = colCount > 0 ? tableWidth / colCount : tableWidth;

  const drawRow = (cells: string[], isHeader: boolean) => {
    let maxLines = 1;
    const heights = cells.map((cell) => {
      const lines = doc.heightOfString(cell, { width: colWidth - 8 });
      maxLines = Math.max(maxLines, Math.ceil(lines / 12));
      return lines;
    });
    const rowHeight = Math.min(64, Math.max(20, maxLines * 12 + 8));

    if (doc.y + rowHeight > doc.page.height - 60) {
      doc.addPage();
    }

    cells.forEach((cell, i) => {
      const x = 40 + i * colWidth;
      if (isHeader) {
        doc
          .save()
          .rect(x, doc.y, colWidth, rowHeight)
          .fill('#f1f5f9')
          .stroke('#e2e8f0');
      } else {
        doc.save().rect(x, doc.y, colWidth, rowHeight).stroke('#e2e8f0');
      }
      doc
        .restore()
        .font(isHeader ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(8)
        .fillColor('#1e293b')
        .text(cell, x + 4, doc.y + 4, { width: colWidth - 8 });
      doc.x = 40;
    });

    doc.moveDown(0);
  };

  drawRow(headers, true);
  rows.forEach((row) => {
    drawRow(headers.map((h) => sanitize(row[h])), false);
  });

  doc.end();
};
