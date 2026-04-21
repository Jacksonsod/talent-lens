"use client";

import React from "react";
import Link from "next/link";
import { ScanSearch } from "lucide-react";

// ─── EmptyState ───────────────────────────────
interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
  compact?: boolean;
}

export function EmptyState({ title, description, action, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="text-[13px] font-bold mb-1" style={{ color: "var(--text)" }}>{title}</div>
        <div className="text-[11px] text-gray-400 italic mb-3">{description}</div>
        {action && (
          <Link href={action.href} className="text-[11px] font-bold text-[#2563EB] hover:underline">
            {action.label}
          </Link>
        )}
      </div>
    );
  }
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center rounded-xl border animate-fade-up"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="flex justify-center mb-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "#EFF6FF", border: "1.5px solid #BFDBFE" }}
        >
          <ScanSearch size={30} color="#2563EB" strokeWidth={1.6} />
        </div>
      </div>
      <div
        className="font-display font-bold text-base mb-2"
        style={{ color: "var(--text)" }}
      >
        {title}
      </div>
      <div className="text-sm max-w-xs mb-6" style={{ color: "var(--text2)" }}>
        {description}
      </div>
      {action && (
        <Link
          href={action.href}
          className="btn btn-primary"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default EmptyState;
