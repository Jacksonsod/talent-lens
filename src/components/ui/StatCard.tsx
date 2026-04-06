"use client";

import { cn, scoreColor } from "@/lib/utils/helpers";
import Link from "next/link";

// ─── StatCard ─────────────────────────────────
interface StatCardProps {
  label: string;
  value: number | string;
  color?: "green" | "amber" | "blue" | "red" | "default";
  sub?: string;
}

const colorMap = {
  green: "#00e5a0",
  amber: "#ffb547",
  blue: "#6b8aff",
  red: "#ff6b6b",
  default: "#f0f0f5",
};

export function StatCard({ label, value, color = "default", sub }: StatCardProps) {
  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div
        className="text-[11px] font-semibold tracking-widest uppercase mb-2"
        style={{ color: "#5a5a72" }}
      >
        {label}
      </div>
      <div
        className="font-display font-bold text-3xl tracking-tight"
        style={{ color: colorMap[color] }}
      >
        {value}
      </div>
      {sub && (
        <div className="text-[11px] mt-1" style={{ color: "#5a5a72" }}>
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
    score >= 80 ? "#00e5a0" : score >= 65 ? "#ffb547" : "#ff6b6b";
  const bg =
    score >= 80
      ? "rgba(0,229,160,0.1)"
      : score >= 65
      ? "rgba(255,181,71,0.12)"
      : "rgba(255,107,107,0.1)";
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
    value >= 80 ? "#00e5a0" : value >= 65 ? "#ffb547" : "#ff6b6b";
  return (
    <div
      className={cn("h-1 rounded-full overflow-hidden", className)}
      style={{ background: "var(--surface3)" }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${value}%`, background: barColor }}
      />
    </div>
  );
}

