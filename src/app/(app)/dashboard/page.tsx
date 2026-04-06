"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import StatCard from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import Link from "next/link";
import ScreeningModal from "@/components/ui/ScreeningModal";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  // Specific mockup data as seen in the user provided image
  const totalApplicants = 142;
  const screenedJobsCount = 98;
  const activeJobsCount = 3;
  const avgMatchScore = 71;

  if (loading && jobs.length === 0) return <LoadingSpinner />;

  return (
    <div className="stagger">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Jobs" value={activeJobsCount} color="blue" sub="2 pending review" />
        <StatCard label="Total Applicants" value={totalApplicants} sub="This month" />
        <StatCard label="Screened by AI" value={screenedJobsCount} color="green" sub="69% of applicants" />
        <StatCard label="Avg Match Score" value={avgMatchScore} color="amber" sub="Out of 100" />
      </div>

      {/* Jobs list Section Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--text3)" }}
        >
          Active Jobs
        </h2>
        <Link
          href="/jobs/new"
          className="btn btn-ghost"
        >
          + New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
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

      {/* Global Screening Modal watching Redux state */}
      <ScreeningModal />
    </div>
  );
}
