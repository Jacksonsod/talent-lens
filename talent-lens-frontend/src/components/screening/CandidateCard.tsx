"use client";

import { useState } from "react";
import { Applicant, ScreeningResult } from "@/lib/types";
import { cn } from "@/lib/utils/helpers";
import { ChevronDown, AlertTriangle } from "lucide-react";

const AVATAR_PALETTES = [
  { bg: "#dcfce7", text: "#065f46" },
  { bg: "#dbeafe", text: "#1e40af" },
  { bg: "#ede9fe", text: "#4c1d95" },
  { bg: "#fef3c7", text: "#92400e" },
  { bg: "#fce7f3", text: "#831843" },
  { bg: "#f1f5f9", text: "#475569" },
  { bg: "#fde8d8", text: "#9a3412" },
  { bg: "#ecfeff", text: "#155e75" },
];

function rankColor(rank: number) {
  if (rank === 1) return "text-yellow-600";
  if (rank === 2) return "text-slate-400";
  if (rank === 3) return "text-amber-700";
  return "text-[var(--text3)]";
}

function scoreColor(s: number) {
  if (s >= 70) return "text-emerald-600";
  if (s >= 50) return "text-amber-600";
  return "text-red-600";
}

function scoreBg(s: number) {
  if (s >= 70) return "bg-emerald-500";
  if (s >= 50) return "bg-amber-500";
  return "bg-red-500";
}

function recClass(rec: string) {
  const lower = rec.toLowerCase();
  if (lower.includes("strongly")) return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  if (lower.includes("recommend")) return "bg-blue-50 text-blue-700 border border-blue-200";
  if (lower.includes("consider")) return "bg-amber-50 text-amber-700 border border-amber-200";
  if (lower.includes("incomplete")) return "bg-orange-50 text-orange-700 border border-orange-200";
  return "bg-gray-100 text-gray-500 border border-gray-200";
}

interface CandidateCardProps {
  result: ScreeningResult;
  rank: number;
  defaultOpen?: boolean;
  isIncomplete?: boolean;
}

