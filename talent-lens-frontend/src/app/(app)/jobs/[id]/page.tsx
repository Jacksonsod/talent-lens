"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import { fetchShortlist, screenAll, resetScreeningState } from "@/lib/slices/screeningSlice";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Briefcase, Users, Zap, Upload, ExternalLink } from "lucide-react";
import ScreeningModal from "@/components/ui/ScreeningModal";
import Link from "next/link";

export default function JobDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const job = useAppSelector((s) => s.jobs.items.find(j => j._id === id) || s.jobs.selected);
  const loading = useAppSelector((s) => s.jobs.loading);

  useEffect(() => {
    dispatch(fetchJobById(id));
    dispatch(fetchShortlist(id));
  }, [id, dispatch]);

  if (loading && !job) return <LoadingSpinner />;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="stagger">
      {/* Header Info */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm mb-2" style={{ color: "var(--text3)" }}>
          <Link href="/dashboard" className="hover:text-[var(--text2)] transition-colors">Overview</Link>
          <span>/</span>
          <span style={{ color: "var(--text2)" }}>Job Details</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-3xl tracking-tight mb-2" style={{ color: "var(--text)" }}>
              {job.roleTitle}
            </h1>
            <div className="flex items-center gap-4 text-sm" style={{ color: "var(--text3)" }}>
              <span className="flex items-center gap-1.5"><Briefcase size={14}/> Engineering</span>
              <span className="flex items-center gap-1.5"><Users size={14}/> Active Requisition</span>
              <span className="px-2 py-0.5 rounded bg-[var(--surface3)] text-[10px] font-bold uppercase tracking-wider">
                {job.status}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
             <button 
                className="btn btn-ghost"
                onClick={() => router.push(`/jobs/${id}/upload`)}
             >
                <Upload size={14} className="mr-2" />
                Upload Candidates
             </button>
             {(job.status === "Screening" || job.status === "Closed") ? (
                <button 
                  className="btn btn-primary"
                  onClick={() => router.push(`/jobs/${id}/shortlist`)}
                >
                  <ExternalLink size={14} className="mr-2" />
                  View Shortlist
                </button>
             ) : (
                <button 
                  className="btn btn-primary animate-pulse-ai"
                  onClick={() => dispatch(screenAll(id))}
                >
                  <Zap size={14} className="mr-2 fill-current" />
                  Run AI Screening
                </button>
             )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Phase" value="Phase 3" color="blue" sub="Candidate Ingestion" />
        <StatCard label="Status" value={job.status} sub="Current Workflow Stage" />
        <StatCard label="AI Readiness" value={job.requiredSkills.length > 0 ? "High" : "Needs Skills"} color={job.requiredSkills.length > 0 ? "green" : "amber"} sub={`${job.requiredSkills.length} matching criteria`} />
      </div>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
           {/* Step Card: Ingestion */}
           <div className="rounded-2xl p-6 border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center">
                  <Upload size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>Step 1: Applicant Ingestion</h3>
                  <p className="text-[12px]" style={{ color: "var(--text3)" }}>Scenario 1 & 2: Pull internal or external talent</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  className="flex-1 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)] transition-all text-left group"
                  onClick={() => router.push(`/jobs/${id}/upload?type=umurava`)}
                >
                  <div className="font-bold text-sm mb-1 text-[var(--text)] group-hover:text-[var(--accent)]">Umurava Internal</div>
                  <div className="text-[11px] text-[var(--text3)]">Import structured talent profiles</div>
                </button>
                <button 
                   className="flex-1 p-4 rounded-xl border border-[var(--border)] bg-[var(--surface2)] hover:border-[var(--accent)] transition-all text-left group"
                   onClick={() => router.push(`/jobs/${id}/upload?type=external`)}
                >
                  <div className="font-bold text-sm mb-1 text-[var(--text)] group-hover:text-[var(--accent)]">External Upload</div>
                  <div className="text-[11px] text-[var(--text3)]">Bulk upload CSV or PDF resumes</div>
                </button>
              </div>
           </div>

           {/* Step Card: Screening Trigger */}
           <div className="rounded-2xl p-6 border border-[var(--border)] bg-[var(--surface)]">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg" style={{ color: "var(--text)" }}>Step 2: AI Screening</h3>
                  <p className="text-[12px]" style={{ color: "var(--text3)" }}>Phase 4: Run System AI analysis</p>
                </div>
              </div>
              <p className="text-[13px] mb-4" style={{ color: "var(--text2)" }}>
                Once your applicants are loaded, trigger the AI matching engine to score and rank candidates based on your specific job requirements.
              </p>
              <button 
                className="btn btn-primary w-full py-4 text-base font-bold"
                onClick={() => dispatch(screenAll(id))}
              >
                Launch AI Matchmaking
              </button>
           </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
           <div className="rounded-2xl p-6 border border-[var(--border)] bg-[var(--surface)]">
              <h3 className="text-[11px] font-bold tracking-widest uppercase mb-4" style={{ color: "var(--text3)" }}>Job Criteria</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map(s => (
                  <span key={s} className="px-2.5 py-1 rounded-md text-[11px] bg-[var(--surface3)] text-[var(--text2)] border border-[var(--border)]">
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                 <div className="text-[10px] uppercase font-bold text-[var(--text3)] mb-2">Experience</div>
                 <div className="text-sm font-medium">{job.experienceLevel}</div>
              </div>
           </div>
        </div>
      </div>

      <ScreeningModal />
    </div>
  );
}
