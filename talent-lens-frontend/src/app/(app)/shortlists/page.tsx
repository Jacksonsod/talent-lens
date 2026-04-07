"use client";

import React, { useEffect } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ShortlistsPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);
  
  // A shortlist exists for any job that has completed screening
  const screenedJobs = jobs.filter(j => j.status === "Closed" || j.status === "screened" as any);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  if (loading && jobs.length === 0) return <LoadingSpinner />;

  return (
    <div className="stagger">
      <div className="mb-6">
        <h2 className="text-xs font-semibold tracking-widest uppercase mb-4 text-[var(--text3)]">
          Recent Shortlists
        </h2>
        {screenedJobs.length === 0 ? (
          <EmptyState
            title="Your Shortlists"
            description="Run AI screening on any job posting to generate your first candidate shortlist."
            action={{ label: "Go to Dashboard", href: "/dashboard" }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {screenedJobs.map((job) => (
              <Link
                key={job._id}
                href={`/jobs/${job._id}/shortlist`}
                className="p-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent)] transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE" }}
                  >
                    <ClipboardList size={19} color="#4F46E5" strokeWidth={1.8} />
                  </div>
                  <div className="text-[12px] text-[var(--text3)]">
                    Target: {job.shortlistSize || 10} candidates
                  </div>
                </div>
                <div className="font-display font-bold text-lg text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                  {job.roleTitle} Shortlist
                </div>
                <div className="text-[12px] text-[var(--text3)] mt-1">
                  AI Screening completed · Gemini 1.5 Pro
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
