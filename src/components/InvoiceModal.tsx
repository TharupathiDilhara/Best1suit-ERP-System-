import React, { useState, useRef } from 'react';
import { Invoice, InvoiceItem, Customer, CoatRental } from '../types';
import { downloadElementAsPDF, downloadElementAsImage } from '../utils/exportHelper';
import { generateInvoiceWhatsAppText, openWhatsAppChat, getStoredWhatsAppConfig } from '../utils/whatsappHelper';
import { formatLKR } from '../utils/currencyUtils';
import { 
  FileText, 
  Download, 
  Image as ImageIcon, 
  MessageSquare, 
  Share2, 
  Plus, 
  Trash2, 
  Printer, 
  CheckCircle2, 
  Save, 
  X, 
  Calendar, 
  User, 
  Scissors
} from 'lucide-react';
import { motion } from 'motion/react';

const logoImg = new URL('../assets/images/best_1_suit_logo_1782372712737.jpg', import.meta.url).href;

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'> & { id?: string }) => Promise<Invoice>;
  initialCustomer?: Customer | null;
  initialRental?: CoatRental | null;
  existingInvoice?: Invoice | null;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  onSaveInvoice,
  initialCustomer,
  initialRental,
  existingInvoice
}: InvoiceModalProps) {
  // Generate default invoice number if new
  const defaultInvoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
  const today = new Date().toISOString().split('T')[0];

  const [invoiceNumber, setInvoiceNumber] = useState(existingInvoice?.invoiceNumber || defaultInvoiceNumber);
  const [customerName, setCustomerName] = useState(
    existingInvoice?.customerName || initialCustomer?.name || initialRental?.customerName || ''
  );
  const [customerPhone, setCustomerPhone] = useState(
    existingInvoice?.customerPhone || initialCustomer?.phone || initialRental?.customerPhone || ''
  );
  const [customerAddress, setCustomerAddress] = useState(
    existingInvoice?.customerAddress || initialCustomer?.address || ''
  );
  const [customerId, setCustomerId] = useState(
    existingInvoice?.customerId || initialCustomer?.id || initialRental?.customerId || ''
  );
  const [date, setDate] = useState(existingInvoice?.date || today);
  const [dueDate, setDueDate] = useState(
    existingInvoice?.dueDate || (() => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    })()
  );

  // Line items state
  const [items, setItems] = useState<InvoiceItem[]>(() => {
    if (existingInvoice) return existingInvoice.items;
    if (initialRental) {
      const initialItems: InvoiceItem[] = [
        {
          id: 'item_rent',
          description: `Coat Rental: ${initialRental.coatDescription} (${initialRental.coatId})`,
          category: 'rental',
          quantity: 1,
          unitPrice: initialRental.rentalFee,
          total: initialRental.rentalFee
        }
      ];
      if (initialRental.fineAmount > 0) {
        initialItems.push({
          id: 'item_fine',
          description: 'Late Return Overdue Penalty Fine',
          category: 'fine',
          quantity: 1,
          unitPrice: initialRental.fineAmount,
          total: initialRental.fineAmount
        });
      }
      return initialItems;
    }
    return [
      {
        id: 'item_1',
        description: 'Two-Piece Bespoke Suit (Custom Coat & Trousers)',
        category: 'tailoring',
        quantity: 1,
        unitPrice: 45000,
        total: 45000
      }
    ];
  });

  const [discount, setDiscount] = useState<number>(existingInvoice?.discount || 0);
  const [tax, setTax] = useState<number>(existingInvoice?.tax || 0);
  const [paidAmount, setPaidAmount] = useState<number>(
    existingInvoice?.paidAmount || initialRental?.paidAmount || 0
  );
  const [paymentMethod, setPaymentMethod] = useState(existingInvoice?.paymentMethod || 'Cash');
  const [notes, setNotes] = useState(
    existingInvoice?.notes || 'Bespoke fitting guaranteed. Free alteration within 30 days of delivery.'
  );

  // Export progress states
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Financial calculations
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const total = Math.max(0, subtotal - discount + tax);
  const balanceDue = Math.max(0, total - paidAmount);
  const status: 'paid' | 'partial' | 'unpaid' = 
    balanceDue === 0 ? 'paid' : paidAmount > 0 ? 'partial' : 'unpaid';

  // Items manipulation
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const q = field === 'quantity' ? Number(value) || 0 : item.quantity;
      const u = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
      item.total = q * u;
    }
    updated[index] = item;
    setItems(updated);
  };

  const handleAddItem = (presetCategory: InvoiceItem['category'] = 'tailoring') => {
    const newItem: InvoiceItem = {
      id: 'item_' + Math.random().toString(36).substr(2, 7),
      description: presetCategory === 'tailoring' ? 'Custom Tailored Garment' : 'Garment Service',
      category: presetCategory,
      quantity: 1,
      unitPrice: 5000,
      total: 5000
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert("Bill must contain at least one line item.");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Build current invoice object
  const getCurrentInvoiceObject = (): Omit<Invoice, 'id' | 'createdAt'> & { id?: string } => ({
    id: existingInvoice?.id,
    invoiceNumber,
    customerId: customerId || 'cust_guest',
    customerName: customerName.trim() || 'Valued Customer',
    customerPhone: customerPhone.trim(),
    customerAddress: customerAddress.trim(),
    date,
    dueDate,
    items,
    subtotal,
    discount,
    tax,
    total,
    paidAmount,
    balanceDue,
    status,
    paymentMethod,
    notes: notes.trim()
  });

  // Save to database
  const handleSaveToLedger = async () => {
    setIsSaving(true);
    try {
      await onSaveInvoice(getCurrentInvoiceObject());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error(e);
      alert("Failed to save bill to ledger.");
    } finally {
      setIsSaving(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    setIsExportingPDF(true);
    try {
      const filename = `Best1Suit_Bill_${invoiceNumber}`;
      await downloadElementAsPDF('printable-invoice-card', filename);
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Download PNG Image
  const handleDownloadImage = async () => {
    setIsExportingImage(true);
    try {
      const filename = `Best1Suit_Bill_${invoiceNumber}`;
      await downloadElementAsImage('printable-invoice-card', filename);
    } finally {
      setIsExportingImage(false);
    }
  };

  // Send via WhatsApp (with both text summary and automated download for attachment)
  const handleSendWhatsApp = async () => {
    setIsSendingWhatsApp(true);
    try {
      // 1. Save to ledger so record is retained
      await onSaveInvoice(getCurrentInvoiceObject());

      // 2. Generate and download both PDF and Image so customer/tailor has them ready to send
      const filename = `Best1Suit_Bill_${invoiceNumber}`;
      await downloadElementAsImage('printable-invoice-card', filename);
      await downloadElementAsPDF('printable-invoice-card', filename);

      // 3. Build WhatsApp text and open WhatsApp
      const config = getStoredWhatsAppConfig();
      const invoiceData: Invoice = {
        ...getCurrentInvoiceObject(),
        id: existingInvoice?.id || 'temp_id',
        createdAt: new Date().toISOString()
      };
      const text = generateInvoiceWhatsAppText(invoiceData, config);
      openWhatsAppChat(customerPhone, text, config.countryCode);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 z-50 animate-fade-in" id="invoice-modal">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-slate-100 rounded-3xl border border-slate-300 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm tracking-wide">Customer Bill & Invoice Generator</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                  status === 'paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  status === 'partial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {status === 'paid' ? 'Paid in Full' : status === 'partial' ? 'Partial Deposit' : 'Unpaid'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Generate bills, export as PDF/Image, and send to WhatsApp.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveToLedger}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium px-3 py-1.5 rounded-lg border border-slate-700 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              {saveSuccess ? 'Saved!' : 'Save Ledger'}
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-semibold px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              title="Download clean printable A4 PDF"
            >
              <Download className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isExportingPDF ? 'Generating PDF...' : 'Download PDF Bill'}</span>
            </button>

            {/* Download Image */}
            <button
              onClick={handleDownloadImage}
              disabled={isExportingImage}
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-mono font-semibold px-3.5 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              title="Download high-resolution image file for easy sharing"
            >
              <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isExportingImage ? 'Creating Image...' : 'Download Image Bill'}</span>
            </button>

            {/* WhatsApp Direct Dispatch (PDF + Image + Message) */}
            <button
              onClick={handleSendWhatsApp}
              disabled={isSendingWhatsApp || !customerPhone}
              className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-semibold px-4 py-2 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
              title="Send bill summary and auto-download Image & PDF to attach in WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{isSendingWhatsApp ? 'Preparing WhatsApp...' : 'Send Bill via WhatsApp (PDF & Image)'}</span>
            </button>

          </div>

          <div className="text-xs font-mono text-slate-500">
            Total: <strong className="text-slate-900 font-bold font-sans">{formatLKR(total)}</strong> | Due: <strong className="text-red-600 font-bold font-sans">{formatLKR(balanceDue)}</strong>
          </div>
        </div>

        {/* Scrollable Layout: Form on Left (collapsible/responsive) & Visual Invoice Card on Right */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT: Bill Inputs & Line Items Editor (5 cols) */}
          <div className="lg:col-span-5 space-y-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm overflow-y-auto">
            <h4 className="text-xs font-serif font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Scissors className="w-4 h-4 text-indigo-600" /> Bill & Customer Details
            </h4>

            {/* Customer Information */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Billing Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Client Full Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase">
                  Customer WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+94 77 123 4567"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Address / City (Optional)</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="e.g. 45 Galle Road, Kollupitiya, Colombo 03"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>
            </div>

            {/* Line Items Editor */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-slate-400 uppercase font-semibold">Itemized Garments & Services</label>
                <button
                  type="button"
                  onClick={() => handleAddItem('tailoring')}
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-mono font-semibold hover:text-indigo-800 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Item
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {items.map((item, index) => (
                  <div key={item.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Garment description"
                        className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-medium text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="block text-[9px] text-slate-400 font-mono uppercase">Qty</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 font-mono uppercase">Rate (LKR)</span>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1 font-mono text-xs"
                        />
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 font-mono uppercase">Total</span>
                        <div className="bg-slate-100 border border-slate-200 rounded-md p-1 font-mono text-xs text-slate-700 font-semibold truncate">
                          {formatLKR(item.total, false)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Discounts, Paid Deposit & Notes */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Discount (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase">Paid Deposit (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                >
                  <option value="Cash">Cash</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Debit Card">Debit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Online / Mobile Pay">Online / Mobile Pay</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase">Notes & Terms</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800"
                />
              </div>
            </div>

          </div>

          {/* RIGHT: Visual Printable Invoice Card (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center">
            
            {/* The actual element captured by html2canvas for PDF and Image */}
            <div 
              id="printable-invoice-card" 
              className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md w-full max-w-[620px] text-slate-900 space-y-6"
              style={{ minHeight: '680px' }}
            >
              {/* Luxury Brand Header */}
              <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
                <div>
                  <img 
                    src={logoImg} 
                    alt="Best 1 Suit" 
                    className="h-16 w-auto object-contain" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="mt-2 text-xs text-slate-500 font-mono">
                    <p className="font-bold text-slate-800 tracking-wider">BEST 1 SUIT BESPOKE TAILORING</p>
                    <p>Fine Suits, Trousers & Wedding Coat Hire</p>
                    <p>Tel: +1 (555) 789-2345 • NYC & Online</p>
                  </div>
                </div>

                <div className="text-right">
                  <h2 className="text-2xl font-serif font-black tracking-wider text-slate-900">INVOICE</h2>
                  <p className="text-xs font-mono font-bold text-indigo-900 mt-1">{invoiceNumber}</p>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">Date: {date}</p>
                  {dueDate && <p className="text-xs font-mono text-slate-500">Due: {dueDate}</p>}
                  <div className="mt-2">
                    <span className={`inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                      status === 'partial' ? 'bg-amber-100 text-amber-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {status === 'paid' ? 'PAID IN FULL' : status === 'partial' ? 'PARTIAL DEPOSIT' : 'UNPAID'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between gap-4 text-xs">
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">BILLED TO:</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5">{customerName || 'Valued Customer'}</p>
                  <p className="font-mono text-slate-600 mt-0.5">Phone: {customerPhone || 'Not Specified'}</p>
                  {customerAddress && <p className="text-slate-500 mt-0.5">{customerAddress}</p>}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">PAYMENT INFO:</span>
                  <p className="font-medium text-slate-700 mt-0.5">Method: {paymentMethod}</p>
                  <p className="font-mono text-slate-500 mt-0.5">Shop ID: B1S-EST2012</p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-sans">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-900 block">{item.description}</span>
                          <span className="text-[10px] text-indigo-700 font-mono uppercase">{item.category}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center font-mono text-slate-700">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatLKR(item.unitPrice, false)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">{formatLKR(item.total, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="flex justify-between items-start gap-4 pt-2">
                <div className="max-w-[260px] text-[11px] text-slate-500 space-y-1">
                  <p className="font-bold text-slate-800 uppercase font-mono text-[10px]">Fitting Guarantee & Terms:</p>
                  <p className="italic leading-relaxed">{notes}</p>
                </div>

                <div className="w-60 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>{formatLKR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount:</span>
                      <span>-{formatLKR(discount)}</span>
                    </div>
                  )}
                  {tax > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax:</span>
                      <span>+{formatLKR(tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-200">
                    <span>Total:</span>
                    <span>{formatLKR(total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 pt-1">
                    <span>Amount Paid:</span>
                    <span>{formatLKR(paidAmount)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-red-600 pt-1 border-t border-dashed border-slate-200">
                    <span>Balance Due:</span>
                    <span>{formatLKR(balanceDue)}</span>
                  </div>
                </div>
              </div>

              {/* Signature / Official Stamp */}
              <div className="pt-6 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
                <div>
                  <p>Authorized Signature: _______________________</p>
                  <p className="mt-1 font-semibold text-slate-600">Best 1 Suit Master Tailor</p>
                </div>
                <div className="text-right">
                  <p>THANK YOU FOR YOUR PATRONAGE</p>
                  <p className="text-indigo-600 font-bold">BEST 1 SUIT • EST. 2012</p>
                </div>
              </div>

            </div>

            {/* Quick Helper text underneath preview */}
            <p className="text-[11px] text-slate-400 text-center mt-3 max-w-md">
              💡 <em>"Send Bill via WhatsApp"</em> downloads both the high-res PDF and PNG image to your system and opens WhatsApp with the order breakdown ready to send.
            </p>

          </div>

        </div>

      </motion.div>
    </div>
  );
}
