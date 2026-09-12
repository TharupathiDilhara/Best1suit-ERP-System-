import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { Customer, MeasurementRecord, CoatRental, Invoice } from './types';
import config from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(config);

// Initialize Firestore with the custom databaseId from the applet configuration
const db = getFirestore(app, config.firestoreDatabaseId || '(default)');

// Cache / Fallback standard helper to ensure the app stays responsive even with slow networks
const isUsingLocalStorageFallback = false;

// Helpers for Customer CRUD
export async function dbGetCustomers(): Promise<Customer[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'customers'), orderBy('name')));
    const list: Customer[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Customer);
    });
    // Save to local storage for quick cache loading
    localStorage.setItem('best1suit_customers_cache', JSON.stringify(list));
    return list;
  } catch (error) {
    console.error('Firestore Error fetching customers, trying cache:', error);
    const cached = localStorage.getItem('best1suit_customers_cache');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function dbSaveCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Customer> {
  const now = new Date().toISOString();
  const id = customer.id || customer.nationalId.trim().toLowerCase().replace(/\s+/g, '_');
  const fullCustomer: Customer = {
    ...customer,
    id,
    nationalId: customer.nationalId.trim(),
    createdAt: now,
    updatedAt: now
  };

  try {
    const docRef = doc(db, 'customers', id);
    await setDoc(docRef, fullCustomer);
    return fullCustomer;
  } catch (error) {
    console.error('Firestore Error saving customer:', error);
    // Local fallback save
    const cached = localStorage.getItem('best1suit_customers_cache');
    const list: Customer[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(c => c.id === id);
    if (idx >= 0) {
      list[idx] = fullCustomer;
    } else {
      list.push(fullCustomer);
    }
    localStorage.setItem('best1suit_customers_cache', JSON.stringify(list));
    return fullCustomer;
  }
}

export async function dbUpdateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const now = new Date().toISOString();
  try {
    const docRef = doc(db, 'customers', id);
    await updateDoc(docRef, { ...updates, updatedAt: now });
  } catch (error) {
    console.error('Firestore Error updating customer:', error);
    const cached = localStorage.getItem('best1suit_customers_cache');
    if (cached) {
      const list: Customer[] = JSON.parse(cached);
      const idx = list.findIndex(c => c.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, updatedAt: now };
        localStorage.setItem('best1suit_customers_cache', JSON.stringify(list));
      }
    }
  }
}

export async function dbDeleteCustomer(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'customers', id));
  } catch (error) {
    console.error('Firestore Error deleting customer:', error);
    const cached = localStorage.getItem('best1suit_customers_cache');
    if (cached) {
      const list: Customer[] = JSON.parse(cached);
      const filtered = list.filter(c => c.id !== id);
      localStorage.setItem('best1suit_customers_cache', JSON.stringify(filtered));
    }
  }
}

// Helpers for Measurements
export async function dbGetMeasurementsByCustomer(customerId: string): Promise<MeasurementRecord[]> {
  try {
    const q = query(
      collection(db, 'measurements'), 
      where('customerId', '==', customerId),
      orderBy('date', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const list: MeasurementRecord[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as MeasurementRecord);
    });
    localStorage.setItem(`best1suit_measurements_cache_${customerId}`, JSON.stringify(list));
    return list;
  } catch (error) {
    console.error('Firestore Error fetching measurements:', error);
    const cached = localStorage.getItem(`best1suit_measurements_cache_${customerId}`);
    return cached ? JSON.parse(cached) : [];
  }
}

export async function dbSaveMeasurement(measurement: Omit<MeasurementRecord, 'id'>): Promise<MeasurementRecord> {
  try {
    const colRef = collection(db, 'measurements');
    const docRef = await addDoc(colRef, measurement);
    const record: MeasurementRecord = {
      ...measurement,
      id: docRef.id
    };
    return record;
  } catch (error) {
    console.error('Firestore Error saving measurement:', error);
    const id = 'meas_' + Math.random().toString(36).substr(2, 9);
    const record: MeasurementRecord = { ...measurement, id };
    const cached = localStorage.getItem(`best1suit_measurements_cache_${measurement.customerId}`);
    const list: MeasurementRecord[] = cached ? JSON.parse(cached) : [];
    list.unshift(record);
    localStorage.setItem(`best1suit_measurements_cache_${measurement.customerId}`, JSON.stringify(list));
    return record;
  }
}

