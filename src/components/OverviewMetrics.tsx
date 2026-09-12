import { Customer, CoatRental } from '../types';
import { Users, ShieldAlert, KeyRound, Banknote, Calendar, Landmark, FileSpreadsheet, MessageSquare, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { formatLKR } from '../utils/currencyUtils';

interface MetricsProps {
  customers: Customer[];
  rentals: CoatRental[];
  onNavigate: (view: string) => void;
  onSelectCustomer: (customerId: string) => void;
}

export default function OverviewMetrics({ customers, rentals, onNavigate, onSelectCustomer }: MetricsProps) {
  // Calculations
  const totalCustomers = customers.length;
  
  const activeRentals = rentals.filter(r => r.status === 'active' || r.status === 'overdue');
  const totalActiveRentals = activeRentals.length;

  const today = new Date().toISOString().split('T')[0];
  
  const overdueRentals = rentals.filter(r => {
    if (r.status === 'returned' || r.returnDate) return false;
    return r.dueDate < today;
  });
  const totalOverdue = overdueRentals.length;

  const totalFines = rentals.reduce((sum, r) => sum + (r.fineAmount || 0), 0);
  const totalRentalFees = rentals.reduce((sum, r) => sum + (r.rentalFee || 0), 0);

  // Recent transactions/rentals
  const recentRentals = rentals.slice(0, 4);

  return (
    <div className="space-y-8" id="overview-dashboard">
      {/* Welcome Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white p-8 md:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-slate-800/50 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-4 font-mono">
            EST. 2012 • BESPOKE TAILORING
          </span>
          <h1 className="text-3xl md:text-4xl font-serif font-semibold tracking-tight mb-2">
            Welcome back, Best1suit Admin
          </h1>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Manage your loyal customer measurement history, register new monthly clients, and track wedding coat rentals with automated return tracking and fine management.
          </p>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('customers')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-start gap-4"
          id="stat-customers"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Total Clients</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1">{totalCustomers}</h3>
            <p className="text-xs text-slate-400 mt-1">Active monthly customer base</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('rentals')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-start gap-4"
          id="stat-rentals"
        >
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-700">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Active Rentals</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1">{totalActiveRentals}</h3>
            <p className="text-xs text-slate-400 mt-1">Wedding coats currently out</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('rentals')}
          className={`bg-white p-6 rounded-2xl border shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-start gap-4 ${
            totalOverdue > 0 ? 'border-red-200 bg-red-50/10' : 'border-slate-200'
          }`}
          id="stat-overdue"
        >
          <div className={`p-3 rounded-xl ${totalOverdue > 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Overdue Returns</p>
            <h3 className={`text-2xl font-semibold mt-1 ${totalOverdue > 0 ? 'text-red-600' : 'text-slate-900'}`}>{totalOverdue}</h3>
            <p className="text-xs text-slate-400 mt-1">Coat returns past their due date</p>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          onClick={() => onNavigate('rentals')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 flex items-start gap-4"
          id="stat-fines"
        >
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider font-mono">Late Fines</p>
            <h3 className="text-2xl font-semibold text-slate-900 mt-1">{formatLKR(totalFines)}</h3>
            <p className="text-xs text-slate-400 mt-1">Total penalty fines added</p>
          </div>
        </motion.div>
      </div>

      {/* Grid of Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Rentals List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between" id="recent-rentals-card">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-serif font-medium text-slate-900">Recent Rental Activities</h3>
                <p className="text-xs text-slate-500 mt-0.5">Quick lookup of recently scheduled coat bookings</p>
              </div>
              <button 
                onClick={() => onNavigate('rentals')}
                className="text-xs font-mono font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                View All
              </button>
            </div>

            {recentRentals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400">
                <Calendar className="w-10 h-10 stroke-[1.5] mb-2" />
                <p className="text-sm">No rentals recorded yet.</p>
                <button
                  onClick={() => onNavigate('rentals')}
                  className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-3 py-1.5 rounded-lg transition-colors"
                >
                  Create First Rental
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRentals.map((rental) => {
                  const isOverdue = !rental.returnDate && rental.dueDate < today;
                  return (
                    <div 
                      key={rental.id} 
                      className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/5 transition-all duration-150 flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 truncate block text-sm">{rental.customerName}</span>
                          <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            rental.status === 'returned' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                              : isOverdue 
                                ? 'bg-red-50 text-red-700 border border-red-100 animate-pulse'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                          }`}>
                            {rental.status === 'returned' ? 'Returned' : isOverdue ? 'Overdue' : 'Rented'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 truncate">
                          {rental.coatDescription} • ID: <span className="font-mono">{rental.coatId || 'N/A'}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-medium text-slate-700">Due: {rental.dueDate}</p>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          Fee: {formatLKR(rental.rentalFee)} {rental.fineAmount > 0 && <span className="text-red-500 font-semibold">(+{formatLKR(rental.fineAmount)} Fine)</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 -mx-6 -mb-6 p-4 rounded-b-2xl">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Landmark className="w-3.5 h-3.5" /> Total Rental Value:
            </span>
            <span className="text-sm font-semibold text-slate-800 font-mono">
              {formatLKR(totalRentalFees + totalFines)}
            </span>
          </div>
        </div>

        {/* Tailoring Quick Actions & Guides */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm" id="quick-links-card">
          <div>
            <h3 className="text-lg font-serif font-medium text-slate-900 mb-4">Quick Tailor Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  onNavigate('customers');
                  // Trigger direct client addition if possible (handled in main state)
                }}
                className="w-full text-left p-3.5 bg-white hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">Register New Customer</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Save National ID & contact info</p>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">→</span>
              </button>

              <button
                onClick={() => onNavigate('customers')}
                className="w-full text-left p-3.5 bg-white hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">New Measurement</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Record shirt, pants, or wedding coat</p>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">→</span>
              </button>

              <button
                onClick={() => onNavigate('rentals')}
                className="w-full text-left p-3.5 bg-white hover:bg-indigo-50/20 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors font-sans">Rent Wedding Coat</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Define return periods & pricing</p>
                </div>
                <span className="text-slate-400 group-hover:text-indigo-600 transition-colors">→</span>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full text-left p-3.5 bg-white hover:bg-emerald-50/30 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-1.5 font-sans">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Monthly Sales & Reports</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Export revenue figures to Excel & PDF</p>
                </div>
                <span className="text-slate-400 group-hover:text-emerald-600 transition-colors">→</span>
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-900">
            <span className="font-semibold block mb-1">💡 Pro-Tip for Best1suit:</span>
            To find a customer's measurements instantly, use the top search bar and type in their ID number (National ID or Phone). No more flipbooks!
          </div>
        </div>

      </div>
    </div>
  );
}
