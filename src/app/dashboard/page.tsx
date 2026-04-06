"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import StatCard from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);
  const { results } = useAppSelector((s) => s.screening);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const totalApplicants = jobs.reduce((sum, j) => sum + j.applicantCount, 0);
  const screenedJobs = Object.keys(results).length;
  const activeJobs = jobs.filter((j) => j.status === "active").length;

  return (
    <div className="stagger">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Jobs" value={activeJobs} color="blue" />
        <StatCard label="Total Applicants" value={totalApplicants} />
        <StatCard label="AI Screened" value={screenedJobs} color="green" sub="jobs completed" />
        <StatCard label="Avg Match Score" value={71} color="amber" sub="across all jobs" />
      </div>

      {/* Jobs list */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--surface3)", color: "#5a5a72" }}
        >
          Active Jobs
        </h2>
        <Link
          href="/jobs/new"
          className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
          style={{
            borderColor: "rgba(255,255,255,0.12)",
            color: "#9090a8",
          }}
        >
          + New Job
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Create your first job posting to start screening candidates with AI."
          action={{ label: "Create Job", href: "/jobs/new" }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