export async function dbDeleteMeasurement(id: string, customerId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'measurements', id));
  } catch (error) {
    console.error('Firestore Error deleting measurement:', error);
    const cached = localStorage.getItem(`best1suit_measurements_cache_${customerId}`);
    if (cached) {
      const list: MeasurementRecord[] = JSON.parse(cached);
      const filtered = list.filter(m => m.id !== id);
      localStorage.setItem(`best1suit_measurements_cache_${customerId}`, JSON.stringify(filtered));
    }
  }
}

// Helpers for Rentals
export async function dbGetRentals(): Promise<CoatRental[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'rentals'), orderBy('rentDate', 'desc')));
    const list: CoatRental[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as CoatRental);
    });
    localStorage.setItem('best1suit_rentals_cache', JSON.stringify(list));
    return list;
  } catch (error) {
    console.error('Firestore Error fetching rentals, trying cache:', error);
    const cached = localStorage.getItem('best1suit_rentals_cache');
    return cached ? JSON.parse(cached) : [];
  }
}

export async function dbSaveRental(rental: Omit<CoatRental, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<CoatRental> {
  const now = new Date().toISOString();
  try {
    const colRef = collection(db, 'rentals');
    let fullRental: CoatRental;
    if (rental.id) {
      const docRef = doc(db, 'rentals', rental.id);
      fullRental = {
        ...rental,
        id: rental.id,
        createdAt: now, // or preserve if we fetched
        updatedAt: now
      };
      await setDoc(docRef, fullRental);
    } else {
      const docRef = await addDoc(colRef, {
        ...rental,
        createdAt: now,
        updatedAt: now
      });
      fullRental = {
        ...rental,
        id: docRef.id,
        createdAt: now,
        updatedAt: now
      };
    }
    return fullRental;
  } catch (error) {
    console.error('Firestore Error saving rental:', error);
    const id = rental.id || 'rent_' + Math.random().toString(36).substr(2, 9);
    const fullRental: CoatRental = {
      ...rental,
      id,
      createdAt: now,
      updatedAt: now
    };
    const cached = localStorage.getItem('best1suit_rentals_cache');
    const list: CoatRental[] = cached ? JSON.parse(cached) : [];
    const idx = list.findIndex(r => r.id === id);
    if (idx >= 0) {
      list[idx] = fullRental;
    } else {
      list.unshift(fullRental);
    }
    localStorage.setItem('best1suit_rentals_cache', JSON.stringify(list));
    return fullRental;
  }
}

export async function dbUpdateRental(id: string, updates: Partial<CoatRental>): Promise<void> {
  const now = new Date().toISOString();
  try {
    const docRef = doc(db, 'rentals', id);
    await updateDoc(docRef, { ...updates, updatedAt: now });
  } catch (error) {
    console.error('Firestore Error updating rental:', error);
    const cached = localStorage.getItem('best1suit_rentals_cache');
    if (cached) {
      const list: CoatRental[] = JSON.parse(cached);
      const idx = list.findIndex(r => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updates, updatedAt: now };
        localStorage.setItem('best1suit_rentals_cache', JSON.stringify(list));
      }
    }
  }
}

export async function dbDeleteRental(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'rentals', id));
  } catch (error) {
    console.error('Firestore Error deleting rental:', error);
    const cached = localStorage.getItem('best1suit_rentals_cache');
    if (cached) {
      const list: CoatRental[] = JSON.parse(cached);
      const filtered = list.filter(r => r.id !== id);
      localStorage.setItem('best1suit_rentals_cache', JSON.stringify(filtered));
    }
  }
}

