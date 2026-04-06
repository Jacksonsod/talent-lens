"use client";

import React from "react";
import StatCard from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import { useAppSelector } from "@/lib/hooks/redux";

export default function JobsPage() {
  const { items: jobs } = useAppSelector((s) => s.jobs);
  const activeJobs = jobs.filter((j) => j.status === "active");
  const closedJobs = jobs.filter((j) => j.status === "closed");

  return (
    <div className="stagger">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <StatCard label="Active Postings" value={activeJobs.length} color="blue" />
        <StatCard label="Closed / Filled" value={closedJobs.length} color="default" />
      </div>

      <div className="mb-6">
        <h2 className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: "#5a5a72" }}>
          Active Jobs
        </h2>
        <div className="flex flex-col gap-3">
          {activeJobs.map((job) => (
            <JobCard key={job._id} job={job} />
          ))}
        </div>
      </div>
      
      {closedJobs.length > 0 && (
        <div>
          <h2 className="text-[11px] font-semibold tracking-widest uppercase mb-4" style={{ color: "#5a5a72" }}>
            Past Jobs
          </h2>
          <div className="flex flex-col gap-3 opacity-60">
            {closedJobs.map((job) => (
              <JobCard key={job._id} job={job} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
