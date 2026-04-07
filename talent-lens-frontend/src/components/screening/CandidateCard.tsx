"use client";

import { useState } from "react";
import { ScreeningResult } from "@/lib/types";
import { getInitials, recBadgeStyle, cn } from "@/lib/utils/helpers";
import { ScoreBadge, ScoreBar } from "@/components/ui/StatCard";
import { ChevronDown } from "lucide-react";

const AVATAR_COLORS = [
  { bg: "rgba(0,229,160,0.12)", text: "#00e5a0" },
  { bg: "rgba(107,138,255,0.12)", text: "#6b8aff" },
  { bg: "rgba(124,111,255,0.15)", text: "#7c6fff" },
  { bg: "rgba(255,181,71,0.12)", text: "#ffb547" },
  { bg: "rgba(255,107,107,0.1)", text: "#ff6b6b" },
];

const rankColorClass = (rank: number) => {
  if (rank === 1) return "text-[var(--amber)] gold";
  if (rank === 2) return "text-[#a0aec0] silver";
  if (rank === 3) return "text-[#cd7f32] bronze";
  return "text-[var(--text3)]";
};

interface CandidateCardProps {
  result: ScreeningResult;
  defaultOpen?: boolean;
}

export default function CandidateCard({
  result,
  defaultOpen = false,
}: CandidateCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { applicant, rank, totalScore, scoreBreakdown, skillTags, strengths, gaps, recommendation } = result;
  
  const avatarColor = AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length];

  const metricItems = [
    { label: "Skills", value: scoreBreakdown.skills },
    { label: "Experience", value: scoreBreakdown.experience },
    { label: "Education", value: scoreBreakdown.education },
    { label: "Relevance", value: scoreBreakdown.relevance },
  ];

  return (
    <div
      className={cn(
        "ccard rounded-xl overflow-hidden transition-all duration-200 border",
        open ? "border-[var(--accent)]" : "border-[var(--border)]"
      )}
      style={{ background: "var(--surface)" }}
    >
      {/* Card Top */}
      <div
        className="flex items-center gap-3.5 px-5 py-3.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {/* Rank */}
        <div
          className={cn("font-display font-bold text-[13px] min-w-[24px]", rankColorClass(rank))}
        >
          #{rank}
        </div>

        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-semibold shrink-0"
          style={{ background: avatarColor.bg, color: avatarColor.text }}
        >
          {getInitials(applicant.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[14px]" style={{ color: "var(--text)" }}>
            {applicant.name}
          </div>
          <div className="text-[12px] truncate" style={{ color: "var(--text3)" }}>
            {applicant.currentRole} · {applicant.yearsOfExperience}yr exp
          </div>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {skillTags.map((tag, i) => (
              <span
                key={i}
                className={cn(
                  "ctag text-[10px] px-2 py-0.5 rounded-full font-medium border",
                  tag.type === "match" ? "bg-[rgba(0,229,160,0.1)] text-[var(--green)] border-[rgba(0,229,160,0.2)]" :
                  tag.type === "gap" ? "bg-[rgba(255,107,107,0.08)] text-[var(--red)] border-[rgba(255,107,107,0.2)]" :
                  "bg-[var(--surface3)] text-[var(--text2)] border-[var(--border)]"
                )}
              >
                {tag.skill}
              </span>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <div
            className={cn(
              "font-display font-extrabold text-[22px] tracking-tight",
              totalScore >= 80 ? "text-[var(--green)]" : totalScore >= 65 ? "text-[var(--amber)]" : "text-[var(--red)]"
            )}
          >
            {totalScore}
          </div>
          <ScoreBar value={totalScore} className="w-[72px] mt-1.5" />
        </div>

        <ChevronDown
          size={16}
          className={cn("transition-transform duration-200 ml-2 text-[var(--text3)]", open && "rotate-180")}
        />
      </div>

      {/* Expandable Reasoning */}
      {open && (
        <div
          className="reasoning px-5 pb-5 pt-1 border-t border-[var(--border)] animate-fade-up"
        >
          {/* Score breakdown bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4 pt-4">
            {metricItems.map((m) => (
              <div
                key={m.label}
                className="rounded-lg px-3 py-2.5 bg-[var(--surface2)]"
              >
                <div className="text-[10px] font-semibold tracking-widest uppercase mb-1.5 text-[var(--text3)]">
                  {m.label}
                </div>
                <ScoreBar value={m.value} className="mb-1.5" />
                <div
                  className={cn(
                    "font-display font-bold text-base",
                    m.value >= 80 ? "text-[var(--green)]" : m.value >= 65 ? "text-[var(--amber)]" : "text-[var(--red)]"
                  )}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-3.5 bg-[rgba(0,229,160,0.06)] border border-[rgba(0,229,160,0.15)]">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 text-[var(--green)]">
                Strengths
              </div>
              <p className="text-[12.5px] leading-relaxed text-[var(--text2)]">
                {strengths}
              </p>
            </div>
            <div className="rounded-lg p-3.5 bg-[rgba(255,107,107,0.06)] border border-[rgba(255,107,107,0.15)]">
              <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 text-[var(--red)]">
                Gaps / Risks
              </div>
              <p className="text-[12.5px] leading-relaxed text-[var(--text2)]">
                {gaps}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span
              className={cn(
                "rec-badge text-[12px] px-3.5 py-1.5 rounded-full font-medium border transition-all",
                recommendation.toLowerCase().includes("strongly") ? "bg-[rgba(0,229,160,0.12)] text-[var(--green)] border-[rgba(0,229,160,0.25)]" :
                recommendation.toLowerCase().includes("consider") ? "bg-[var(--amber-dim)] text-[var(--amber)] border-[rgba(255,181,71,0.25)]" :
                "bg-[var(--red-dim)] text-[var(--red)] border-[rgba(255,107,107,0.2)]"
              )}
            >
              {recommendation}
            </span>
            <div className="ai-tag flex items-center gap-2 text-[11px] text-[var(--text3)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse-ai" />
              Generated by Gemini AI
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
