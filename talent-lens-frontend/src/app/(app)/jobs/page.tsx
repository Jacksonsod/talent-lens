"use client";

import React, { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import JobCard from "@/components/jobs/JobCard";
import JobDetailsModal from "@/components/jobs/JobDetailsModal";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import { fetchApplicantsByJob } from "@/lib/slices/applicantsSlice";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Search, Plus, Briefcase, CheckCircle2, Users, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { Job } from "@/lib/types";

export default function JobsPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    dispatch(fetchJobs()).then((action) => {
      if (fetchJobs.fulfilled.match(action)) {
        action.payload.forEach((job: Job) => {
          dispatch(fetchApplicantsByJob(job._id));
          dispatch(fetchShortlist(job._id));
        });
      }
    });
  }, [dispatch]);

  const totalApplicantsCount = useAppSelector(s => s.applicants.items.length);

  const activeJobs = jobs.filter((j) => j.status === "Open" || j.status === "Screening");
  const screenedJobs = jobs.filter((j) => j.status === "Closed");
  
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.roleTitle.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "All" || job.status === filter;
    return matchesSearch && matchesFilter;
  });

  if (loading && jobs.length === 0) return <LoadingSpinner />;

  return (
    <div className="stagger max-w-[1200px] mx-auto pb-20">
      {/* ─── Header Section ─────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
            Job Postings
          </h1>
          <p className="text-gray-500 text-sm">
            Manage your recruitment pipeline and track candidate progress.
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 h-11 px-6 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-200"
        >
          <Plus size={18} strokeWidth={3} />
          Create New Job
        </Link>
      </div>

      {/* ─── Stats Header ─────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Briefcase size={22} />
          </div>
          <div>
            <div className="text-2xl font-black">{activeJobs.length}</div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Jobs</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-2xl font-black">{screenedJobs.length}</div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Completed</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users size={22} />
          </div>
          <div>
            <div className="text-2xl font-black">{totalApplicantsCount}</div>
            <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Applicants</div>
          </div>
        </div>
      </div>

      {/* ─── Filter Bar ────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by role title..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {["All", "Open", "Screening", "Closed"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-[13px] font-bold transition-all whitespace-nowrap ${
                filter === s 
                  ? "bg-gray-900 text-white shadow-md shadow-gray-200" 
                  : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100 shadow-sm"
              }`}
            >
              {s}
            </button>
          ))}
          <div className="h-8 w-[1px] bg-gray-200 mx-2 hidden md:block" />
          <button className="p-2.5 bg-white border border-gray-100 rounded-lg text-gray-500 hover:bg-gray-50 shadow-sm">
            <SlidersHorizontal size={18} />
          </button>
        </div>
      </div>

      {/* ─── Jobs List ─────────────────────────────── */}
      <div className="space-y-4">
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard 
              key={job._id} 
              job={job} 
              onViewDetails={() => setSelectedJob(job)} 
            />
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-gray-300" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-700">No jobs found</h3>
            <p className="text-gray-400 text-sm max-w-[300px] mx-auto mt-1">
              Try adjusting your search or filters to find what you&apos;re looking for.
            </p>
          </div>
        )}
      </div>

      {/* ─── Modals ────────────────────────────────── */}
      {selectedJob && (
        <JobDetailsModal 
          job={selectedJob} 
          isOpen={!!selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  );
}
