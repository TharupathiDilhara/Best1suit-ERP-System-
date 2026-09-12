export interface Customer {
  id: string; // Document ID in Firestore (or same as nationalId if customized)
  nationalId: string; // Primary ID used for searching (National ID, Phone, etc.)
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type MeasurementType = 'shirt' | 'pants' | 'coat';

export interface ShirtMeasurements {
  collar: number;
  chest: number;
  waist: number;
  sleeveLength: number;
  shoulderWidth: number;
  shirtLength: number;
  cuff: number;
  armhole?: number;
  bicep?: number;
}

export interface PantsMeasurements {
  waist: number;
  hip: number;
  crotchDepth?: number;
  inseam: number;
  outseam: number;
  thigh: number;
  knee: number;
  bottomOpening: number;
}

export interface CoatMeasurements {
  chest: number;
  waist: number;
  shoulderWidth: number;
  sleeveLength: number;
  coatLength: number;
  neck: number;
  backWidth: number;
  armhole?: number;
  bicep?: number;
}

export interface MeasurementRecord {
  id: string;
  customerId: string;
  date: string; // YYYY-MM-DD
  type: MeasurementType;
  notes: string;
  values: ShirtMeasurements | PantsMeasurements | CoatMeasurements;
}

export interface CoatRental {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  coatDescription: string;
  coatId: string; // Inventory tracker or size info
  rentDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  returnDate: string | null; // YYYY-MM-DD (null if active/overdue)
  rentalFee: number;
  paidAmount: number;
  fineAmount: number; // Manual or calculated additional fine
  status: 'active' | 'returned' | 'overdue';
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: 'tailoring' | 'rental' | 'alteration' | 'fabric' | 'fine';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  date: string; // YYYY-MM-DD
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paidAmount: number;
  balanceDue: number;
  status: 'paid' | 'partial' | 'unpaid';
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
}

export interface WhatsAppSyncConfig {
  businessPhone: string;
  countryCode: string;
  syncStatus: 'synced' | 'pending' | 'disconnected';
  reminderTemplate: string;
  invoiceTemplate: string;
  lastSyncedAt?: string;
}
