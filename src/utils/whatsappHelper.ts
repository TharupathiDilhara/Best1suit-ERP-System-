import { CoatRental, Invoice, Customer, WhatsAppSyncConfig } from '../types';
import { formatLKR } from './currencyUtils';

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppSyncConfig = {
  businessPhone: '+94 11 258 7890',
  countryCode: '+94',
  syncStatus: 'synced',
  reminderTemplate: 
`Dear {customerName},

Greetings from Best 1 Suit Bespoke Tailors, Sri Lanka.

This is a courtesy reminder regarding your rented garment:
🧥 *Garment*: {coatDescription} (ID: {coatId})
📅 *Scheduled Return Date*: {dueDate}
⚠️ *Return Status*: {statusText}
{fineSection}

Please return the garment to our shop at your earliest convenience to avoid further daily late penalty charges. If you require a rental extension, please contact our front desk at {businessPhone}.

Thank you for choosing Best 1 Suit!
📍 Best 1 Suit Tailoring & Coat Hire, Sri Lanka
📞 {businessPhone}`,
  invoiceTemplate:
`Dear {customerName},

Thank you for choosing Best 1 Suit Bespoke Tailoring.

Here is the invoice summary for your order:
🧾 *Invoice Number*: {invoiceNumber}
📅 *Date*: {date}

*Order Summary*:
{itemsList}

💰 *Subtotal*: {subtotal}
🏷️ *Discount*: -{discount}
💵 *Total Amount*: {total}
✅ *Amount Paid*: {paidAmount}
⏳ *Balance Due*: {balanceDue}
📌 *Payment Status*: {status}

{notes}

A copy of your official bill has been generated. Please let us know if you have any questions!

Best regards,
Best 1 Suit Bespoke Tailoring
📞 {businessPhone}`
};

export function getStoredWhatsAppConfig(): WhatsAppSyncConfig {
  try {
    const saved = localStorage.getItem('best1suit_whatsapp_config');
    if (saved) {
      return { ...DEFAULT_WHATSAPP_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error reading whatsapp config:', e);
  }
  return DEFAULT_WHATSAPP_CONFIG;
}

export function saveWhatsAppConfig(config: WhatsAppSyncConfig): void {
  try {
    localStorage.setItem('best1suit_whatsapp_config', JSON.stringify(config));
  } catch (e) {
    console.error('Error saving whatsapp config:', e);
  }
}

export function cleanPhoneNumber(phone: string, defaultCountryCode: string = '+94'): string {
  if (!phone) return '';
  // Remove spaces, parentheses, dashes, dots
  let cleaned = phone.replace(/[\s\(\)\-\.]/g, '');
  // If no leading '+', prepend country code
  if (!cleaned.startsWith('+')) {
    const code = defaultCountryCode.replace('+', '');
    // If it starts with 0 (standard Sri Lankan phone format, e.g. 0771234567)
    if (cleaned.startsWith('0')) {
      cleaned = code + cleaned.substring(1);
    } else {
      cleaned = code + cleaned;
    }
  } else {
    cleaned = cleaned.replace('+', '');
  }
  return cleaned;
}

export function generateRentalReminderText(
  rental: CoatRental, 
  config: WhatsAppSyncConfig = getStoredWhatsAppConfig()
): string {
  const today = new Date().toISOString().split('T')[0];
  const due = new Date(rental.dueDate);
  const current = new Date(today);
  const diffTime = current.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusText = 'Due Today';
  let fineSection = '';

  if (diffDays > 0) {
    statusText = `*${diffDays} Days Expired / Overdue*`;
    const estimatedFine = rental.fineAmount > 0 ? rental.fineAmount : diffDays * 500;
    fineSection = `💰 *Overdue Penalty Accrued*: ${formatLKR(estimatedFine)} (LKR 500/day late fine)`;
  } else if (diffDays === 0) {
    statusText = `*Due Today (${rental.dueDate})*`;
    fineSection = `ℹ️ Please return today during shop hours (10:00 AM - 7:00 PM).`;
  } else {
    statusText = `Due in ${Math.abs(diffDays)} days (${rental.dueDate})`;
    fineSection = `ℹ️ Friendly reminder to help you prepare your return schedule.`;
  }

  let text = config.reminderTemplate
    .replace(/{customerName}/g, rental.customerName)
    .replace(/{coatDescription}/g, rental.coatDescription)
    .replace(/{coatId}/g, rental.coatId || 'N/A')
    .replace(/{dueDate}/g, rental.dueDate)
    .replace(/{statusText}/g, statusText)
    .replace(/{fineSection}/g, fineSection)
    .replace(/{businessPhone}/g, config.businessPhone);

  return text;
}

export function generateInvoiceWhatsAppText(
  invoice: Invoice, 
  config: WhatsAppSyncConfig = getStoredWhatsAppConfig()
): string {
  const itemsList = invoice.items.map(it => `• ${it.quantity}x ${it.description} — ${formatLKR(it.total)}`).join('\n');
  const statusFormatted = invoice.status === 'paid' ? 'PAID IN FULL' : invoice.status === 'partial' ? 'PARTIAL DEPOSIT' : 'UNPAID';
  const notesText = invoice.notes ? `📝 *Notes*: ${invoice.notes}` : '';

  let text = config.invoiceTemplate
    .replace(/{customerName}/g, invoice.customerName)
    .replace(/{invoiceNumber}/g, invoice.invoiceNumber)
    .replace(/{date}/g, invoice.date)
    .replace(/{itemsList}/g, itemsList)
    .replace(/{subtotal}/g, formatLKR(invoice.subtotal))
    .replace(/{discount}/g, formatLKR(invoice.discount))
    .replace(/{total}/g, formatLKR(invoice.total))
    .replace(/{paidAmount}/g, formatLKR(invoice.paidAmount))
    .replace(/{balanceDue}/g, formatLKR(invoice.balanceDue))
    .replace(/{status}/g, statusFormatted)
    .replace(/{notes}/g, notesText)
    .replace(/{businessPhone}/g, config.businessPhone);

  return text;
}

export function openWhatsAppChat(phone: string, message: string, defaultCountryCode: string = '+94'): void {
  const cleaned = cleanPhoneNumber(phone, defaultCountryCode);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
