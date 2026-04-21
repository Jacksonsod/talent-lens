"use client";

import React from "react";
import { Job } from "@/lib/types";
import { X, Briefcase, Calendar, Users, Target, CheckCircle2, ChevronRight, FileText, Settings, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchApplicantsByJob } from "@/lib/slices/applicantsSlice";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import { useEffect } from "react";

interface JobDetailsModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDetailsModal({ job, isOpen, onClose }: JobDetailsModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const applicants = useAppSelector(s => s.applicants.items.filter(a => a.jobId === job._id));
  const shortlist = useAppSelector(s => s.screening.shortlists[job._id] || []);
  const loadingApplicants = useAppSelector(s => s.applicants.loading);

  useEffect(() => {
    if (isOpen && job._id) {
      dispatch(fetchApplicantsByJob(job._id));
      dispatch(fetchShortlist(job._id));
    }
  }, [isOpen, job._id, dispatch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-white relative">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
             <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">
               {job.status}
             </span>
             <span className="text-white/60 text-[10px] font-bold uppercase tracking-wider">
               Posted {new Date(job.createdAt).toLocaleDateString()}
             </span>
          </div>
          
          <h2 className="text-3xl font-extrabold tracking-tight mb-2" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
            {job.roleTitle}
          </h2>
          
          <div className="flex flex-wrap gap-4 text-sm font-medium text-blue-100">
            <div className="flex items-center gap-1.5">
              <Briefcase size={16} />
              {job.experienceLevel}
            </div>
            <div className="flex items-center gap-1.5">
              <Target size={16} />
              Goal: {job.shortlistSize} Shortlist
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
             <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-gray-900">
                  {loadingApplicants && applicants.length === 0 ? <Loader2 size={20} className="animate-spin mx-auto" /> : applicants.length}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Applicants</div>
             </div>
             <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-blue-600">
                  {shortlist.filter(s => s.status === "Completed").length}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Screened</div>
             </div>
             <div className="bg-gray-50 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-green-600">
                  {shortlist.length}
                </div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Shortlisted</div>
             </div>
          </div>

          <div className="space-y-8">
            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Job Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </section>

            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Requirements</h3>
              <ul className="space-y-2">
                {job.requirements?.map((req, i) => (
                  <li key={i} className="flex gap-3 text-sm text-gray-600">
                    <CheckCircle2 size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    {req}
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 mb-3">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills?.map((skill) => (
                  <span 
                    key={skill}
                    className="px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-[12px] font-bold text-gray-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => router.push(`/jobs/${job._id}/edit`)}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-white hover:text-blue-600 transition-all shadow-sm"
              title="Edit Job"
            >
              <Settings size={20} />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
             <button 
               onClick={onClose}
               className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all"
             >
               Close
             </button>
             <button 
               onClick={() => router.push(`/jobs/${job._id}/applicants`)}
               className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
             >
               View More
               <Users size={16} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
