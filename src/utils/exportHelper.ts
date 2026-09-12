import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { Invoice, CoatRental } from '../types';

/**
 * Capture an HTML element and download it as a high-resolution PNG image
 */
export async function downloadElementAsImage(elementId: string, filename: string): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (error) {
    console.error('Error generating image:', error);
    return false;
  }
}

/**
 * Capture an HTML element and download it as a formatted PDF document
 */
export async function downloadElementAsPDF(elementId: string, filename: string, orientation: 'p' | 'l' = 'p'): Promise<boolean> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id ${elementId} not found`);
    return false;
  }

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: orientation,
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Calculate aspect ratio
    const imgWidth = pageWidth - 20; // 10mm margins on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // 10mm top margin

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pageHeight - 20);

    // If multi-page content
    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);
    }

    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
}

/**
 * Export Monthly Sales & Revenue figures to an Excel (.xlsx) workbook
 */
export function exportMonthlyReportToExcel(
  monthLabel: string,
  summary: {
    totalRevenue: number;
    tailoringRevenue: number;
    rentalRevenue: number;
    fineRevenue: number;
    outstandingBalance: number;
    totalOrders: number;
  },
  transactions: Array<{
    date: string;
    refNumber: string;
    customerName: string;
    phone: string;
    type: string;
    description: string;
    amount: number;
    paidAmount: number;
    balance: number;
    status: string;
  }>
): void {
  // 1. Create a new workbook
  const wb = XLSX.utils.book_new();

  // 2. Summary Sheet Data
  const summaryData = [
    ['BEST 1 SUIT - BESPOKE TAILORING & COAT HIRE (SRI LANKA)'],
    ['MONTHLY SALES & REVENUE FINANCIAL REPORT'],
    [`Reporting Period: ${monthLabel}`],
    [`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`],
    [],
    ['EXECUTIVE SUMMARY', 'AMOUNT (LKR)'],
    ['Total Gross Sales / Revenue', summary.totalRevenue],
    ['Tailoring & Alterations Services', summary.tailoringRevenue],
    ['Coat Rental Fees', summary.rentalRevenue],
    ['Late Return Overdue Fines', summary.fineRevenue],
    ['Uncollected / Outstanding Receivables', summary.outstandingBalance],
    ['Total Monthly Transactions Completed', summary.totalOrders],
    [],
    ['Shop Policy Notes:'],
    ['• Currency: Sri Lankan Rupees (LKR).'],
    ['• Late fines calculated at standard LKR 500/day policy.'],
    ['• All figures verified against Best 1 Suit store ledger.']
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Financial Summary');

  // 3. Transactions Sheet Data
  const transactionsHeader = [
    'Date',
    'Reference #',
    'Customer Name',
    'Phone',
    'Category',
    'Description / Garment',
    'Total Amount (LKR)',
    'Paid (LKR)',
    'Balance (LKR)',
    'Payment Status'
  ];

  const transactionsRows = transactions.map(t => [
    t.date,
    t.refNumber,
    t.customerName,
    t.phone,
    t.type,
    t.description,
    t.amount,
    t.paidAmount,
    t.balance,
    t.status
  ]);

  const wsTransactions = XLSX.utils.aoa_to_sheet([transactionsHeader, ...transactionsRows]);
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Itemized Ledger');

  // 4. Auto-size columns for readability
  const colWidths = [
    { wch: 12 }, // Date
    { wch: 15 }, // Ref #
    { wch: 22 }, // Customer Name
    { wch: 18 }, // Phone
    { wch: 14 }, // Category
    { wch: 38 }, // Description
    { wch: 16 }, // Total Amount
    { wch: 12 }, // Paid
    { wch: 12 }, // Balance
    { wch: 14 }  // Status
  ];
  wsTransactions['!cols'] = colWidths;

  // 5. Generate and download file
  const safeMonth = monthLabel.replace(/[\s,]+/g, '_');
  XLSX.writeFile(wb, `Best1Suit_Sales_Report_${safeMonth}.xlsx`);
}
