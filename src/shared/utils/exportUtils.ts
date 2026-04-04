// src/shared/utils/exportUtils.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIDR, formatDate } from './formatters';

// ─── Types ────────────────────────────────────────────────────

export interface ExportTransaction {
  transaction_date?: string | null;
  description?: string | null;
  type: string;
  amount: number;
  currency?: string | null;
  category_name?: string | null;
  notes?: string | null;
}

export interface ReportSummary {
  label: string;
  period: string;
  totalIncome: number;
  totalExpense: number;
  net: number;
}

// ─── CSV Export ───────────────────────────────────────────────

function escapeCSV(value: unknown): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTransactionsCSV(
  transactions: ExportTransaction[],
  filename = 'transactions'
): void {
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount (IDR)', 'Currency', 'Notes'];

  const USD_RATE = 15750;
  const toIdr = (amount: number, currency: string) =>
    currency === 'USD' ? amount * USD_RATE : amount;

  const rows = transactions.map((tx) => [
    tx.transaction_date ? formatDate(tx.transaction_date + 'T00:00:00', 'short') : '',
    tx.description ?? '',
    tx.category_name ?? '',
    tx.type,
    toIdr(tx.amount, tx.currency ?? 'IDR').toFixed(0),
    tx.currency ?? 'IDR',
    tx.notes ?? '',
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  downloadFile(`${filename}.csv`, csvContent, 'text/csv;charset=utf-8;');
}

// ─── PDF Export ───────────────────────────────────────────────

export function exportTransactionsPDF(
  transactions: ExportTransaction[],
  summary: ReportSummary,
  filename = 'report'
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const USD_RATE = 15750;
  const toIdr = (amount: number, currency: string) =>
    currency === 'USD' ? amount * USD_RATE : amount;

  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 30, 30);
  doc.text('MP Wealth System', 14, 18);

  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(`${summary.label} — ${summary.period}`, 14, 26);

  // Summary boxes
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  const summaryY = 34;
  doc.text(`Income: ${formatIDR(summary.totalIncome)}`, 14, summaryY);
  doc.text(`Expenses: ${formatIDR(summary.totalExpense)}`, 74, summaryY);
  doc.text(`Net: ${formatIDR(summary.net)}`, 134, summaryY);

  doc.setDrawColor(220, 220, 220);
  doc.line(14, summaryY + 4, 196, summaryY + 4);

  // Table
  autoTable(doc, {
    startY: summaryY + 8,
    head: [['Date', 'Description', 'Category', 'Type', 'Amount (IDR)']],
    body: transactions.map((tx) => [
      tx.transaction_date
        ? formatDate(tx.transaction_date + 'T00:00:00', 'short')
        : '-',
      tx.description ?? '-',
      tx.category_name ?? '-',
      tx.type.charAt(0).toUpperCase() + tx.type.slice(1),
      formatIDR(toIdr(tx.amount, tx.currency ?? 'IDR')),
    ]),
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: { fontSize: 8, textColor: [40, 40, 40] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 65 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22 },
      4: { cellWidth: 36, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `MP Wealth System — Generated ${new Date().toLocaleDateString('id-ID')} — Page ${i}/${pageCount}`,
      14,
      doc.internal.pageSize.height - 8
    );
  }

  doc.save(`${filename}.pdf`);
}

// ─── Helpers ─────────────────────────────────────────────────

function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
