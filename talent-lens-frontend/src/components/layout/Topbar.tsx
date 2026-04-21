"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { setSearchTerm } from "@/lib/slices/uiSlice";
import { Search, Bell, Plus, Menu, Briefcase, User, ChevronRight } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { data: user } = useAppSelector((s) => s.profile);
  const { searchTerm } = useAppSelector((s) => s.ui);
  const { items: jobs } = useAppSelector((s) => s.jobs);
  const { shortlists } = useAppSelector((s) => s.screening);
  
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (href: string) => {
    dispatch(setSearchTerm(""));
    setIsFocused(false);
    router.push(href);
  };

  // ─── Search Logic ───────────────────────────
  const filteredJobs = searchTerm.length >= 2 
    ? jobs.filter(j => j.roleTitle.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 4)
    : [];

  // Filter candidates (only those currently in shortlists for simplicity)
  const allResults = Object.values(shortlists).flat();
  const filteredCandidates = searchTerm.length >= 2
    ? allResults.filter(r => {
        const applicant = typeof r.applicantId === 'object' ? r.applicantId : null;
        if (!applicant) return false;
        const fullName = `${applicant.firstName} ${applicant.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      }).slice(0, 4)
    : [];

  const hasResults = filteredJobs.length > 0 || filteredCandidates.length > 0;
  const showDropdown = isFocused && searchTerm.length >= 2;
  
  return (
    <header
      className="flex items-center justify-between px-4 md:px-7 py-3 shrink-0"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-6 flex-1">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--surface2)]"
          style={{ color: "var(--text)" }}
        >
          <Menu size={20} />
        </button>

        {/* Left Side: Greeting */}
        <div className="hidden sm:block">
          <h1
            style={{ 
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: "15px",
              color: "var(--text)"
            }}
          >
            {greeting}, {user?.firstName || "Recruiter"} 👋
          </h1>
        </div>

        {/* Search Box */}
        <div className="relative max-w-[340px] flex-1 hidden md:block" ref={searchRef}>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={14} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-1.5 border border-[var(--border)] rounded-[9px] bg-gray-50/50 text-[13px] placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] focus:border-[var(--accent)] transition-all"
            placeholder="Search jobs, candidates, results..."
            value={searchTerm}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
          />

          {/* Search Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl border border-black/[0.08] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2 space-y-4 max-h-[400px] overflow-y-auto">
                
                {/* JOBS SECTION */}
                {filteredJobs.length > 0 && (
                  <div>
                    <h3 className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jobs</h3>
                    {filteredJobs.map(job => (
                      <button
                        key={job._id}
                        onClick={() => handleSelect(`/jobs/${job._id}`)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <Briefcase size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-gray-700 truncate">{job.roleTitle}</div>
                          <div className="text-[10px] text-gray-400 truncate">{job.status} · {job.shortlistSize} positions</div>
                        </div>
                        <ChevronRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                )}

                {/* CANDIDATES SECTION */}
                {filteredCandidates.length > 0 && (
                  <div>
                    <h3 className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Candidates</h3>
                    {filteredCandidates.map(res => {
                      const applicant = res.applicantId as any;
                      const name = `${applicant.firstName} ${applicant.lastName}`;
                      const job = jobs.find(j => j._id === res.jobId);
                      return (
                        <button
                          key={res._id}
                          onClick={() => handleSelect(`/jobs/${res.jobId}`)} // Navigate to job context
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors group text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                            {applicant.firstName[0]}{applicant.lastName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold text-gray-700 truncate">{name}</div>
                            <div className="text-[10px] text-gray-400 truncate">Score: {res.matchScore}% · {job?.roleTitle}</div>
                          </div>
                          <ChevronRight size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {!hasResults && (
                  <div className="p-8 text-center">
                    <p className="text-[13px] text-gray-400">No matches found for &quot;{searchTerm}&quot;</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50/80 p-2.5 border-t border-gray-100 text-center">
                <button 
                  onClick={() => setIsFocused(false)}
                  className="text-[11px] font-bold text-[#2563EB] hover:underline"
                >
                  View all results
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/jobs/new"
          className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#2563EB] text-white hover:bg-blue-700 transition-all font-semibold text-xs"
        >
          <Plus size={14} strokeWidth={3} />
          <span className="hidden sm:inline">New Job</span>
        </Link>
      </div>
    </header>
  );
}
