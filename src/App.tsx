import { useState, useEffect, useMemo } from 'react';
import { 
  dbGetCustomers, 
  dbSaveCustomer, 
  dbDeleteCustomer, 
  dbGetMeasurementsByCustomer, 
  dbSaveMeasurement, 
  dbDeleteMeasurement, 
  dbGetRentals, 
  dbSaveRental, 
  dbDeleteRental,
  dbGetInvoices,
  dbSaveInvoice,
  dbDeleteInvoice
} from './firebase';
import { Customer, CoatRental, MeasurementRecord, Invoice } from './types';
import OverviewMetrics from './components/OverviewMetrics';
import CustomerManager from './components/CustomerManager';
import RentalManager from './components/RentalManager';
import RevenueReports from './components/RevenueReports';
import InvoiceModal from './components/InvoiceModal';
import WhatsAppSyncModal from './components/WhatsAppSyncModal';
import WhatsAppReminderModal from './components/WhatsAppReminderModal';
import { 
  Scissors, 
  Search, 
  Users, 
  KeyRound, 
  LayoutDashboard, 
  RefreshCw, 
  Layers, 
  Phone, 
  Clock, 
  AlertCircle,
  FileSpreadsheet,
  FileText,
  MessageSquare,
  Smartphone,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const logoImg = new URL('./assets/images/best_1_suit_logo_1782372712737.jpg', import.meta.url).href;

export default function App() {
  // Navigation & Data States
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<CoatRental[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals state
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceModalTarget, setInvoiceModalTarget] = useState<{
    customer?: Customer | null;
    rental?: CoatRental | null;
    invoice?: Invoice | null;
  }>({});

  const [isWhatsAppSyncOpen, setIsWhatsAppSyncOpen] = useState(false);
  const [isWhatsAppReminderOpen, setIsWhatsAppReminderOpen] = useState(false);
  const [reminderTargetRental, setReminderTargetRental] = useState<CoatRental | null>(null);

  // Global ID Quick Search in Header
  const [globalSearch, setGlobalSearch] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<Customer[]>([]);
  const [showGlobalDropdown, setShowGlobalDropdown] = useState(false);

  // Reference for passing selected customer to CustomerManager
  const [selectedCustomerIdForLookup, setSelectedCustomerIdForLookup] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [fetchedCustomers, fetchedRentals, fetchedInvoices] = await Promise.all([
          dbGetCustomers(),
          dbGetRentals(),
          dbGetInvoices()
        ]);
        setCustomers(fetchedCustomers);
        setRentals(fetchedRentals);
        setInvoices(fetchedInvoices);
      } catch (error) {
        console.error("Error loading shop records:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [refreshTrigger]);

  // Handle live updates
  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Global search listener
  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearch(value);
    const query = value.trim().toLowerCase();
    if (!query) {
      setGlobalSearchResults([]);
      setShowGlobalDropdown(false);
      return;
    }

    const filtered = customers.filter(c => 
      c.nationalId.toLowerCase().includes(query) || 
      c.phone.toLowerCase().includes(query) || 
      c.name.toLowerCase().includes(query)
    );
    setGlobalSearchResults(filtered);
    setShowGlobalDropdown(true);
  };

  // Select a customer from global search dropdown
  const selectCustomerFromGlobal = (customerId: string) => {
    setActiveTab('customers');
    setSelectedCustomerIdForLookup(customerId);
    setGlobalSearch('');
    setShowGlobalDropdown(false);
  };

  // Helper: check overdue rentals count for quick header warning badge
  const overdueCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return rentals.filter(r => !r.returnDate && r.dueDate < todayStr).length;
  }, [rentals]);

  // DB Wrapper methods to propagate state changes immediately to UI
  const handleSaveCustomer = async (custData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const saved = await dbSaveCustomer(custData);
    triggerRefresh();
    return saved;
  };

  const handleDeleteCustomer = async (id: string) => {
    await dbDeleteCustomer(id);
    triggerRefresh();
  };

  const handleSaveRental = async (rentData: Omit<CoatRental, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const saved = await dbSaveRental(rentData);
    triggerRefresh();
    return saved;
  };

  const handleDeleteRental = async (id: string) => {
    await dbDeleteRental(id);
    triggerRefresh();
  };

  const handleSaveInvoice = async (invData: Omit<Invoice, 'id' | 'createdAt'> & { id?: string }) => {
    const saved = await dbSaveInvoice(invData);
    triggerRefresh();
    return saved;
  };

  // Open invoice modal for a specific entity
  const handleOpenInvoiceModal = (target?: { customer?: Customer | null; rental?: CoatRental | null; invoice?: Invoice | null } | Invoice | CoatRental | Customer | null) => {
    if (!target) {
      setInvoiceModalTarget({});
    } else if ('invoiceNumber' in target) {
      setInvoiceModalTarget({ invoice: target as Invoice });
    } else if ('coatId' in target) {
      setInvoiceModalTarget({ rental: target as CoatRental });
    } else if ('nationalId' in target) {
      setInvoiceModalTarget({ customer: target as Customer });
    } else {
      setInvoiceModalTarget(target as any);
    }
    setIsInvoiceModalOpen(true);
  };

  // Open WhatsApp reminder modal for a rental
  const handleOpenWhatsAppReminder = (rental: CoatRental) => {
    setReminderTargetRental(rental);
    setIsWhatsAppReminderOpen(true);
  };

  // Record WhatsApp reminder notification timestamp in rental
  const handleRecordRentalReminder = async (rentalId: string, timestamp: string) => {
    const targetRental = rentals.find(r => r.id === rentalId);
    if (targetRental) {
      const existingNotes = targetRental.notes ? `${targetRental.notes}\n` : '';
      const updatedNotes = `${existingNotes}[WhatsApp return reminder sent: ${timestamp}]`;
      await dbSaveRental({
        ...targetRental,
        notes: updatedNotes
      });
      triggerRefresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans relative antialiased">
      {/* Decorative Accent */}
      <div className="h-1 bg-gradient-to-r from-indigo-400 via-indigo-600 to-indigo-400 w-full z-30 shrink-0" />

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 py-3.5 px-6 sticky top-0 z-30 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0">
        <div className="flex items-center justify-between">
          {/* Logo Brand */}
          <div 
            onClick={() => setActiveTab('overview')}
            className="flex items-center cursor-pointer select-none group"
          >
            <img 
              src={logoImg} 
              alt="Best 1 Suit Logo" 
              className="h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Quick refresh button */}
          <button 
            onClick={triggerRefresh}
            className="md:hidden p-2 text-slate-400 hover:text-slate-700 bg-slate-50 rounded-lg border border-slate-200"
            title="Refresh database"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Global Instant Customer Search */}
        <div className="relative max-w-md w-full md:mx-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Instant Search ID / Phone / Name..."
              value={globalSearch}
              onChange={(e) => handleGlobalSearchChange(e.target.value)}
              onFocus={() => {
                if (globalSearch) setShowGlobalDropdown(true);
              }}
              className="w-full bg-slate-50/80 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none transition-all font-mono shadow-inner"
            />
          </div>

          {/* Search Dropdown Dialog */}
          <AnimatePresence>
            {showGlobalDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowGlobalDropdown(false)} 
                />
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 max-h-72 overflow-y-auto divide-y divide-slate-100"
                >
                  <div className="bg-slate-50 px-4 py-2 text-[10px] font-mono font-bold text-slate-400 tracking-wider">
                    FITTING BOOK RESULTS
                  </div>
                  {globalSearchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 italic">
                      No customer match for "{globalSearch}". Try National ID or Full Name.
                    </div>
                  ) : (
                    globalSearchResults.map(cust => (
                      <button
                        key={cust.id}
                        onClick={() => selectCustomerFromGlobal(cust.id)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50/30 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">{cust.name}</p>
                          <p className="text-[10px] font-mono text-slate-500 mt-0.5 truncate">
                            ID: <span className="text-indigo-800 font-bold">{cust.nationalId}</span> • {cust.phone}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 shrink-0">
                          View Sizing
                        </span>
                      </button>
                    ))
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Header Actions */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* WhatsApp Sync Button */}
          <button
            onClick={() => setIsWhatsAppSyncOpen(true)}
            className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-mono font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="WhatsApp Business & Web Sync Settings"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            <span>WhatsApp Synced</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </button>

          {/* Quick New Bill Button */}
          <button
            onClick={() => handleOpenInvoiceModal(null)}
            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-mono font-semibold px-3 py-2 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Create and Send Bill via WhatsApp (PDF & Image)"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span>+ Bill</span>
          </button>

          <button 
            onClick={triggerRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-600 rounded-xl text-xs font-mono font-bold transition-all border border-slate-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            {loading ? 'SYNCING...' : 'LIVE DB'}
          </button>
          
          {overdueCount > 0 && (
            <button
              onClick={() => setActiveTab('rentals')}
              className="flex items-center gap-1 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-2 rounded-xl border border-red-200 animate-pulse cursor-pointer hover:bg-red-100 transition-colors"
              title="Click to view overdue rentals and dispatch WhatsApp alerts"
            >
              <AlertCircle className="w-3.5 h-3.5" /> {overdueCount} Overdue Coat{overdueCount > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Navigation Sidebar (Desktop) */}
        <nav className="w-full md:w-64 bg-slate-900 text-slate-300 p-4 space-y-2 border-r border-slate-800 flex md:flex-col justify-between shrink-0" id="sidebar">
          
          {/* Nav Items Group */}
          <div className="flex md:flex-col w-full gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            
            {/* Dashboard Overview */}
            <button
              onClick={() => {
                setActiveTab('overview');
                setSelectedCustomerIdForLookup(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold font-mono flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'overview' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard Overview</span>
            </button>

            {/* Measurements & Clients */}
            <button
              onClick={() => {
                setActiveTab('customers');
                setSelectedCustomerIdForLookup(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold font-mono flex items-center gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'customers' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 shrink-0" />
              <span>Measurements & Clients</span>
            </button>

            {/* Wedding Coat Rentals */}
            <button
              onClick={() => {
                setActiveTab('rentals');
                setSelectedCustomerIdForLookup(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold font-mono flex items-center justify-between gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'rentals' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <KeyRound className="w-4 h-4 shrink-0" />
                <span>Wedding Coat Rentals</span>
              </div>
              {overdueCount > 0 && (
                <span className="text-[9px] bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full animate-bounce">
                  {overdueCount}
                </span>
              )}
            </button>

            {/* Monthly Sales & Revenue Reports */}
            <button
              onClick={() => {
                setActiveTab('reports');
                setSelectedCustomerIdForLookup(null);
              }}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-semibold font-mono flex items-center justify-between gap-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'reports' 
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/10' 
                  : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Monthly Sales & Reports</span>
              </div>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded">
                Excel/PDF
              </span>
            </button>

          </div>

          {/* Quick Action in Sidebar footer */}
          <div className="hidden md:block pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={() => setIsWhatsAppSyncOpen(true)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-mono text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700/50"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Sync</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                ACTIVE
              </span>
            </button>

            <div className="text-[10px] text-slate-500 font-mono space-y-0.5 pl-1">
              <p>© 2026 BEST1SUIT TAILORS</p>
              <p className="text-emerald-400/80 font-semibold">● WHATSAPP SYNC CONNECTED</p>
            </div>
          </div>
        </nav>

        {/* Main Content Workspace Panel */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="min-h-full"
            >
              {activeTab === 'overview' && (
                <OverviewMetrics
                  customers={customers}
                  rentals={rentals}
                  onNavigate={(view) => {
                    setActiveTab(view);
                    setSelectedCustomerIdForLookup(null);
                  }}
                  onSelectCustomer={(id) => {
                    setActiveTab('customers');
                    setSelectedCustomerIdForLookup(id);
                  }}
                />
              )}

              {activeTab === 'customers' && (
                <CustomerManager
                  customers={customers}
                  rentals={rentals}
                  onSaveCustomer={handleSaveCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onGetMeasurements={dbGetMeasurementsByCustomer}
                  onSaveMeasurement={dbSaveMeasurement}
                  onDeleteMeasurement={dbDeleteMeasurement}
                  initialSelectedCustomerId={selectedCustomerIdForLookup}
                  onOpenInvoiceModal={(cust) => handleOpenInvoiceModal(cust)}
                />
              )}

              {activeTab === 'rentals' && (
                <RentalManager
                  rentals={rentals}
                  customers={customers}
                  onSaveRental={handleSaveRental}
                  onDeleteRental={handleDeleteRental}
                  onOpenWhatsAppReminder={handleOpenWhatsAppReminder}
                  onOpenInvoiceModal={(rent) => handleOpenInvoiceModal(rent)}
                  onOpenWhatsAppSync={() => setIsWhatsAppSyncOpen(true)}
                />
              )}

              {activeTab === 'reports' && (
                <RevenueReports
                  invoices={invoices}
                  rentals={rentals}
                  customers={customers}
                  onOpenInvoiceModal={(inv) => handleOpenInvoiceModal(inv)}
                  onOpenWhatsAppSync={() => setIsWhatsAppSyncOpen(true)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* MODAL: Customer Bill & Invoice Generator (PDF, Image, and WhatsApp) */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSaveInvoice={handleSaveInvoice}
        initialCustomer={invoiceModalTarget.customer}
        initialRental={invoiceModalTarget.rental}
        existingInvoice={invoiceModalTarget.invoice}
      />

      {/* MODAL: WhatsApp System Synchronization Settings */}
      <WhatsAppSyncModal
        isOpen={isWhatsAppSyncOpen}
        onClose={() => setIsWhatsAppSyncOpen(false)}
      />

      {/* MODAL: Overdue / Due Coat WhatsApp Return Reminder */}
      <WhatsAppReminderModal
        rental={reminderTargetRental}
        isOpen={isWhatsAppReminderOpen}
        onClose={() => {
          setIsWhatsAppReminderOpen(false);
          setReminderTargetRental(null);
        }}
        onRecordNotification={handleRecordRentalReminder}
      />

    </div>
  );
}

