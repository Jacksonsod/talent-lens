"use client";

import React, { useEffect } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useSearchParams } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import { ScoreBar } from "@/components/ui/StatCard";
import { Applicant } from "@/lib/types";

export default function ComparePage() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const jobId = searchParams.get("jobId");
  
  const shortlist = useAppSelector((s) => jobId ? s.screening.shortlists[jobId] : null);
  const job = useAppSelector((s) => s.jobs.selected);
  const loading = useAppSelector(s => s.screening.isScreening || s.jobs.loading);

  useEffect(() => {
    if (jobId) {
       dispatch(fetchJobById(jobId));
       if (!shortlist) dispatch(fetchShortlist(jobId));
    }
  }, [jobId, dispatch, shortlist]);
  
  if (!jobId || (!shortlist && !loading)) {
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

  if (loading || !shortlist) {
    return <div className="text-center py-20 text-[var(--text3)] font-bold">Loading...</div>;
  }

  const topCandidates = shortlist.slice(0, 3);

  return (
    <div className="stagger pb-20">
      {job && (
        <div className="mb-6">
          <div className="text-[13px] text-[var(--text3)] mb-1">Comparing top candidates for</div>
          <div className="font-display font-bold text-2xl text-[var(--text)]">{job.roleTitle}</div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topCandidates.map((c, i) => {
          const app = c.applicantId as Applicant;
          const fullName = `${app.firstName} ${app.lastName}`;

          return (
            <div
              key={c._id}
              className={`p-6 rounded-xl border bg-[var(--surface)] transition-all ${
                i === 0 ? "border-[var(--green)] ring-1 ring-[var(--green-dim)]" : "border-[var(--border)]"
              }`}
            >
              {i === 0 && (
                <div className="text-center mb-2">
                  <span className="text-[10px] px-3 py-1 rounded-full bg-[rgba(0,229,160,0.1)] text-[var(--green)] border border-[rgba(0,229,160,0.2)] font-bold">
                    ✨ Best Match
                  </span>
                </div>
              )}
              <div className="text-center mb-6 pb-6 border-b border-[var(--border)]">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-3"
                  style={{ background: "rgba(124,111,255,0.15)", color: "var(--accent)" }}
                >
                  {app.firstName.charAt(0)}{app.lastName.charAt(0)}
                </div>
                <div className="font-medium text-[15px] mb-1 text-[var(--text)]">{fullName}</div>
                <div className="text-[11px] text-[var(--text3)] line-clamp-1">{app.currentRole || "Candidate"}</div>
                
                <div className="mt-4 font-display font-extrabold text-4xl tracking-tighter" style={{ color: c.matchScore >= 80 ? "var(--green)" : "var(--amber)" }}>
                  {c.matchScore}
                </div>
                <div className="text-[11px] text-[var(--text3)] uppercase tracking-widest mt-1">match score</div>
              </div>

              <div className="space-y-4 mb-6 pb-6 border-b border-[var(--border)]">
                {[
                  { label: "Skills", value: c.scoreBreakdown.skills },
                  { label: "Experience", value: c.scoreBreakdown.experience },
                  { label: "Education", value: c.scoreBreakdown.education },
                  { label: "Relevance", value: c.scoreBreakdown.relevance },
                ].map((m) => (
                  <div key={m.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] text-[var(--text3)] font-bold">{m.label}</span>
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

              <div className="text-center">
                 <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 text-[var(--green)]">Strengths Summary</div>
                 <p className="text-xs text-[var(--text2)] line-clamp-3 mb-4 italic">"{c.strengths}"</p>

                 <div className="text-[10px] font-bold tracking-widest uppercase mb-1.5 text-[var(--text3)]">Final AI Recommendation</div>
                 <div className={cn(
                    "inline-block font-bold mt-1 text-[12px] px-3.5 py-1.5 rounded-full border content-center mx-auto",
                    c.finalRecommendation.toLowerCase().includes("strongly") ? "bg-[rgba(0,229,160,0.12)] text-[var(--green)] border-[rgba(0,229,160,0.25)]" :
                    c.finalRecommendation.toLowerCase().includes("consider") ? "bg-[var(--amber-dim)] text-[var(--amber)] border-[rgba(255,181,71,0.25)]" :
                    "bg-[var(--red-dim)] text-[var(--red)] border-[rgba(255,107,107,0.2)]"
                  )}>
                   {c.finalRecommendation}
                 </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
