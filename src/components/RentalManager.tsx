import React, { useState, useMemo } from 'react';
import { Customer, CoatRental } from '../types';
import { 
  KeyRound, 
  Plus, 
  Calendar, 
  Clock, 
  RotateCcw, 
  AlertTriangle, 
  FileText, 
  CheckCircle2, 
  ChevronDown, 
  Trash2, 
  ShieldCheck, 
  User, 
  Info,
  MessageSquare,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatLKR } from '../utils/currencyUtils';

interface RentalManagerProps {
  rentals: CoatRental[];
  customers: Customer[];
  onSaveRental: (rental: Omit<CoatRental, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<CoatRental>;
  onDeleteRental: (id: string) => Promise<void>;
  onOpenWhatsAppReminder?: (rental: CoatRental) => void;
  onOpenInvoiceModal?: (rental: CoatRental) => void;
  onOpenWhatsAppSync?: () => void;
}

export default function RentalManager({ 
  rentals, 
  customers, 
  onSaveRental, 
  onDeleteRental,
  onOpenWhatsAppReminder,
  onOpenInvoiceModal,
  onOpenWhatsAppSync
}: RentalManagerProps) {
  // States
  const [filter, setFilter] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [isAddingRental, setIsAddingRental] = useState(false);
  const [processingReturnId, setProcessingReturnId] = useState<string | null>(null);
  
  // New Rental Form States
  const [customerId, setCustomerId] = useState('');
  const [coatDescription, setCoatDescription] = useState('');
  const [coatId, setCoatId] = useState('');
  const [rentalFee, setRentalFee] = useState<number>(5000);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [rentDate, setRentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    // Default 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [newRentalNotes, setNewRentalNotes] = useState('');

  // Processing Return States
  const [returnDate, setReturnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fineAmount, setFineAmount] = useState<number>(0);
  const [returnNotes, setReturnNotes] = useState('');

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Set Rent date and update due date automatically when duration preset clicked
  const handleDurationPreset = (days: number) => {
    const start = new Date(rentDate);
    start.setDate(start.getDate() + days);
    setDueDate(start.toISOString().split('T')[0]);
  };

  // Filter rentals based on state and status
  const filteredRentals = useMemo(() => {
    return rentals.filter(r => {
      const isOverdue = !r.returnDate && r.dueDate < today;
      
      if (filter === 'active') {
        return !r.returnDate && r.dueDate >= today;
      }
      if (filter === 'overdue') {
        return isOverdue;
      }
      if (filter === 'returned') {
        return !!r.returnDate;
      }
      return true; // 'all'
    });
  }, [rentals, filter, today]);

  // Handle rental creation
  const handleCreateRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !coatDescription || !coatId) {
      alert("Please select a customer and provide coat details.");
      return;
    }

    const selectedCust = customers.find(c => c.id === customerId);
    if (!selectedCust) return;

    try {
      await onSaveRental({
        customerId,
        customerName: selectedCust.name,
        customerPhone: selectedCust.phone,
        coatDescription: coatDescription.trim(),
        coatId: coatId.trim().toUpperCase(),
        rentDate,
        dueDate,
        returnDate: null,
        rentalFee,
        paidAmount,
        fineAmount: 0,
        status: dueDate < today ? 'overdue' : 'active',
        notes: newRentalNotes.trim()
      });

      // Reset form
      setCustomerId('');
      setCoatDescription('');
      setCoatId('');
      setRentalFee(150);
      setPaidAmount(0);
      setNewRentalNotes('');
      setIsAddingRental(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Suggest a fine when return processing starts
  const startReturnProcess = (rental: CoatRental) => {
    setProcessingReturnId(rental.id);
    const rDate = new Date().toISOString().split('T')[0];
    setReturnDate(rDate);
    
    // Calculate days overdue
    const due = new Date(rental.dueDate);
    const ret = new Date(rDate);
    const diffTime = ret.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      // LKR 500 per day fine standard preset
      setFineAmount(diffDays * 500);
      setReturnNotes(`Returned ${diffDays} days late. Standard LKR 500/day penalty applied.`);
    } else {
      setFineAmount(0);
      setReturnNotes("Returned on time. Coat in pristine condition.");
    }
  };

  // Submit returned coat processing
  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!processingReturnId) return;

    const rental = rentals.find(r => r.id === processingReturnId);
    if (!rental) return;

    try {
      await onSaveRental({
        ...rental,
        returnDate,
        fineAmount,
        status: 'returned',
        notes: `${rental.notes}\n[Return Log]: ${returnNotes}`.trim()
      });

      setProcessingReturnId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Delete rental
  const handleDeleteRental = async (id: string) => {
    if (confirm("Are you sure you want to delete this rental contract from the ledger?")) {
      await onDeleteRental(id);
    }
  };

  // Helper: calculate days remaining/overdue
  const getDaysStatus = (rental: CoatRental) => {
    if (rental.returnDate) {
      return { text: "Returned", color: "text-emerald-600 bg-emerald-50 border-emerald-100", icon: CheckCircle2 };
    }

    const due = new Date(rental.dueDate);
    const current = new Date(today);
    const diffTime = due.getTime() - current.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { 
        text: `${Math.abs(diffDays)} Days Overdue`, 
        color: "text-red-700 bg-red-50 border-red-200 font-semibold animate-pulse", 
        icon: AlertTriangle 
      };
    } else if (diffDays === 0) {
      return { 
        text: "Due Today", 
        color: "text-indigo-700 bg-indigo-50 border-indigo-200 font-semibold", 
        icon: Clock 
      };
    } else {
      return { 
        text: `${diffDays} Days Left`, 
        color: "text-slate-600 bg-slate-50 border-slate-200", 
        icon: Clock 
      };
    }
  };

  return (
    <div className="space-y-6" id="rental-manager-panel">
      
      {/* 1. Rental Headers and Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-slate-900">Coat Rental Ledger</h2>
          <p className="text-xs text-slate-500 mt-0.5">Track wedding coat rentals, control due periods, return receipts, and assess late fines.</p>
        </div>

        <div className="flex items-center gap-2.5">
          {onOpenWhatsAppSync && (
            <button
              onClick={onOpenWhatsAppSync}
              className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold px-3.5 py-3 rounded-xl transition-all cursor-pointer shadow-2xs"
              title="Configure and test WhatsApp sync settings"
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>WhatsApp Sync</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </button>
          )}

          <button
            onClick={() => setIsAddingRental(true)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-3 rounded-xl transition-all shadow-sm cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> Book Coat Rental
          </button>
        </div>
      </div>

      {/* 2. STATE: New Rental Form */}
      {isAddingRental && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white rounded-2xl border border-indigo-200 p-6 shadow-md overflow-hidden relative"
          id="add-rental-form"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500" />
          <h3 className="text-base font-serif font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-indigo-600" /> Book New Wedding Coat Rental
          </h3>

          <form onSubmit={handleCreateRentalSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Customer dropdown selector */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Select Client <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    required
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-8 py-2 rounded-xl focus:outline-none transition-all appearance-none cursor-pointer text-slate-800"
                  >
                    <option value="">-- Choose Client --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} (ID: {c.nationalId})</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Coat Description */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Coat Description <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Royal Cream Suit, Slim Black Tux"
                  value={coatDescription}
                  onChange={(e) => setCoatDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2 rounded-xl focus:outline-none transition-all text-slate-800 placeholder-slate-400"
                />
              </div>

              {/* Coat Unique Inventory ID */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Coat ID / Size Label <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. COAT-42R-05"
                  value={coatId}
                  onChange={(e) => setCoatId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2 rounded-xl focus:outline-none transition-all font-mono text-slate-800 placeholder-slate-400"
                />
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Rental Fee */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Rental Charge (LKR)</label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-mono">LKR</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={rentalFee}
                    onChange={(e) => setRentalFee(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-12 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Deposit Paid Amount */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Paid Deposit (LKR)</label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-mono">LKR</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-12 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Rent Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Rental Out Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={rentDate}
                    onChange={(e) => setRentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Return Due Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Expected Return Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono text-slate-800"
                  />
                </div>
              </div>

            </div>

            {/* Quick Presets for Duration */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider uppercase mr-2">Quick Due Presets:</span>
              {[3, 5, 7, 10, 14, 30].map(days => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleDurationPreset(days)}
                  className="px-2.5 py-1 text-xs font-mono font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-200 border border-slate-200 rounded-lg transition-all cursor-pointer text-slate-600"
                >
                  +{days} Days
                </button>
              ))}
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Booking / Fitting Notes</label>
              <textarea
                placeholder="Include custom wedding tailoring adjustments or note condition of coat upon dispatch..."
                value={newRentalNotes}
                onChange={(e) => setNewRentalNotes(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2 rounded-xl focus:outline-none transition-all h-20 text-slate-800 placeholder-slate-400"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddingRental(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
              >
                Record Booking Ledger
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* 3. Return Receipt Form: Activated on Return click */}
      {processingReturnId && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="return-receipt-modal">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-fade-in-up"
          >
            <h3 className="text-lg font-serif font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-indigo-600" /> Log Coat Return Receipt
            </h3>
            <p className="text-xs text-slate-400 mb-6">Review return dates, inspect items, and register any overdue penalty fines.</p>

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              
              {/* Return Date */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Actual Return Date</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    required
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      // Recalculate suggested fine if date shifts
                      const rental = rentals.find(r => r.id === processingReturnId);
                      if (rental) {
                        const due = new Date(rental.dueDate);
                        const ret = new Date(e.target.value);
                        const diffTime = ret.getTime() - due.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays > 0) {
                          setFineAmount(diffDays * 500);
                        } else {
                          setFineAmount(0);
                        }
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Fine Input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
                  <span>Assessed Fine / Penalty (LKR)</span>
                  <span className="text-[10px] text-indigo-600 lowercase font-mono">Fine field is editable</span>
                </label>
                <div className="relative">
                  <span className="text-xs font-bold text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 font-mono">LKR</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={fineAmount}
                    onChange={(e) => setFineAmount(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 text-sm pl-12 pr-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">Inspection / Damage Details</label>
                <textarea
                  value={returnNotes}
                  onChange={(e) => setReturnNotes(e.target.value)}
                  placeholder="e.g. Pristine condition returned on time. Late return with stain..."
                  className="w-full bg-slate-50 border border-slate-200 text-sm px-4 py-2 rounded-xl focus:outline-none focus:border-indigo-500 h-24 text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex gap-2 text-xs text-indigo-900 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
                <div>
                  <span className="font-semibold block">Fine Regulations Checklist:</span>
                  Best1suit policy: LKR 500 fine per day for late coat returns. You can edit this fine manually if damage occurs to buttons, wool, or tailoring.
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProcessingReturnId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  Confirm Return & Fine
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}

      {/* 4. Filter Tabs and Search Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap gap-1">
          {([
            { id: 'all', label: 'All Bookings' },
            { id: 'active', label: 'Active Rentals' },
            { id: 'overdue', label: 'Overdue Returns ⚠️' },
            { id: 'returned', label: 'Returned' }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                filter === tab.id 
                  ? 'bg-white text-indigo-800 shadow-sm border border-slate-200' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono px-3">
          Showing {filteredRentals.length} of {rentals.length} book logs
        </div>
      </div>

      {/* 5. Rentals Cards Grid */}
      {filteredRentals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-16 text-center text-slate-400 flex flex-col items-center justify-center shadow-sm">
          <KeyRound className="w-12 h-12 stroke-[1.2] text-slate-200 mb-2" />
          <p className="text-sm font-medium">No rentals fit this search criteria</p>
          <p className="text-xs text-slate-400 mt-1">Book a wedding coat above to populate the ledger list.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRentals.map(rental => {
            const statusInfo = getDaysStatus(rental);
            const DaysIcon = statusInfo.icon;
            return (
              <motion.div
                layout
                key={rental.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                {/* Upper Details */}
                <div className="p-5 space-y-4">
                  {/* Card Header Tag & Days Track */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">COAT: {rental.coatId || 'N/A'}</span>
                    
                    <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-1 rounded-full border ${statusInfo.color}`}>
                      <DaysIcon className="w-3 h-3" />
                      {statusInfo.text}
                    </span>
                  </div>

                  {/* Coat Details */}
                  <div>
                    <h4 className="text-base font-serif font-semibold text-slate-900 line-clamp-1">{rental.coatDescription}</h4>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-800">{rental.customerName}</span>
                      <span>•</span>
                      <span className="font-mono">{rental.customerPhone}</span>
                    </div>
                  </div>

                  {/* Dates Progress */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100/50 space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-500">
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">LENT OUT</span>
                        <span className="text-slate-700 font-semibold">{rental.rentDate}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">EXPECTED RETURN</span>
                        <span className="text-slate-700 font-semibold">{rental.dueDate}</span>
                      </div>
                    </div>

                    {rental.returnDate && (
                      <div className="pt-2 border-t border-slate-200/50 text-xs font-mono text-slate-500">
                        <span className="block text-[9px] text-slate-400 uppercase tracking-wider">ACTUAL RETURN DATE</span>
                        <span className="text-emerald-700 font-semibold">{rental.returnDate}</span>
                      </div>
                    )}
                  </div>

                  {/* Rental notes / Damage reports */}
                  {rental.notes && (
                    <p className="text-xs text-slate-500 italic line-clamp-2 mt-2" title={rental.notes}>
                      "{rental.notes}"
                    </p>
                  )}

                  {/* WhatsApp Reminder Action Button */}
                  {!rental.returnDate && onOpenWhatsAppReminder && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => onOpenWhatsAppReminder(rental)}
                        className={`w-full inline-flex items-center justify-center gap-1.5 text-xs font-mono font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer ${
                          statusInfo.text.includes('Overdue')
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-xs'
                            : statusInfo.text.includes('Today')
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                        title="Send pre-filled text reminder to customer via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>
                          {statusInfo.text.includes('Overdue') 
                            ? 'Send Overdue WhatsApp Reminder' 
                            : 'Send WhatsApp Reminder'}
                        </span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Lower Fee summary & Action Bar */}
                <div className="bg-slate-50/80 px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-xs">
                    <span className="block text-[9px] text-slate-400 font-mono">FEES SUMMARY</span>
                    <span className="font-semibold text-slate-800 font-mono text-sm">{formatLKR(rental.rentalFee)}</span>
                    {rental.fineAmount > 0 && (
                      <span className="text-red-600 font-bold font-mono ml-2">
                        +{formatLKR(rental.fineAmount)} Fine
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {onOpenInvoiceModal && (
                      <button
                        onClick={() => onOpenInvoiceModal(rental)}
                        className="p-2 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 transition-colors cursor-pointer"
                        title="Generate Bill (PDF / Image / WhatsApp)"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!rental.returnDate && (
                      <button
                        onClick={() => startReturnProcess(rental)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return Coat
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleDeleteRental(rental.id)}
                      className="p-2 border border-slate-200 rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

    </div>
  );
}
