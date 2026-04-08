"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { Job } from "@/lib/types";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import StatCard from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import ScreeningModal from "@/components/ui/ScreeningModal";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading, error } = useAppSelector((s) => s.jobs);
  const { screenAllResult } = useAppSelector((s) => s.screening);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
       toast.error(error);
    }
  }, [error]);

  // Derive stats directly from live jobs
  const activeJobsCount = jobs.filter(j => j.status === "Open").length;
  const totalJobsCount = jobs.length;
  const screenedJobsCount = jobs.filter(j => j.status === "Screening" || j.status === "Closed").length;
  
  const avgMatchScore = screenAllResult ? Math.round(screenAllResult.results.reduce((acc, c) => acc + c.matchScore, 0) / Math.max(1, screenAllResult.results.length)) : 0;

  if (loading && jobs.length === 0) return <LoadingSpinner />;

  return (
    <div className="stagger">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active Jobs" value={activeJobsCount} color="blue" />
        <StatCard label="Total Jobs" value={totalJobsCount} color="purple" />
        <StatCard label="Screened Jobs" value={screenedJobsCount} color="green" />
        <StatCard label="Latest Avg Score" value={avgMatchScore > 0 ? avgMatchScore : "-"} color="amber" highlight />
      </div>

      {/* Jobs list Section Heading */}
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: "var(--text3)" }}
        >
          Your Postings
        </h2>
      </div>

      {jobs.length === 0 ? (
        <EmptyState
          title="No jobs yet"
          description="Create your first job posting to start screening candidates with AI."
          action={{ label: "Create Job", href: "/jobs/new" }}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job: Job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      )}

      {/* Global Screening Modal watching Redux state */}
      {/* Note: since the integration drives the loader directly on the button and pushes to route, we can remove the modal if we want, or leave it. */}
      {/* <ScreeningModal /> */}
    </div>
  );
}
