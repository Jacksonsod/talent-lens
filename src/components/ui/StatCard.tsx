"use client";

import { cn } from "@/lib/utils/helpers";
import Link from "next/link";

// ─── StatCard ─────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  color?: "green" | "amber" | "blue" | "red" | "default";
  sub?: string;
  highlight?: boolean;
}

const colorMap = {
  green: "var(--green)",
  amber: "var(--amber)",
  blue: "var(--blue)",
  red: "var(--red)",
  default: "var(--text)",
};

export function StatCard({ label, value, color = "default", sub, highlight }: StatCardProps) {
  return (
    <div
      className={cn("rounded-xl px-5 py-4 transition-all duration-300", highlight && "shadow-sm")}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        ...(highlight && { borderLeft: `4px solid ${colorMap[color]}` })
      }}
    >
      <div
        className="text-[11px] font-semibold tracking-widest uppercase mb-2"
        style={{ color: "var(--text3)" }}
      >
        {label}
      </div>
      <div
        className={cn("font-display font-bold tracking-tight", highlight ? "text-4xl" : "text-3xl")}
        style={{ color: colorMap[color] }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: "var(--text3)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default StatCard;

// ─── ScoreBadge ───────────────────────────────
export function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "var(--green)" : score >= 65 ? "var(--amber)" : "var(--red)";
  const bg =
    score >= 80
      ? "var(--green-dim)"
      : score >= 65
      ? "var(--amber-dim)"
      : "var(--red-dim)";
  return (
    <span
      className="inline-flex items-center font-display font-bold text-lg px-3 py-1 rounded-lg"
      style={{ background: bg, color }}
    >
      {score}
    </span>
  );
}

// ─── ScoreBar ─────────────────────────────────
export function ScoreBar({ value, className }: { value: number; className?: string }) {
  const barColor =
    value >= 80 ? "var(--green)" : value >= 65 ? "var(--amber)" : "var(--red)";
  return (
    <div
      className={cn("h-1.5 rounded-full overflow-hidden", className)}
      style={{ background: "var(--surface3)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: barColor }}
      />
    </div>
  );
}
