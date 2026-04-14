"use client";

import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
      {/* ── Backdrop ── */}
      <div 
        className="fixed inset-0 bg-brand-cobalt/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* ── Modal Card ── */}
      <div 
        className="relative w-full max-w-[420px] bg-bg-surface rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Top Accent Stripe */}
        <div className={`h-1.5 w-full ${danger ? 'bg-brand-red' : 'bg-brand-blue'}`} />

        <div className="p-6 sm:p-8">
          
          {/* Header Row: Icon and Close Button */}
          <div className="flex justify-between items-start mb-5">
            {/* Icon Bubble */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${danger ? 'bg-brand-red-dim border border-brand-red/20 text-brand-red' : 'bg-brand-blue-dim border border-brand-blue/20 text-brand-blue'}`}>
              {danger ? <Trash2 size={26} strokeWidth={1.8} /> : <AlertTriangle size={26} strokeWidth={1.8} />}
            </div>

            {/* Close Button */}
            <button 
              onClick={onCancel}
              disabled={loading}
              className="text-text-muted hover:text-text hover:bg-bg-surface2 p-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close dialog"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>

          {/* Text Content */}
          <h2 className="font-display font-bold text-2xl text-text mb-3 tracking-tight">
            {title}
          </h2>
          <p className="text-text-light text-[15px] leading-relaxed mb-8">
            {description}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 px-4 rounded-xl font-sans font-semibold text-[15px] text-text-light bg-bg-surface border border-bg-surface3 hover:bg-bg-surface2 hover:text-text transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`flex-1 flex justify-center items-center gap-2 py-3 px-4 rounded-xl font-sans font-semibold text-[15px] text-white shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed ${
                danger 
                  ? 'bg-brand-red hover:bg-red-600 shadow-brand-red/30' 
                  : 'bg-brand-blue hover:bg-brand-accent-hover shadow-brand-blue/30'
              } hover:-translate-y-0.5 hover:shadow-xl`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                confirmLabel
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
