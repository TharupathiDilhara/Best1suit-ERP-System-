import React, { useState, useMemo, useEffect } from 'react';
import { Customer, MeasurementRecord, CoatRental } from '../types';
import { Search, Plus, UserPlus, Phone, CreditCard, Mail, MapPin, Calendar, Trash2, Edit2, ChevronRight, FileText, Ruler, RefreshCw, Scissors } from 'lucide-react';
import MeasurementForm from './MeasurementForm';
import { motion, AnimatePresence } from 'motion/react';
import { formatFractionalInches } from '../utils/fractionUtils';
import { formatLKR } from '../utils/currencyUtils';

interface CustomerManagerProps {
  customers: Customer[];
  rentals: CoatRental[];
  onSaveCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<Customer>;
  onDeleteCustomer: (id: string) => Promise<void>;
  onGetMeasurements: (customerId: string) => Promise<MeasurementRecord[]>;
  onSaveMeasurement: (record: Omit<MeasurementRecord, 'id'>) => Promise<MeasurementRecord>;
  onDeleteMeasurement: (id: string, customerId: string) => Promise<void>;
  initialSelectedCustomerId?: string | null;
  onOpenInvoiceModal?: (customer: Customer) => void;
}

export default function CustomerManager({
  customers,
  rentals,
  onSaveCustomer,
  onDeleteCustomer,
  onGetMeasurements,
  onSaveMeasurement,
  onDeleteMeasurement,
  initialSelectedCustomerId = null,
  onOpenInvoiceModal
}: CustomerManagerProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialSelectedCustomerId);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isAddingMeasurement, setIsAddingMeasurement] = useState(false);
  
  // Form states
  const [newNationalId, setNewNationalId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newNotes, setNewNotes] = useState('');
  
  // Loaded measurements for selected customer
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [loadingMeasurements, setLoadingMeasurements] = useState(false);

  // Selected Customer details
  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Load measurements when customer is selected
  const handleSelectCustomer = async (id: string) => {
    setSelectedCustomerId(id);
    setIsAddingMeasurement(false);
    setIsEditingCustomer(false);
    setLoadingMeasurements(true);
    try {
      const records = await onGetMeasurements(id);
      setMeasurements(records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMeasurements(false);
    }
  };

  // Run selection on mount/change if initialSelectedCustomerId is present
  useEffect(() => {
    if (initialSelectedCustomerId) {
      handleSelectCustomer(initialSelectedCustomerId);
    }
  }, [initialSelectedCustomerId]);

  // Filtered customers list based on National ID, Phone, or Name
  const filteredCustomers = useMemo(() => {
    const queryStr = searchQuery.trim().toLowerCase();
    if (!queryStr) return customers;
    return customers.filter(c => 
      c.nationalId.toLowerCase().includes(queryStr) || 
      c.phone.toLowerCase().includes(queryStr) || 
      c.name.toLowerCase().includes(queryStr)
    );
  }, [customers, searchQuery]);

  // Related rentals
  const customerRentals = useMemo(() => {
    if (!selectedCustomerId) return [];
    return rentals.filter(r => r.customerId === selectedCustomerId);
  }, [rentals, selectedCustomerId]);

  // Handle Save Customer (Create & Update)
  const handleSaveCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNationalId || !newName || !newPhone) return;

    try {
      const saved = await onSaveCustomer({
        id: isEditingCustomer && selectedCustomer ? selectedCustomer.id : undefined,
        nationalId: newNationalId.trim(),
        name: newName.trim(),
        phone: newPhone.trim(),
        email: newEmail.trim(),
        address: newAddress.trim(),
        notes: newNotes.trim()
      });

      // Clear form
      setNewNationalId('');
      setNewName('');
      setNewPhone('');
      setNewEmail('');
      setNewAddress('');
      setNewNotes('');
      setIsAddingCustomer(false);
      setIsEditingCustomer(false);

      // Select newly saved customer
      handleSelectCustomer(saved.id);
    } catch (err) {
      console.error(err);
    }
  };

  // Trigger Edit Customer
  const triggerEditCustomer = () => {
    if (!selectedCustomer) return;
    setNewNationalId(selectedCustomer.nationalId);
    setNewName(selectedCustomer.name);
    setNewPhone(selectedCustomer.phone);
    setNewEmail(selectedCustomer.email);
    setNewAddress(selectedCustomer.address);
    setNewNotes(selectedCustomer.notes);
    setIsEditingCustomer(true);
  };

  // Trigger Delete Customer
  const handleDeleteCustomerClick = async () => {
    if (!selectedCustomerId) return;
    if (confirm("Are you sure you want to permanently delete this customer and all their measurement logs?")) {
      await onDeleteCustomer(selectedCustomerId);
      setSelectedCustomerId(null);
    }
  };

  // Handle Save Measurement
  const handleSaveMeasurementSubmit = async (record: Omit<MeasurementRecord, 'id'>) => {
    try {
      const saved = await onSaveMeasurement(record);
      setMeasurements(prev => [saved, ...prev]);
      setIsAddingMeasurement(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete Measurement
  const handleDeleteMeasurementClick = async (measId: string) => {
    if (!selectedCustomerId) return;
    if (confirm("Delete this measurement record?")) {
      await onDeleteMeasurement(measId, selectedCustomerId);
      setMeasurements(prev => prev.filter(m => m.id !== measId));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="customer-manager">
      
      {/* LEFT COLUMN: Customer Search & List (5 cols) */}
      <div className="lg:col-span-4 flex flex-col gap-4" id="customer-list-panel">
        
        {/* Search and Action Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-serif font-semibold text-slate-900">Clients Ledger</h2>
            <button
              onClick={() => {
                setIsAddingCustomer(true);
                setIsEditingCustomer(false);
                setSelectedCustomerId(null);
                setNewNationalId(searchQuery); // Pre-populate search query in National ID
                setNewName('');
                setNewPhone('');
                setNewEmail('');
                setNewAddress('');
                setNewNotes('');
              }}
              className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Client
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, phone, or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono"
            />
          </div>
        </div>

        {/* Customer List Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 overflow-hidden min-h-[400px] flex flex-col justify-between">
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[550px] flex-1">
            {filteredCustomers.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center py-20">
                <Scissors className="w-8 h-8 text-slate-300 stroke-[1.5] mb-2" />
                <p className="text-sm font-medium">No customers found</p>
                <p className="text-xs text-slate-400 mt-1">Try another search or add a new client</p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setIsAddingCustomer(true);
                      setIsEditingCustomer(false);
                      setNewNationalId(searchQuery);
                      setNewName('');
                      setNewPhone('');
                      setNewEmail('');
                      setNewAddress('');
                      setNewNotes('');
                    }}
                    className="mt-4 text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/50 px-3 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Register ID: "{searchQuery}"
                  </button>
                )}
              </div>
            ) : (
              filteredCustomers.map((customer) => {
                const isSelected = customer.id === selectedCustomerId;
                return (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer.id)}
                    className={`w-full text-left p-4 flex items-center justify-between gap-3 transition-all hover:bg-slate-50 cursor-pointer ${
                      isSelected ? 'bg-indigo-50/40 border-l-4 border-indigo-600 pl-3' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className={`font-medium text-sm truncate ${isSelected ? 'text-indigo-950 font-bold' : 'text-slate-800'}`}>
                        {customer.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 font-mono">
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold">
                          ID: {customer.nationalId}
                        </span>
                        <span>•</span>
                        <span>{customer.phone}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isSelected ? 'text-indigo-600 translate-x-1' : 'text-slate-300'}`} />
                  </button>
                );
              })
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Showing {filteredCustomers.length} of {customers.length} clients</span>
            <span>Sorted alphabetically</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Customer Details, Add, Edit, or Measurements (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6" id="customer-detail-panel">
        
        {/* 1. STATE: Adding or Editing Customer */}
        {(isAddingCustomer || isEditingCustomer) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md"
            id="customer-form"
          >
            <h3 className="text-lg font-serif font-semibold text-slate-900 mb-6 pb-2 border-b border-slate-100">
              {isEditingCustomer ? `Edit Profile: ${selectedCustomer?.name}` : 'Register New Fitting Client'}
            </h3>

            <form onSubmit={handleSaveCustomerSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* National ID / Search ID */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    ID / National ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. 952210443V, NIC, or custom code"
                      value={newNationalId}
                      onChange={(e) => setNewNationalId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Customer Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2 rounded-xl focus:outline-none transition-all font-sans"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +1 555-0199"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Email (Optional) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="e.g. john@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all font-mono"
                    />
                  </div>
                </div>

              </div>

              {/* Address (Optional) */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  Mailing / Home Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <textarea
                    placeholder="Enter physical address..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm pl-9 pr-4 py-2 rounded-xl focus:outline-none transition-all h-16"
                  />
                </div>
              </div>

              {/* General customer profile notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                  Private Profile Notes / Reminders
                </label>
                <textarea
                  placeholder="e.g. Regular monthly customer, prefers wedding wool suits, usually prefers button downs..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:bg-white text-sm px-4 py-2 rounded-xl focus:outline-none transition-all h-20"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCustomer(false);
                    setIsEditingCustomer(false);
                  }}
                  className="px-5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-all shadow-sm cursor-pointer"
                >
                  {isEditingCustomer ? 'Update Profile' : 'Register Customer'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* 2. STATE: Logging Measurements */}
        {isAddingMeasurement && selectedCustomer && (
          <MeasurementForm
            customerId={selectedCustomer.id}
            customerName={selectedCustomer.name}
            onSave={handleSaveMeasurementSubmit}
            onCancel={() => setIsAddingMeasurement(false)}
          />
        )}

        {/* 3. STATE: Customer Details & Measurement Archives */}
        {!isAddingCustomer && !isEditingCustomer && !isAddingMeasurement && (
          <>
            {selectedCustomer ? (
              <div className="space-y-6" id="customer-profile-details">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 rounded-full bg-indigo-500/5 pointer-events-none" />
                  
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 font-serif text-lg font-bold flex items-center justify-center border border-indigo-100">
                        {selectedCustomer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-serif font-bold text-slate-900">{selectedCustomer.name}</h2>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                          <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase font-semibold">
                            ID: {selectedCustomer.nationalId}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" /> {selectedCustomer.phone}
                          </span>
                          {selectedCustomer.email && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 font-mono">
                                <Mail className="w-3 h-3" /> {selectedCustomer.email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {onOpenInvoiceModal && (
                        <button
                          onClick={() => onOpenInvoiceModal(selectedCustomer)}
                          className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                          title="Generate bill and send via WhatsApp as PDF & Image"
                        >
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Generate Bill</span>
                        </button>
                      )}
                      <button
                        onClick={triggerEditCustomer}
                        className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-800 text-slate-500 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                      </button>
                      <button
                        onClick={handleDeleteCustomerClick}
                        className="p-2 border border-red-100 text-red-500 rounded-xl hover:bg-red-50 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  {/* Profile Body Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
                    {selectedCustomer.address && (
                      <div className="space-y-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Home Address</span>
                        <p className="text-slate-700 flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          {selectedCustomer.address}
                        </p>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">Client Notes</span>
                      <p className="text-slate-700 italic">
                        {selectedCustomer.notes || "No special client details noted."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Measurements Log Header & Content */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-serif font-semibold text-slate-900">Bespoke Fitting Archives</h3>
                      <p className="text-xs text-slate-500">History of shirt, trouser, and coat measurements</p>
                    </div>

                    <button
                      onClick={() => setIsAddingMeasurement(true)}
                      className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <Ruler className="w-4 h-4" /> Log Measurements
                    </button>
                  </div>

                  {loadingMeasurements ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                      <p className="text-sm font-mono">Retrieving tailoring books...</p>
                    </div>
                  ) : measurements.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-xl py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 stroke-[1.5] text-slate-300 mb-2" />
                      <p className="text-sm font-medium">No measurements on file</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        This customer does not have any sizing records. Click "Log Measurements" above to record their first suit fitting.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {measurements.map((record) => {
                        return (
                          <div key={record.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                            
                            {/* Card Header */}
                            <div className="bg-slate-50 px-4 py-3.5 border-b border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  record.type === 'shirt' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : record.type === 'pants' 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-indigo-100 text-indigo-800'
                                }`}>
                                  {record.type === 'shirt' ? '👔 Shirt' : record.type === 'pants' ? '👖 Trousers' : '🧥 Coat'}
                                </span>
                                <span className="text-xs font-mono text-slate-500">Fitting Date: {record.date}</span>
                              </div>

                              <button
                                onClick={() => handleDeleteMeasurementClick(record.id)}
                                className="text-slate-400 hover:text-red-500 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                                title="Delete record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Card Details / Table */}
                            <div className="p-4 bg-white">
                              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-3">
                                {Object.entries(record.values).map(([key, val]) => {
                                  // Capitalize and format key name
                                  const formattedKey = key
                                    .replace(/([A-Z])/g, ' $1')
                                    .replace(/^./, str => str.toUpperCase());
                                  const isKeySpec = key === 'armhole' || key === 'bicep' || key === 'crotchDepth';
                                  return (
                                    <div
                                      key={key}
                                      className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                                        isKeySpec
                                          ? 'bg-indigo-50/50 border-indigo-200/80 ring-1 ring-indigo-500/10'
                                          : 'bg-slate-50/50 border-slate-100'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <span className={`text-[10px] font-medium tracking-wide uppercase truncate ${
                                          isKeySpec ? 'text-indigo-700 font-semibold' : 'text-slate-400'
                                        }`}>
                                          {formattedKey}
                                        </span>
                                      </div>
                                      <span className="text-base font-semibold text-slate-800 font-mono mt-1">
                                        {formatFractionalInches(val as number)}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {record.notes && (
                                <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-2">
                                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded uppercase font-mono font-bold shrink-0 mt-0.5">Notes:</span>
                                  <p className="text-xs text-slate-600 italic">"{record.notes}"</p>
                                </div>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Customer Rental Records */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-base font-serif font-semibold text-slate-900 mb-4">Wedding Coat Booking History</h3>
                  
                  {customerRentals.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">This customer has no recorded coat rental logs.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {customerRentals.map((rental) => {
                        return (
                          <div key={rental.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-mono text-[10px] font-semibold text-slate-400 uppercase">COAT ID: {rental.coatId || 'N/A'}</span>
                                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  rental.status === 'returned' 
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                    : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                }`}>
                                  {rental.status}
                                </span>
                              </div>
                              <p className="text-sm font-semibold text-slate-800 line-clamp-1">{rental.coatDescription}</p>
                              
                              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-slate-500 font-mono">
                                <div>
                                  <span className="block text-[9px] text-slate-400">RENT DATE</span>
                                  <span>{rental.rentDate}</span>
                                </div>
                                <div>
                                  <span className="block text-[9px] text-slate-400">RETURN DUE</span>
                                  <span>{rental.dueDate}</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-mono">
                              <span>Fee: {formatLKR(rental.rentalFee)}</span>
                              {rental.fineAmount > 0 && <span className="text-red-500 font-bold">Fine: +{formatLKR(rental.fineAmount)}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[500px]">
                <Scissors className="w-16 h-16 stroke-[1.2] text-slate-200 mb-4 animate-pulse" />
                <h3 className="text-lg font-serif font-medium text-slate-800">Select a Client Record</h3>
                <p className="text-sm text-slate-400 mt-2 max-w-sm">
                  Search by ID or pick from the ledger list on the left to review their measurement logs and coat rental schedules.
                </p>
                <div className="mt-6 flex flex-wrap gap-2 justify-center">
                  <button
                    onClick={() => {
                      setIsAddingCustomer(true);
                      setIsEditingCustomer(false);
                      setNewNationalId('');
                      setNewName('');
                      setNewPhone('');
                      setNewEmail('');
                      setNewAddress('');
                      setNewNotes('');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    + Register New Client
                  </button>
                </div>
              </div>
            )}
          </>
        )}

      </div>

    </div>
  );
}
