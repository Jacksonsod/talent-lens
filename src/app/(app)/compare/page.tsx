"use client";

import React from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useSearchParams } from "next/navigation";
import { useAppSelector } from "@/lib/hooks/redux";
import { ScoreBar } from "@/components/ui/StatCard";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const { results } = useAppSelector((s) => s.screening);
  
  if (!jobId || !results[jobId]) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <EmptyState
          title="Compare Candidates"
          description="Select a job from the dashboard to see a side-by-side AI comparison of top candidates."
          action={{ label: "Go to Dashboard", href: "/dashboard" }}
        />
      </div>
    );
  }

  const topCandidates = results[jobId].results.slice(0, 3);

  return (
    <div className="stagger">
      <div className="mb-6">
        <div className="text-[13px] text-[var(--text3)] mb-1">Comparing top candidates for</div>
        <div className="font-display font-bold text-lg text-[var(--text)]">Senior Engineering Role</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topCandidates.map((c, i) => (
          <div
            key={c._id}
            className={`p-6 rounded-xl border bg-[var(--surface)] transition-all ${
              i === 0 ? "border-[var(--green)] ring-1 ring-[var(--green-dim)]" : "border-[var(--border)]"
            }`}
          >
            {i === 0 && (
              <div className="text-center mb-2">
                <span className="text-[10px] px-3 py-1 rounded-full bg-[rgba(0,229,160,0.1)] text-[var(--green)] border border-[rgba(0,229,160,0.2)]">
                  Best Match
                </span>
              </div>
            )}
            <div className="text-center mb-6 pb-6 border-b border-[var(--border)]">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3"
                style={{ background: "rgba(124,111,255,0.15)", color: "var(--accent)" }}
              >
                {c.applicant.name.charAt(0)}
              </div>
              <div className="font-medium text-[15px] mb-1 text-[var(--text)]">{c.applicant.name}</div>
              <div className="font-display font-extrabold text-4xl tracking-tighter" style={{ color: c.totalScore >= 80 ? "var(--green)" : "var(--amber)" }}>
                {c.totalScore}
              </div>
              <div className="text-[11px] text-[var(--text3)] uppercase tracking-widest mt-1">match score</div>
            </div>

            <div className="space-y-4">
              {[
                { label: "Skills", value: c.scoreBreakdown.skills },
                { label: "Experience", value: c.scoreBreakdown.experience },
                { label: "Education", value: c.scoreBreakdown.education },
                { label: "Relevance", value: c.scoreBreakdown.relevance },
              ].map((m) => (
                <div key={m.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] text-[var(--text3)]">{m.label}</span>
                    <span className={cn(
                      "text-[13px] font-bold",
                      m.value >= 80 ? "text-[var(--green)]" : m.value >= 65 ? "text-[var(--amber)]" : "text-[var(--red)]"
                    )}>
                      {m.value}
                    </span>
                  </div>
                  <ScoreBar value={m.value} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