// Sample starter invoices for comprehensive monthly figures in Sri Lankan Rupees (LKR)
const sampleStarterInvoices: Invoice[] = [
  {
    id: 'inv_2026_09_01',
    invoiceNumber: 'INV-2026-091',
    customerId: 'cust_1',
    customerName: 'Marcus Vance',
    customerPhone: '+94 77 234 8901',
    customerAddress: '45 Galle Road, Kollupitiya, Colombo 03',
    date: '2026-09-08',
    dueDate: '2026-09-15',
    items: [
      { id: 'i1', description: 'Two-Piece Bespoke Navy Wool Suit (Coat & Trousers)', category: 'tailoring', quantity: 1, unitPrice: 45000, total: 45000 },
      { id: 'i2', description: 'Egyptian Cotton Custom Dress Shirt', category: 'tailoring', quantity: 2, unitPrice: 6500, total: 13000 }
    ],
    subtotal: 58000,
    discount: 3000,
    tax: 0,
    total: 55000,
    paidAmount: 55000,
    balanceDue: 0,
    status: 'paid',
    paymentMethod: 'Credit Card',
    notes: 'Fitting verified with crotch depth and armhole comfort adjustments. Picked up on time.',
    createdAt: '2026-09-08T14:30:00Z'
  },
  {
    id: 'inv_2026_09_02',
    invoiceNumber: 'INV-2026-092',
    customerId: 'cust_2',
    customerName: 'Alexander Sterling',
    customerPhone: '+94 71 987 6543',
    customerAddress: '12 Kandy Road, Kiribathgoda',
    date: '2026-09-04',
    dueDate: '2026-09-18',
    items: [
      { id: 'i3', description: 'Royal Velvet Wedding Tuxedo Coat Rental (7 Days)', category: 'rental', quantity: 1, unitPrice: 7500, total: 7500 },
      { id: 'i4', description: 'Trouser Hemming & Waist Adjustments', category: 'alteration', quantity: 1, unitPrice: 1500, total: 1500 }
    ],
    subtotal: 9000,
    discount: 0,
    tax: 0,
    total: 9000,
    paidAmount: 5000,
    balanceDue: 4000,
    status: 'partial',
    paymentMethod: 'Cash',
    notes: 'Deposit received. Balance to be cleared upon coat return.',
    createdAt: '2026-09-04T10:15:00Z'
  },
  {
    id: 'inv_2026_08_01',
    invoiceNumber: 'INV-2026-081',
    customerId: 'cust_3',
    customerName: 'David H. Perera',
    customerPhone: '+94 76 345 6789',
    customerAddress: '88 Peradeniya Road, Kandy',
    date: '2026-08-22',
    dueDate: '2026-08-29',
    items: [
      { id: 'i5', description: 'Custom Bespoke Charcoal Trousers (Crotch Depth 11")', category: 'tailoring', quantity: 2, unitPrice: 8500, total: 17000 },
      { id: 'i6', description: 'Premium Linen Summer Shirt', category: 'tailoring', quantity: 1, unitPrice: 7000, total: 7000 }
    ],
    subtotal: 24000,
    discount: 1000,
    tax: 0,
    total: 23000,
    paidAmount: 23000,
    balanceDue: 0,
    status: 'paid',
    paymentMethod: 'Bank Transfer',
    notes: 'Repeat client. Measurements confirmed.',
    createdAt: '2026-08-22T11:00:00Z'
  },
  {
    id: 'inv_2026_08_02',
    invoiceNumber: 'INV-2026-082',
    customerId: 'cust_4',
    customerName: 'Ethan Reynolds',
    customerPhone: '+94 70 765 4321',
    customerAddress: '74 Dharmapala Mawatha, Colombo 07',
    date: '2026-08-14',
    dueDate: '2026-08-21',
    items: [
      { id: 'i7', description: 'Ivory Cream Wedding Coat Rental', category: 'rental', quantity: 1, unitPrice: 6500, total: 6500 },
      { id: 'i8', description: 'Late Return Overdue Fine (2 Days @ LKR 500/day)', category: 'fine', quantity: 1, unitPrice: 1000, total: 1000 }
    ],
    subtotal: 7500,
    discount: 0,
    tax: 0,
    total: 7500,
    paidAmount: 7500,
    balanceDue: 0,
    status: 'paid',
    paymentMethod: 'Card',
    notes: 'Late return fine settled upon return.',
    createdAt: '2026-08-14T16:20:00Z'
  },
  {
    id: 'inv_2026_07_01',
    invoiceNumber: 'INV-2026-071',
    customerId: 'cust_1',
    customerName: 'Marcus Vance',
    customerPhone: '+94 77 234 8901',
    customerAddress: '45 Galle Road, Kollupitiya, Colombo 03',
    date: '2026-07-19',
    dueDate: '2026-07-26',
    items: [
      { id: 'i9', description: 'Three-Piece Italian Wool Wedding Suit', category: 'tailoring', quantity: 1, unitPrice: 85000, total: 85000 },
      { id: 'i10', description: 'Handcrafted Silk Tie & Pocket Square', category: 'fabric', quantity: 2, unitPrice: 2500, total: 5000 }
    ],
    subtotal: 90000,
    discount: 5000,
    tax: 0,
    total: 85000,
    paidAmount: 85000,
    balanceDue: 0,
    status: 'paid',
    paymentMethod: 'Credit Card',
    notes: 'Groom wedding suit delivered in bespoke garment bag.',
    createdAt: '2026-07-19T09:45:00Z'
  },
  {
    id: 'inv_2026_06_01',
    invoiceNumber: 'INV-2026-061',
    customerId: 'cust_2',
    customerName: 'Alexander Sterling',
    customerPhone: '+94 71 987 6543',
    customerAddress: '12 Kandy Road, Kiribathgoda',
    date: '2026-06-11',
    dueDate: '2026-06-18',
    items: [
      { id: 'i11', description: 'Slim Fit Office Shirts Bundle (Pack of 3)', category: 'tailoring', quantity: 1, unitPrice: 18000, total: 18000 },
      { id: 'i12', description: 'Jacket Shoulder & Armhole Alteration', category: 'alteration', quantity: 1, unitPrice: 3500, total: 3500 }
    ],
    subtotal: 21500,
    discount: 0,
    tax: 0,
    total: 21500,
    paidAmount: 21500,
    balanceDue: 0,
    status: 'paid',
    paymentMethod: 'Card',
    notes: 'Summer corporate wardrobe refresh.',
    createdAt: '2026-06-11T13:00:00Z'
  }
];

