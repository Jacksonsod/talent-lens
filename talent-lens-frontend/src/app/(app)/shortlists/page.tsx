"use client";

import React, { useEffect } from "react";
import EmptyState from "@/components/ui/EmptyState";
import { useAppSelector, useAppDispatch } from "@/lib/hooks/redux";
import Link from "next/link";
import { 
  Code2,
  BrainCircuit,
  PenTool,
  Server,
  BarChart2,
  ShieldCheck,
  Smartphone,
  Database,
  Globe,
  Briefcase,
  Search
} from "lucide-react";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type IconConfig = {
  Icon: React.ElementType;
  bg: string;
  color: string;
  border: string;
};

function getJobIcon(title: string): IconConfig {
  const t = title.toLowerCase();
  if (t.includes("ai") || t.includes("ml") || t.includes("machine learning") || t.includes("llm"))
    return { Icon: BrainCircuit, bg: "#7C3AED", color: "#ffffff", border: "#6D28D9" };
  if (t.includes("design") || t.includes("ux") || t.includes("ui") || t.includes("figma"))
    return { Icon: PenTool,     bg: "#E11D48", color: "#ffffff", border: "#BE123C" };
  if (t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("react native"))
    return { Icon: Smartphone,  bg: "#EA580C", color: "#ffffff", border: "#C2410C" };
  if (t.includes("data") || t.includes("analyst") || t.includes("analytics") || t.includes("qa") || t.includes("test"))
    return { Icon: BarChart2,   bg: "#D97706", color: "#ffffff", border: "#B45309" };
  if (t.includes("backend") || t.includes("back-end") || t.includes("server") || t.includes("node"))
    return { Icon: Server,      bg: "#16A34A", color: "#ffffff", border: "#15803D" };
  if (t.includes("security") || t.includes("cyber"))
    return { Icon: ShieldCheck, bg: "#0D9488", color: "#ffffff", border: "#0F766E" };
  if (t.includes("database") || t.includes("dba"))
    return { Icon: Database,    bg: "#2563EB", color: "#ffffff", border: "#1D4ED8" };
  if (t.includes("full stack") || t.includes("fullstack") || t.includes("engineer") || t.includes("developer"))
    return { Icon: Code2,       bg: "#2563EB", color: "#ffffff", border: "#1D4ED8" };
  if (t.includes("web") || t.includes("frontend") || t.includes("front-end"))
    return { Icon: Globe,       bg: "#0284C7", color: "#ffffff", border: "#0369A1" };
  return { Icon: Briefcase,     bg: "#475569", color: "#ffffff", border: "#334155" };
}

export default function ShortlistsPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [search, setSearch] = React.useState("");
  const pageSize = 10;
  
  // A shortlist exists for any job that has completed screening
  const screenedJobs = jobs.filter(j => (j.status === "Closed" || j.status === "screened" as any) && 
    j.roleTitle.toLowerCase().includes(search.toLowerCase())
  );
  
  const totalPages = Math.ceil(screenedJobs.length / pageSize);
  const paginatedJobs = screenedJobs.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  if (loading && jobs.length === 0) return <LoadingSpinner />;

  return (
    <div className="stagger">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
            Candidate Shortlists
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Access AI-screened candidate pools for your completed job postings.
          </p>
        </div>

        <div className="relative w-full md:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search shortlists..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-text-muted">
            {search ? `Search Results (${screenedJobs.length})` : "Recent Shortlists"}
          </h2>
          {totalPages > 1 && (
            <div className="text-[12px] font-bold text-text-muted">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {screenedJobs.length === 0 ? (
          <EmptyState
            title="Your Shortlists"
            description="Run AI screening on any job posting to generate your first candidate shortlist."
            action={{ label: "Go to Dashboard", href: "/dashboard" }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paginatedJobs.map((job) => {
                const { Icon, bg, color, border } = getJobIcon(job.roleTitle);
                
                return (
                  <Link
                    key={job._id}
                    href={`/jobs/${job._id}/shortlist`}
                    className="p-5 rounded-xl border border-bg-surface3 bg-bg-surface hover:border-brand-accent transition-all group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors shadow-sm"
                        style={{ background: bg, border: `1.5px solid ${border}` }}
                      >
                        <Icon size={20} color={color} strokeWidth={1.8} />
                      </div>
                      <div className="text-[12px] text-text-muted font-medium">
                        Target: {job.shortlistSize || 10} candidates
                      </div>
                    </div>
                    <div className="font-display font-bold text-lg text-text group-hover:text-brand-accent transition-colors mt-3">
                      {job.roleTitle} Shortlist
                    </div>
                    <div className="text-[12px] text-text-muted mt-1 font-medium">
                      AI Screening completed · System AI
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
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
    </div>
  );
}