export default function CandidateCard({ result, rank, defaultOpen = false, isIncomplete = false }: CandidateCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  const app = result.applicantId as Applicant;
  const { matchScore, scoreBreakdown, strengths, gaps, reasoning, finalRecommendation } = result;

  const palette = AVATAR_PALETTES[(rank - 1) % AVATAR_PALETTES.length];
  const fullName = `${app.firstName} ${app.lastName}`;
  const initials = `${app.firstName.charAt(0)}${app.lastName.charAt(0)}`;

  // Derive skill tags from the applicant
  const skills = (app.skills || []).slice(0, 4).map((s: any) => {
    const name = typeof s === "string" ? s : s?.name;
    return { label: name, type: "match" as const };
  });

  const metricItems = [
    { label: "Skills", value: scoreBreakdown.skills },
    { label: "Experience", value: scoreBreakdown.experience },
    { label: "Education", value: scoreBreakdown.education },
    { label: "Relevance", value: scoreBreakdown.relevance },
  ];

  const cardBorder = open
    ? "border-blue-300 shadow-[0_0_0_3px_rgba(37,99,235,0.06)]"
    : isIncomplete
    ? "border-orange-200 bg-gradient-to-r from-white to-orange-50/30"
    : "border-[var(--border)] hover:border-[var(--border2)] hover:shadow-sm";

  return (
    <div className={cn("bg-[var(--surface)] border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer", cardBorder)}>

      {/* CARD TOP ROW */}
      <div className="flex items-center gap-3.5 px-5 py-4" onClick={() => setOpen(!open)}>

        {/* Rank */}
        <div className={cn("font-display font-extrabold text-[14px] min-w-[24px] shrink-0", rankColor(rank))}>
          #{rank}
        </div>

        {/* Avatar */}
        <div className="relative shrink-0">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center font-display font-bold text-[13px]"
            style={{ background: palette.bg, color: palette.text }}
          >
            {initials}
          </div>
          {isIncomplete && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center text-white text-[8px] font-bold">!</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[14px] text-[var(--text)]">{fullName}</span>
            {isIncomplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
                <AlertTriangle size={9} /> Incomplete
              </span>
            )}
          </div>
          <div className="text-[12px] text-[var(--text3)] mt-0.5">
            {app.currentRole || "Candidate"} · {app.yearsOfExperience || 0}yr exp · {app.educationLevel || "—"}
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {skills.map((sk, idx) => (
                <span key={idx} className="text-[10.5px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{sk.label}</span>
              ))}
            </div>
          )}
        </div>

        {/* Score */}
        <div className="text-right shrink-0 flex items-center gap-2.5">
          <div>
            <div className={cn("font-display font-extrabold text-[24px] tracking-tight leading-none", scoreColor(matchScore))}>{matchScore}</div>
            <div className="w-[72px] h-1 bg-[var(--surface3)] rounded-full overflow-hidden mt-1.5 ml-auto">
              <div className={cn("h-full rounded-full transition-all duration-700", scoreBg(matchScore))} style={{ width: `${matchScore}%` }} />
            </div>
            <div className="text-[10px] text-[var(--text3)] mt-1 text-right">/ 100</div>
          </div>
          <ChevronDown size={16} className={cn("text-[var(--text3)] transition-transform duration-200 shrink-0", open && "rotate-180")} />
        </div>
      </div>

      {/* INCOMPLETE WARNING STRIP */}
      {isIncomplete && (
        <div className="mx-5 mb-3 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-[9px] px-3.5 py-2.5 text-[12px] text-orange-700">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <div>
            <strong>Incomplete profile detected</strong> — AI score may not reflect true ability.
            Missing:{" "}
            {[
              !app.yearsOfExperience && "No years of experience provided",
              !app.currentRole && "Current role field is empty",
              (!app.educationLevel || app.educationLevel === "Other") && "Education listed as &apos;Other&apos; with no institution",
            ].filter(Boolean).join(" · ")}
            <span className="text-blue-600 font-semibold cursor-pointer ml-1.5 hover:underline">Review CV directly →</span>
          </div>
        </div>
      )}

      {/* EXPANDED BODY */}
      {open && (
        <div className="px-5 pb-5 pt-1 border-t border-[var(--border)] animate-fade-up">

          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-4">
            {metricItems.map((m) => (
              <div key={m.label} className="bg-[var(--surface2)] rounded-[10px] px-3.5 py-3">
                <div className="text-[9.5px] font-bold text-[var(--text3)] uppercase tracking-wider mb-2">{m.label}</div>
                <div className="h-1 bg-[var(--surface3)] rounded-full overflow-hidden mb-1.5">
                  <div className={cn("h-full rounded-full", scoreBg(m.value))} style={{ width: `${m.value}%` }} />
                </div>
                <div className={cn("font-display font-bold text-[17px]", scoreColor(m.value))}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* AI Reasoning */}
          <div className="mb-3.5">
            <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-2">AI Reasoning</div>
            <div className="text-[13px] text-[var(--text2)] leading-[1.65] bg-[var(--surface2)] rounded-[10px] px-3.5 py-3 border-l-[3px] border-blue-200">
              {reasoning}
            </div>
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-[10px] px-3.5 py-3">
              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Strengths</div>
              <div className="space-y-1.5">
                {(typeof strengths === "string" ? strengths.split(".").filter(Boolean) : [strengths]).map((s, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12.5px] text-[var(--text2)] leading-snug">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    <span>{String(s).trim()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-[10px] px-3.5 py-3">
              <div className="text-[10px] font-bold text-red-600 uppercase tracking-wider mb-2">Gaps / Risks</div>
              <div className="space-y-1.5">
                {(typeof gaps === "string" ? gaps.split(".").filter(Boolean) : [gaps]).map((g, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[12.5px] text-[var(--text2)] leading-snug">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                    <span>{String(g).trim()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className={cn("text-[12px] font-semibold px-3.5 py-1.5 rounded-full", recClass(finalRecommendation))}>
              {finalRecommendation}
            </span>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Generated by Gemini 1.5 Pro
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
