import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ScreeningResult } from "@/lib/types";

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Score helpers
export function scoreColor(score: number): string {
  if (score >= 80) return "text-[var(--green)]";
  if (score >= 65) return "text-[var(--amber)]";
  return "text-[var(--red)]";
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-[var(--green-dim)] text-[var(--green)]";
  if (score >= 65) return "bg-[var(--amber-dim)] text-[var(--amber)]";
  return "bg-[var(--red-dim)] text-[var(--red)]";
}

export function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-[var(--green)]";
  if (score >= 65) return "bg-[var(--amber)]";
  return "bg-[var(--red)]";
}

export function recBadgeStyle(rec: string) {
  const r = rec.toLowerCase();
  if (r.includes("strong")) return "bg-[var(--green-dim)] text-[var(--green)] border-[var(--green)]/20";
  if (r.includes("hire")) return "bg-[var(--green-dim)] text-[var(--green)] border-[var(--green)]/20";
  if (r.includes("maybe")) return "bg-[var(--amber-dim)] text-[var(--amber)] border-[var(--amber)]/20";
  return "bg-[var(--red-dim)] text-[var(--red)] border-[var(--red)]/20";
}

// Initials from name
export function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Average score from results
export function calcAverageScore(results: ScreeningResult[]): number {
  if (!results.length) return 0;
  return Math.round(
    results.reduce((sum, r) => sum + r.matchScore, 0) / results.length
  );
}

// Format date
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function timeAgo(date: string | number | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return `${days} days ago`;
}

