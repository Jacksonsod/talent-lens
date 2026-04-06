import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Recommendation, ScreeningResult } from "@/lib/types";

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Score helpers
export function scoreColor(score: number): string {
  if (score >= 80) return "text-brand-green";
  if (score >= 65) return "text-brand-amber";
  return "text-brand-red";
}

export function scoreBgColor(score: number): string {
  if (score >= 80) return "bg-brand-green-dim text-brand-green";
  if (score >= 65) return "bg-brand-amber-dim text-brand-amber";
  return "bg-brand-red-dim text-brand-red";
}

export function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-brand-green";
  if (score >= 65) return "bg-brand-amber";
  return "bg-brand-red";
}

export function recBadgeStyle(rec: Recommendation) {
  switch (rec) {
    case "Strongly recommend":
    case "Recommend":
      return "bg-brand-green-dim text-brand-green border border-brand-green/20";
    case "Consider":
      return "bg-brand-amber-dim text-brand-amber border border-brand-amber/20";
    case "Low match":
      return "bg-brand-red-dim text-brand-red border border-brand-red/20";
  }
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
    results.reduce((sum, r) => sum + r.totalScore, 0) / results.length
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
