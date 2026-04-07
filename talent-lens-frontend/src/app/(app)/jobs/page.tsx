"use client";

import React, { useEffect } from "react";
import StatCard from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const activeJobs = jobs.filter((j) => j.status === "Draft" || j.status === "Open" || j.status === "Screening");
  const screenedJobs = jobs.filter((j) => j.status === "Closed" || j.status === "screened" as any); // fallback for any ghost models

  if (loading && jobs.length === 0) return <LoadingSpinner />;

  return (
    <div className="stagger">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Active Postings" value={activeJobs.length} color="blue" />
        <StatCard label="Jobs Screened" value={screenedJobs.length} color="default" />
      </div>

      <div className="mb-6">
        <h2 className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: "#5a5a72" }}>
          Active Jobs
        </h2>
        <div className="flex flex-col gap-3">
          {activeJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
          {activeJobs.length === 0 && (
            <div className="text-center py-12 border border-dashed border-[var(--border)] rounded-xl text-[var(--text3)]">
              No active jobs available.
            </div>
          )}
        </div>
      </div>
      
      {screenedJobs.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: "#5a5a72" }}>
            Screened Jobs
          </h2>
          <div className="flex flex-col gap-3 opacity-60">
            {screenedJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
