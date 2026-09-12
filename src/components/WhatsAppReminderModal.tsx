import React, { useState, useEffect } from 'react';
import { CoatRental } from '../types';
import { generateRentalReminderText, openWhatsAppChat, getStoredWhatsAppConfig } from '../utils/whatsappHelper';
import { MessageSquare, AlertTriangle, Clock, Copy, Check, ExternalLink, Calendar, X } from 'lucide-react';
import { motion } from 'motion/react';
import { formatLKR } from '../utils/currencyUtils';

interface WhatsAppReminderModalProps {
  rental: CoatRental | null;
  isOpen: boolean;
  onClose: () => void;
  onRecordNotification?: (rentalId: string, timestamp: string) => Promise<void>;
}

export default function WhatsAppReminderModal({ rental, isOpen, onClose, onRecordNotification }: WhatsAppReminderModalProps) {
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (rental) {
      const config = getStoredWhatsAppConfig();
      const generated = generateRentalReminderText(rental, config);
      setMessage(generated);
    }
  }, [rental]);

  if (!isOpen || !rental) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const due = new Date(rental.dueDate);
  const current = new Date(todayStr);
  const diffTime = current.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays > 0;
  const isDueToday = diffDays === 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchWhatsApp = async () => {
    setIsSending(true);
    const config = getStoredWhatsAppConfig();
    openWhatsAppChat(rental.customerPhone, message, config.countryCode);
    
    if (onRecordNotification) {
      const nowFormatted = new Date().toLocaleString();
      await onRecordNotification(rental.id, nowFormatted);
    }
    
    setTimeout(() => {
      setIsSending(false);
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="whatsapp-reminder-modal">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className={`p-6 text-white flex items-center justify-between ${
          isOverdue ? 'bg-red-900' : 'bg-emerald-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-serif font-semibold">WhatsApp Return Reminder</h3>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isOverdue ? 'bg-red-500/30 text-red-200 border border-red-400/40' : 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                }`}>
                  {isOverdue ? `${diffDays} Days Overdue` : isDueToday ? 'Due Today' : 'Due Soon'}
                </span>
              </div>
              <p className="text-xs text-white/80 mt-0.5">
                Send return notice to {rental.customerName} via synchronized WhatsApp.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rental Quick Context Bar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Garment:</span>
            <span className="font-semibold text-slate-800">{rental.coatDescription}</span>
            <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-mono">
              {rental.coatId}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due: {rental.dueDate}
            </span>
            {isOverdue && (
              <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                Fine: {formatLKR(diffDays * 500)}
              </span>
            )}
          </div>
        </div>

        {/* Message Editor / Preview */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                Message Preview (Editable)
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-xs font-mono text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied' : 'Copy Text'}
              </button>
            </div>

            <textarea
              rows={9}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white text-xs p-3.5 rounded-xl font-mono focus:outline-none transition-all leading-relaxed text-slate-800 shadow-inner"
            />
          </div>

          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <span className="font-semibold font-mono">Recipient Phone:</span>
              <span className="font-mono bg-emerald-100/60 text-emerald-800 px-2 py-0.5 rounded font-bold">
                {rental.customerPhone || 'No Phone Specified'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-mono">WhatsApp Web/App</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-white text-slate-600 text-xs font-semibold font-mono transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleLaunchWhatsApp}
            disabled={isSending || !rental.customerPhone}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs font-mono px-5 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Open WhatsApp & Send Reminder</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
