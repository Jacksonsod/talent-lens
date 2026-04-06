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

const rankColor = (rank: number) => {
  if (rank === 1) return "#ffb547";
  if (rank === 2) return "#a0aec0";
  if (rank === 3) return "#cd7f32";
  return "#5a5a72";
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
      className="rounded-xl overflow-hidden transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: open
          ? "1px solid #7c6fff"
          : "1px solid var(--border)",
      }}
    >
      {/* Card Top */}
      <div
        className="flex items-center gap-3.5 px-5 py-3.5 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {/* Rank */}
        <div
          className="font-display font-bold text-[13px] min-w-[22px]"
          style={{ color: rankColor(rank) }}
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
          <div className="font-medium text-[14px]" style={{ color: "#f0f0f5" }}>
            {applicant.name}
          </div>
          <div className="text-[12px] truncate" style={{ color: "#5a5a72" }}>
            {applicant.currentRole} · {applicant.yearsOfExperience}yr exp
          </div>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {skillTags.map((tag, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={
                  tag.type === "match"
                    ? { background: "rgba(0,229,160,0.1)", color: "#00e5a0", border: "1px solid rgba(0,229,160,0.2)" }
                    : tag.type === "gap"
                    ? { background: "rgba(255,107,107,0.08)", color: "#ff6b6b", border: "1px solid rgba(255,107,107,0.2)" }
                    : { background: "var(--surface3)", color: "#9090a8", border: "1px solid var(--border)" }
                }
              >
                {tag.skill}
              </span>
            ))}
          </div>
        </div>

        {/* Score */}
        <div className="text-right shrink-0">
          <div
            className="font-display font-extrabold text-[22px] tracking-tight"
            style={{
              color:
                totalScore >= 80
                  ? "#00e5a0"
                  : totalScore >= 65
                  ? "#ffb547"
                  : "#ff6b6b",
            }}
          >
            {totalScore}
          </div>
          <ScoreBar value={totalScore} className="w-[72px] mt-1.5" />
        </div>

        <ChevronDown
          size={16}
          style={{
            color: "#5a5a72",
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </div>

      {/* Expandable Reasoning */}
      {open && (
        <div
          className="px-5 pb-5 pt-1"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {/* Score breakdown bars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-4 pt-3">
            {metricItems.map((m) => (
              <div
                key={m.label}
                className="rounded-lg px-3 py-2.5"
                style={{ background: "var(--surface2)" }}
              >
                <div
                  className="text-[10px] font-semibold tracking-widest uppercase mb-1.5"
                  style={{ color: "#5a5a72" }}
                >
                  {m.label}
                </div>
                <ScoreBar value={m.value} className="mb-1.5" />
                <div
                  className="font-display font-bold text-base"
                  style={{
                    color:
                      m.value >= 80
                        ? "#00e5a0"
                        : m.value >= 65
                        ? "#ffb547"
                        : "#ff6b6b",
                  }}
                >
                  {m.value}
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div
              className="rounded-lg p-3.5"
              style={{
                background: "rgba(0,229,160,0.05)",
                border: "1px solid rgba(0,229,160,0.15)",
              }}
            >
              <div
                className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
                style={{ color: "#00e5a0" }}
              >
                Strengths
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "#9090a8" }}>
                {strengths}
              </p>
            </div>
            <div
              className="rounded-lg p-3.5"
              style={{
                background: "rgba(255,107,107,0.05)",
                border: "1px solid rgba(255,107,107,0.15)",
              }}
            >
              <div
                className="text-[10px] font-bold tracking-widest uppercase mb-1.5"
                style={{ color: "#ff6b6b" }}
              >
                Gaps / Risks
              </div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "#9090a8" }}>
                {gaps}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span
              className={cn("text-[12px] px-3.5 py-1.5 rounded-full font-medium", recBadgeStyle(recommendation))}
            >
              {recommendation}
            </span>
            <div className="flex items-center gap-2 text-[11px]" style={{ color: "#5a5a72" }}>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: "#00e5a0",
                  animation: "pulse 2s infinite",
                  display: "inline-block",
                }}
              />
              Generated by Gemini AI
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
