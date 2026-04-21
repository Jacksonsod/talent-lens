"use client";

import React, { useEffect, Suspense } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { fetchJobById, fetchJobs } from "@/lib/slices/jobsSlice";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import { ScoreBar } from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import { Applicant } from "@/lib/types";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

function CompareContent() {
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const jobId = searchParams.get("jobId");
  
  const { items: jobs, loading: jobsLoading } = useAppSelector(s => s.jobs);
  const shortlist = useAppSelector((s) => jobId ? s.screening.shortlists[jobId] : null);
  const job = useAppSelector((s) => s.jobs.selected);
  const loading = useAppSelector(s => s.screening.isScreening || s.jobs.loading);

  useEffect(() => {
    if (jobId) {
       dispatch(fetchJobById(jobId));
       if (!shortlist) dispatch(fetchShortlist(jobId));
    } else {
       dispatch(fetchJobs());
    }
  }, [jobId, dispatch, shortlist]);
  
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;
  
  if (!jobId) {
    if (jobsLoading) return <div className="text-center py-20 text-[var(--text3)] font-bold">Loading Screening Data...</div>;
    const screenedJobs = jobs.filter(j => j.status === "Closed" || j.status === "Screening" || (j as any).status === "screened");
    
    const totalPages = Math.ceil(screenedJobs.length / pageSize);
    const paginatedJobs = screenedJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
      <div className="stagger pb-20 max-w-5xl mx-auto">
        <div className="mb-8">
           <h1 className="font-display font-bold text-3xl tracking-tight mb-2 text-[var(--text)]">Select a Job to Compare</h1>
           <p className="text-[var(--text3)] text-sm">Choose a successfully compiled screening pipeline below to launch the side-by-side AI Comparison Matrix.</p>
        </div>
        
        {screenedJobs.length === 0 ? (
          <EmptyState
            title="No Screened Jobs Available"
            description="You do not have any candidate pipelines that have finished the AI Screening phase. Head over to the Shortlists or Jobs panel to start a screening process."
            action={{ label: "Go to Dashboard", href: "/dashboard" }}
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {paginatedJobs.map(job => (
                 <JobCard key={job._id} job={job} mode="compare" />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-12">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-6 py-2.5 rounded-xl border border-[var(--border)] bg-white font-bold text-[13px] hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-[12px] font-bold transition-all ${
                        currentPage === i + 1 
                          ? "bg-gray-900 text-white" 
                          : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-6 py-2.5 rounded-xl border border-[var(--border)] bg-white font-bold text-[13px] hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
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
                 <p className="text-xs text-[var(--text2)] line-clamp-3 mb-4 italic">&quot;{c.strengths}&quot;</p>

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

export default function ComparePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CompareContent />
    </Suspense>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
