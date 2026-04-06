"use client";

import React from "react";
import Link from "next/link";

// ─── EmptyState ───────────────────────────────
interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 text-center rounded-xl border animate-fade-up"
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="text-4xl mb-4">🔍</div>
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