// Helpers for Invoices
export async function dbGetInvoices(): Promise<Invoice[]> {
  try {
    const querySnapshot = await getDocs(query(collection(db, 'invoices'), orderBy('date', 'desc')));
    const list: Invoice[] = [];
    querySnapshot.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as Invoice);
    });
    if (list.length === 0) {
      // If Firestore has no invoices yet, check cache or use starter invoices
      const cached = localStorage.getItem('best1suit_invoices_cache');
      if (cached) {
        return JSON.parse(cached);
      }
      localStorage.setItem('best1suit_invoices_cache', JSON.stringify(sampleStarterInvoices));
      return sampleStarterInvoices;
    }
    localStorage.setItem('best1suit_invoices_cache', JSON.stringify(list));
    return list;
  } catch (error) {
    console.error('Firestore Error fetching invoices, trying cache:', error);
    const cached = localStorage.getItem('best1suit_invoices_cache');
    if (cached) {
      return JSON.parse(cached);
    }
    localStorage.setItem('best1suit_invoices_cache', JSON.stringify(sampleStarterInvoices));
    return sampleStarterInvoices;
  }
}

export async function dbSaveInvoice(invoice: Omit<Invoice, 'id' | 'createdAt'> & { id?: string }): Promise<Invoice> {
  const now = new Date().toISOString();
  try {
    const colRef = collection(db, 'invoices');
    let fullInvoice: Invoice;
    if (invoice.id) {
      const docRef = doc(db, 'invoices', invoice.id);
      fullInvoice = {
        ...invoice,
        id: invoice.id,
        createdAt: now
      };
      await setDoc(docRef, fullInvoice);
    } else {
      const docRef = await addDoc(colRef, {
        ...invoice,
        createdAt: now
      });
      fullInvoice = {
        ...invoice,
        id: docRef.id,
        createdAt: now
      };
    }

    const cached = localStorage.getItem('best1suit_invoices_cache');
    const list: Invoice[] = cached ? JSON.parse(cached) : [...sampleStarterInvoices];
    const idx = list.findIndex(i => i.id === fullInvoice.id);
    if (idx >= 0) {
      list[idx] = fullInvoice;
    } else {
      list.unshift(fullInvoice);
    }
    localStorage.setItem('best1suit_invoices_cache', JSON.stringify(list));
    return fullInvoice;
  } catch (error) {
    console.error('Firestore Error saving invoice:', error);
    const id = invoice.id || 'inv_' + Math.random().toString(36).substr(2, 9);
    const fullInvoice: Invoice = {
      ...invoice,
      id,
      createdAt: now
    };
    const cached = localStorage.getItem('best1suit_invoices_cache');
    const list: Invoice[] = cached ? JSON.parse(cached) : [...sampleStarterInvoices];
    const idx = list.findIndex(i => i.id === id);
    if (idx >= 0) {
      list[idx] = fullInvoice;
    } else {
      list.unshift(fullInvoice);
    }
    localStorage.setItem('best1suit_invoices_cache', JSON.stringify(list));
    return fullInvoice;
  }
}

export async function dbDeleteInvoice(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'invoices', id));
  } catch (error) {
    console.error('Firestore Error deleting invoice:', error);
  }
  const cached = localStorage.getItem('best1suit_invoices_cache');
  if (cached) {
    const list: Invoice[] = JSON.parse(cached);
    const filtered = list.filter(i => i.id !== id);
    localStorage.setItem('best1suit_invoices_cache', JSON.stringify(filtered));
  }
}

