import React, { useState, useMemo, useRef } from 'react';
import { Customer, CoatRental, Invoice } from '../types';
import { exportMonthlyReportToExcel, downloadElementAsPDF } from '../utils/exportHelper';
import { formatLKR, formatLKRCompact } from '../utils/currencyUtils';
import { 
  Banknote, 
  TrendingUp, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  Search, 
  Filter, 
  Scissors, 
  KeyRound, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Eye, 
  MessageSquare,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

const logoImg = new URL('../assets/images/best_1_suit_logo_1782372712737.jpg', import.meta.url).href;

interface RevenueReportsProps {
  invoices: Invoice[];
  rentals: CoatRental[];
  customers: Customer[];
  onOpenInvoiceModal: (invoice?: Invoice | null) => void;
  onOpenWhatsAppSync: () => void;
}

export default function RevenueReports({
  invoices,
  rentals,
  customers,
  onOpenInvoiceModal,
  onOpenWhatsAppSync
}: RevenueReportsProps) {
  // Current month default: "2026-09"
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-09');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tailoring' | 'rental' | 'alteration' | 'fine'>('all');
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Available months list derived from 2026
  const availableMonths = [
    { value: '2026-09', label: 'September 2026 (Current)' },
    { value: '2026-08', label: 'August 2026' },
    { value: '2026-07', label: 'July 2026' },
    { value: '2026-06', label: 'June 2026' },
    { value: '2026-05', label: 'May 2026' },
    { value: '2026-04', label: 'April 2026' },
    { value: 'all-2026', label: 'Full Year 2026 (All Months)' }
  ];

  // Consolidate transactions for the selected month:
  // We combine explicit Invoices + any Coat Rentals logged in that month
  const monthlyTransactions = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      refNumber: string;
      customerId: string;
      customerName: string;
      phone: string;
      type: 'tailoring' | 'rental' | 'alteration' | 'fine';
      description: string;
      amount: number;
      paidAmount: number;
      balance: number;
      status: 'paid' | 'partial' | 'unpaid';
      rawInvoice?: Invoice;
      rawRental?: CoatRental;
    }> = [];

    // Add invoices
    invoices.forEach(inv => {
      const matchMonth = selectedMonth === 'all-2026' || inv.date.startsWith(selectedMonth);
      if (matchMonth) {
        // Determine primary category
        const primaryCat = inv.items[0]?.category || 'tailoring';
        const description = inv.items.map(i => i.description).join(', ');
        list.push({
          id: inv.id,
          date: inv.date,
          refNumber: inv.invoiceNumber,
          customerId: inv.customerId,
          customerName: inv.customerName,
          phone: inv.customerPhone,
          type: primaryCat as any,
          description: description,
          amount: inv.total,
          paidAmount: inv.paidAmount,
          balance: inv.balanceDue,
          status: inv.status,
          rawInvoice: inv
        });
      }
    });

    // Add Coat Rentals that might not be in invoices
    rentals.forEach(rent => {
      const matchMonth = selectedMonth === 'all-2026' || rent.rentDate.startsWith(selectedMonth);
      const alreadyInInvoices = invoices.some(i => i.items.some(it => it.description.includes(rent.coatId)));
      if (matchMonth && !alreadyInInvoices) {
        const totalFee = rent.rentalFee + (rent.fineAmount || 0);
        const bal = Math.max(0, totalFee - rent.paidAmount);
        const st: 'paid' | 'partial' | 'unpaid' = bal === 0 ? 'paid' : rent.paidAmount > 0 ? 'partial' : 'unpaid';
        list.push({
          id: rent.id,
          date: rent.rentDate,
          refNumber: `RENT-${rent.coatId || rent.id.substring(0, 5)}`,
          customerId: rent.customerId,
          customerName: rent.customerName,
          phone: rent.customerPhone,
          type: rent.fineAmount > 0 ? 'fine' : 'rental',
          description: `Coat Rental: ${rent.coatDescription} (${rent.coatId})${rent.fineAmount > 0 ? ` + Late Fine $${rent.fineAmount}` : ''}`,
          amount: totalFee,
          paidAmount: rent.paidAmount,
          balance: bal,
          status: st,
          rawRental: rent
        });
      }
    });

    // Sort descending by date
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, rentals, selectedMonth]);

  // Filtered by user search and category
  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter(t => {
      const matchSearch = 
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.refNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.phone.includes(searchQuery) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCategory = categoryFilter === 'all' || t.type === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [monthlyTransactions, searchQuery, categoryFilter]);

  // Monthly Financial KPI Aggregates
  const financialSummary = useMemo(() => {
    let totalRevenue = 0;
    let tailoringRevenue = 0;
    let rentalRevenue = 0;
    let fineRevenue = 0;
    let outstandingBalance = 0;

    monthlyTransactions.forEach(t => {
      totalRevenue += t.amount;
      outstandingBalance += t.balance;
      if (t.type === 'tailoring') tailoringRevenue += t.amount;
      else if (t.type === 'rental') rentalRevenue += t.amount;
      else if (t.type === 'fine') fineRevenue += t.amount;
      else if (t.type === 'alteration') tailoringRevenue += t.amount;
    });

    return {
      totalRevenue,
      tailoringRevenue,
      rentalRevenue,
      fineRevenue,
      outstandingBalance,
      totalOrders: monthlyTransactions.length
    };
  }, [monthlyTransactions]);

  // Month-over-month trend data for visual breakdown (2026 Jan - Sep)
  const monthTrends = useMemo(() => {
    const months = ['2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09'];
    const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
    
    return months.map((m, idx) => {
      let rev = 0;
      invoices.forEach(inv => {
        if (inv.date.startsWith(m)) rev += inv.total;
      });
      rentals.forEach(r => {
        if (r.rentDate.startsWith(m)) rev += r.rentalFee + (r.fineAmount || 0);
      });
      return {
        key: m,
        name: monthNames[idx],
        revenue: rev
      };
    });
  }, [invoices, rentals]);

  // Get current month display label
  const currentMonthLabel = availableMonths.find(m => m.value === selectedMonth)?.label || selectedMonth;

  // Handle Export to Excel (.xlsx)
  const handleExportExcel = () => {
    exportMonthlyReportToExcel(currentMonthLabel, financialSummary, monthlyTransactions);
  };

  // Handle Export to PDF
  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      const filename = `Best1Suit_Sales_Report_${selectedMonth.replace('-', '_')}`;
      await downloadElementAsPDF('printable-sales-report', filename, 'p');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6" id="revenue-reports-page">
      
      {/* 1. Header Bar: Month Picker & Global Actions */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              Financial Management
            </span>
            <span className="text-xs text-slate-400 font-mono">Store Ledger Audit</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-slate-900 mt-1">
            Monthly Sales & Revenue Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor earnings across bespoke tailoring orders, wedding coat rentals, and late return penalty collections.
          </p>
        </div>

        {/* Month Selector & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Selector Dropdown */}
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-slate-50 hover:bg-white border border-slate-300 text-xs font-mono font-semibold px-3 py-2.5 rounded-xl text-slate-800 focus:outline-none focus:border-indigo-600 transition-all cursor-pointer shadow-xs"
            >
              {availableMonths.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Export to Excel Button */}
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-mono font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
            title="Download formatted multi-sheet Excel file (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (.xlsx)</span>
          </button>

          {/* Export to PDF Button */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Download printable A4 PDF statement"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-300" />
            <span>{isExportingPDF ? 'Generating PDF...' : 'PDF Report'}</span>
          </button>

          {/* New Bill Button */}
          <button
            onClick={() => onOpenInvoiceModal(null)}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Bill / Sale</span>
          </button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (5 Simple Scannable Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Total Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Total Sales</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 font-sans truncate" title={formatLKR(financialSummary.totalRevenue)}>
              {formatLKR(financialSummary.totalRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              {financialSummary.totalOrders} total transactions
            </p>
          </div>
        </div>

        {/* Tailoring Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Tailoring & Suits</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Scissors className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 font-sans truncate" title={formatLKR(financialSummary.tailoringRevenue)}>
              {formatLKR(financialSummary.tailoringRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Custom garments & shirts
            </p>
          </div>
        </div>

        {/* Coat Rentals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Coat Rentals</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 font-sans truncate" title={formatLKR(financialSummary.rentalRevenue)}>
              {formatLKR(financialSummary.rentalRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Wedding tuxedo hire
            </p>
          </div>
        </div>

        {/* Late Penalty Fines */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Late Fines Collected</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 font-sans truncate" title={formatLKR(financialSummary.fineRevenue)}>
              {formatLKR(financialSummary.fineRevenue)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              LKR 500/day penalty receipts
            </p>
          </div>
        </div>

        {/* Outstanding Receivables */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider">Unpaid Balances</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-red-600 font-sans truncate" title={formatLKR(financialSummary.outstandingBalance)}>
              {formatLKR(financialSummary.outstandingBalance)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
              Pending client collections
            </p>
          </div>
        </div>

      </div>

      {/* 3. Monthly Revenue Trend Bar Graphic */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-serif font-semibold text-slate-900">2026 Revenue Trends</h3>
            <p className="text-xs text-slate-400 font-mono">Month-by-month sales trajectory</p>
          </div>
          <span className="text-xs text-indigo-600 font-mono font-semibold">
            Year-to-Date
          </span>
        </div>

        <div className="grid grid-cols-6 gap-3 items-end h-28 pt-4 pb-2 border-b border-slate-100">
          {monthTrends.map((m) => {
            const isSelected = m.key === selectedMonth;
            const maxRev = Math.max(...monthTrends.map(t => t.revenue), 1500);
            const heightPct = Math.max(12, (m.revenue / maxRev) * 100);

            return (
              <button
                key={m.key}
                onClick={() => setSelectedMonth(m.key)}
                className="flex flex-col items-center gap-1.5 group cursor-pointer h-full justify-end"
              >
                <span className="text-[10px] font-mono text-slate-500 font-semibold group-hover:text-indigo-600 transition-colors">
                  {formatLKRCompact(m.revenue)}
                </span>
                <div className="w-full max-w-[48px] bg-slate-100 rounded-t-lg overflow-hidden flex items-end h-full">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 ${
                      isSelected 
                        ? 'bg-indigo-600 shadow-sm shadow-indigo-600/30' 
                        : 'bg-slate-300 group-hover:bg-indigo-400'
                    }`}
                  />
                </div>
                <span className={`text-[11px] font-mono uppercase font-bold transition-colors ${
                  isSelected ? 'text-indigo-700' : 'text-slate-400'
                }`}>
                  {m.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Itemized Transaction Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col" id="printable-sales-report">
        
        {/* Printable Header Container (Always clean for PDF capture) */}
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <img 
                src={logoImg} 
                alt="Best 1 Suit" 
                className="h-10 w-auto object-contain" 
                referrerPolicy="no-referrer"
              />
              <div>
                <h3 className="text-base font-serif font-bold text-slate-900">
                  Itemized Monthly Ledger: {currentMonthLabel}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  {filteredTransactions.length} recorded entries
                </p>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, phone, ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-xl font-mono focus:outline-none focus:border-indigo-600 transition-all"
              />
            </div>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              {(['all', 'tailoring', 'rental', 'fine'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`text-[10px] font-mono px-2 py-1 rounded-lg uppercase font-bold transition-all cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Ref #</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Service & Garments</th>
                <th className="py-3 px-4 text-right">Amount (LKR)</th>
                <th className="py-3 px-4 text-right">Paid (LKR)</th>
                <th className="py-3 px-4 text-right">Balance (LKR)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No transactions match your search filter</p>
                    <p className="text-xs text-slate-400 mt-1">Select another month or create a new bill</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">{tx.date}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">{tx.refNumber}</td>
                    <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">{tx.customerName}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{tx.phone || '—'}</td>
                    <td className="py-3 px-4 max-w-xs truncate text-slate-700" title={tx.description}>
                      <span className={`inline-block text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded mr-1.5 ${
                        tx.type === 'tailoring' ? 'bg-blue-100 text-blue-800' :
                        tx.type === 'rental' ? 'bg-purple-100 text-purple-800' :
                        tx.type === 'fine' ? 'bg-red-100 text-red-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {tx.type}
                      </span>
                      {tx.description}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                      {formatLKR(tx.amount, false)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 whitespace-nowrap">
                      {formatLKR(tx.paidAmount, false)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono whitespace-nowrap">
                      {tx.balance > 0 ? (
                        <span className="text-red-600 font-bold">{formatLKR(tx.balance, false)}</span>
                      ) : (
                        <span className="text-slate-400">LKR 0</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        tx.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        tx.status === 'partial' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          if (tx.rawInvoice) {
                            onOpenInvoiceModal(tx.rawInvoice);
                          } else {
                            onOpenInvoiceModal({
                              id: tx.id,
                              invoiceNumber: tx.refNumber,
                              customerId: tx.customerId,
                              customerName: tx.customerName,
                              customerPhone: tx.phone,
                              date: tx.date,
                              items: [
                                {
                                  id: 'i1',
                                  description: tx.description,
                                  category: tx.type,
                                  quantity: 1,
                                  unitPrice: tx.amount,
                                  total: tx.amount
                                }
                              ],
                              subtotal: tx.amount,
                              discount: 0,
                              tax: 0,
                              total: tx.amount,
                              paidAmount: tx.paidAmount,
                              balanceDue: tx.balance,
                              status: tx.status,
                              createdAt: new Date().toISOString()
                            });
                          }
                        }}
                        className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-mono font-semibold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                        title="View / Download Bill or Send via WhatsApp"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Bill</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Totals Row */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs font-mono text-slate-600 gap-3">
          <div className="flex items-center gap-4">
            <span>Period: <strong>{currentMonthLabel}</strong></span>
            <span>Ledger Entries: <strong>{monthlyTransactions.length}</strong></span>
          </div>

          <div className="flex items-center gap-6">
            <span>Total Billed: <strong className="text-slate-900 font-bold">{formatLKR(financialSummary.totalRevenue)}</strong></span>
            <span>Total Collected: <strong className="text-emerald-700 font-bold">{formatLKR(financialSummary.totalRevenue - financialSummary.outstandingBalance)}</strong></span>
            <span>Uncollected: <strong className="text-red-600 font-bold">{formatLKR(financialSummary.outstandingBalance)}</strong></span>
          </div>
        </div>

      </div>

    </div>
  );
}
