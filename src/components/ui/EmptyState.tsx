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
      className="flex flex-col items-center justify-center py-16 text-center rounded-xl border"
      style={{
        background: "var(--surface)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <div className="text-4xl mb-4">🔍</div>
      <div
        className="font-display font-bold text-base mb-2"
        style={{ color: "#f0f0f5" }}
      >
        {title}
      </div>
      <div className="text-sm max-w-xs mb-6" style={{ color: "#9090a8" }}>
        {description}
      </div>
      {action && (
        <Link
          href={action.href}
          className="px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={{ background: "#7c6fff", color: "#fff" }}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export default EmptyState;
