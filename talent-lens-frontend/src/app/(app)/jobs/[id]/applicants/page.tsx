"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchApplicantsByJob } from "@/lib/slices/applicantsSlice";
import { fetchJobById, updateJobStatus } from "@/lib/slices/jobsSlice";
import { screenAll } from "@/lib/slices/screeningSlice";
import toast from "react-hot-toast";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Users, Zap, Plus, Upload, UserPlus, Search, ArrowLeft, Mail, ScrollText, GraduationCap, MapPin } from "lucide-react";
import ProfileWizardModal from "@/components/profile/ProfileWizardModal";
import ImportCandidateModal from "@/components/applicants/ImportCandidateModal";

export default function ApplicantHubPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const job = useAppSelector(s => s.jobs.selected);
  const { items: allApplicants, loading: appsLoading } = useAppSelector(s => s.applicants);
  const applicants = allApplicants.filter(a => a.jobId === id);
  
  const [screening, setScreening] = useState(false);
  const [search, setSearch] = useState("");
  
  // Modal states
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  useEffect(() => {
    dispatch(fetchJobById(id));
    dispatch(fetchApplicantsByJob(id));
  }, [dispatch, id]);

  const handleScreenAll = async () => {
    setScreening(true);
    if (job && job.status !== "Screening" && job.status !== "Closed") {
      await dispatch(updateJobStatus({ id, status: "Screening" }));
    }
    const result = await dispatch(screenAll(id));
    if (screenAll.fulfilled.match(result)) {
      await dispatch(updateJobStatus({ id, status: "Closed" }));
      toast.success("Batch screening completed!");
      router.push(`/jobs/${id}/shortlist`);
    } else {
      toast.error(result.payload as string || "Failed to screen applicants.");
      if (job?.status === "Open") await dispatch(updateJobStatus({ id, status: "Open" }));
      setScreening(false);
    }
  };

  if (!job) return <div className="flex h-[80vh] items-center justify-center"><LoadingSpinner /></div>;

  const filteredApplicants = applicants.filter(a => 
    a.firstName.toLowerCase().includes(search.toLowerCase()) || 
    a.lastName.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  const isDraft = job.status === "Draft" || job.status === "Closed";

  return (
    <>
      <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-fade-up">
      
      {/* ─── Premium Header ─── */}
      <div className="relative overflow-hidden rounded-[2rem] bg-[#2563EB] text-white p-8 md:p-10 shadow-xl shadow-blue-900/10">
        {/* Abstract background elements */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative z-10">
          <button 
            onClick={() => router.push('/jobs')}
            className="flex items-center gap-2 text-blue-100 hover:text-white mb-6 transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Jobs
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                 <span className={`px-3 py-1 rounded-full backdrop-blur-md text-[10px] font-black uppercase tracking-wider border ${
                   isDraft ? "bg-amber-500/20 text-amber-200 border-amber-500/30" : "bg-white/20 text-white border-white/10"
                 }`}>
                   {job.status}
                 </span>
                 <span className="text-blue-200 text-sm font-medium flex items-center gap-1.5">
                   <ScrollText size={14} /> {job.experienceLevel}
                 </span>
              </div>
              <h1 className="font-display font-extrabold text-4xl md:text-5xl tracking-tight leading-tight mb-2">
                 {job.roleTitle}
              </h1>
              <p className="text-blue-100/80 text-lg max-w-2xl">
                 Manage, import, and screen your candidate pipeline for this role.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 shrink-0">
               <div className="text-center px-4">
                 <div className="text-3xl font-black">{applicants.length}</div>
                 <div className="text-[10px] uppercase tracking-widest text-blue-200 font-bold mt-1">Total Applicants</div>
               </div>
               <div className="w-px h-12 bg-white/20" />
               <div className="text-center px-4">
                 <div className="text-3xl font-black">{job.shortlistSize}</div>
                 <div className="text-[10px] uppercase tracking-widest text-blue-200 font-bold mt-1">Goal</div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Draft Warning Banner ─── */}
      {isDraft && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Zap size={24} className="text-amber-600 fill-amber-600" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 text-sm">Action Required: Publish Job Posting</h4>
            <p className="text-amber-700 text-xs mt-0.5">
              This job is currently in Draft mode. You must finish the job setup and open it to enable applicant management and AI screening.
            </p>
          </div>
          <button 
            onClick={() => router.push(`/jobs/${id}/edit`)}
            className="ml-auto px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all"
          >
            Finish Job & Open →
          </button>
        </div>
      )}

      {/* ─── Toolbar ─── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text3)]" size={18} />
            <input 
              type="text"
              placeholder="Search applicants..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-[var(--border2)] rounded-2xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-sm"
            />
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-white border border-[var(--border2)] rounded-2xl p-1 shadow-sm w-full md:w-auto overflow-x-auto">
               <button 
                 onClick={() => !isDraft && setShowManualAdd(true)}
                 disabled={isDraft}
                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                   isDraft ? "opacity-40 cursor-not-allowed grayscale" : "hover:bg-gray-50 text-gray-700"
                 }`}
                 title={isDraft ? "Finish job to enable adding applicants" : ""}
               >
                 <UserPlus size={16} /> Add Manually
               </button>
               <button 
                 onClick={() => !isDraft && setShowImport(true)}
                 disabled={isDraft}
                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                   isDraft ? "opacity-40 cursor-not-allowed grayscale" : "hover:bg-gray-50 text-gray-700"
                 }`}
                 title={isDraft ? "Finish job to enable importing applicants" : ""}
               >
                 <Upload size={16} /> Import Resumes/CSV
               </button>
            </div>

            <button 
              onClick={handleScreenAll}
              disabled={screening || applicants.length === 0 || isDraft}
              className={`btn flex-1 md:flex-none h-12 px-6 rounded-2xl whitespace-nowrap transition-all ${
                isDraft ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200" : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
              }`}
            >
              {screening ? (
                <svg className="animate-spin mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : <Zap size={18} className="mr-2" />}
              {screening ? "Screening..." : "Screen All"}
            </button>
         </div>
      </div>

      {/* ─── Main Content ─── */}
      {appsLoading && applicants.length === 0 ? (
        <div className="py-20 flex justify-center"><LoadingSpinner /></div>
      ) : applicants.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-[var(--border2)] rounded-3xl p-12 text-center shadow-sm max-w-4xl mx-auto">
           <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-3">
             <Users size={32} className="text-blue-600" />
           </div>
           <h2 className="font-display font-extrabold text-2xl text-gray-900 mb-3">No Applicants Yet</h2>
           <p className="text-gray-500 mb-10 max-w-lg mx-auto">
             Your applicant pipeline is currently empty. You can manually create candidate profiles using our structured wizard, or bulk import them from external sources.
           </p>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <button 
                onClick={() => setShowManualAdd(true)}
                className="group p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex flex-col items-center text-center gap-4"
              >
                 <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <UserPlus size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 mb-1">Add Applicant Manually</h3>
                   <p className="text-sm text-gray-500">Create a rich, structured profile using our 7-step onboarding wizard for highest AI accuracy.</p>
                 </div>
              </button>

              <button 
                onClick={() => setShowImport(true)}
                className="group p-6 rounded-2xl border-2 border-dashed border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center text-center gap-4"
              >
                 <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                   <Upload size={24} />
                 </div>
                 <div>
                   <h3 className="font-bold text-gray-900 mb-1">Import Resumes or CSV</h3>
                   <p className="text-sm text-gray-500">Upload PDF resumes directly or drag-and-drop a CSV file to bulk import hundreds of candidates instantly.</p>
                 </div>
              </button>
           </div>
        </div>
      ) : (
        /* Applicant Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredApplicants.map(app => {
             const colors = [
               { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', avatar: 'from-red-500 to-rose-600' },
               { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', avatar: 'from-orange-500 to-amber-600' },
               { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', avatar: 'from-amber-400 to-orange-500' },
               { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', avatar: 'from-emerald-500 to-green-600' },
               { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', avatar: 'from-teal-500 to-emerald-600' },
               { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', avatar: 'from-cyan-500 to-blue-500' },
               { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', avatar: 'from-blue-500 to-indigo-600' },
               { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', avatar: 'from-indigo-500 to-violet-600' },
               { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', avatar: 'from-purple-500 to-fuchsia-600' },
               { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', avatar: 'from-pink-500 to-rose-600' },
             ];
             
             const getHash = (str: string) => {
               let hash = 0;
               for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
               return Math.abs(hash);
             };
             
             const appColor = colors[getHash(app.firstName + app.lastName) % colors.length];

             return (
               <div 
                 key={app._id} 
                 className="group bg-white rounded-3xl p-6 border border-gray-100 hover:border-transparent hover:shadow-2xl hover:shadow-blue-900/10 transition-all duration-300"
               >
                  <div className="flex items-start justify-between mb-5">
                     <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${appColor.avatar} shadow-sm flex items-center justify-center text-white font-display font-bold text-xl group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                        {app.firstName[0]}{app.lastName[0]}
                     </div>
                     <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                       app.source.toLowerCase() === 'external' ? 'bg-amber-50 text-amber-600 border-amber-200/50' : 'bg-blue-50 text-blue-600 border-blue-200/50'
                     }`}>
                       {app.source}
                     </span>
                  </div>
                  
                  <h3 className="font-bold text-lg text-gray-900 mb-1 truncate group-hover:text-blue-600 transition-colors">{app.firstName} {app.lastName}</h3>
                  <p className="text-sm font-medium text-gray-500 mb-4 truncate">{app.currentRole || "Candidate"}</p>
                  
                  <div className="space-y-3 p-4 rounded-2xl bg-gray-50/50 border border-gray-100/50">
                     <div className="flex items-center gap-3 text-[13px] text-gray-600">
                       <Mail size={14} className="text-gray-400 shrink-0" />
                       <span className="truncate">{app.email}</span>
                     </div>
                     <div className="flex items-center gap-3 text-[13px] text-gray-600">
                       <ScrollText size={14} className="text-gray-400 shrink-0" />
                       {app.yearsOfExperience} Years Exp.
                     </div>
                     <div className="flex items-center gap-3 text-[13px] text-gray-600">
                       <GraduationCap size={14} className="text-gray-400 shrink-0" />
                       <span className="truncate">{app.educationLevel || "Not specified"}</span>
                     </div>
                  </div>

                  {app.skills && app.skills.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {app.skills.slice(0, 3).map((s: any, idx) => {
                        const skillName = typeof s === 'string' ? s : s?.name;
                        if (!skillName) return null;
                        const skillColor = colors[getHash(skillName) % colors.length];
                        return (
                          <span key={typeof s === 'string' ? s : (s._id || idx)} className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border ${skillColor.bg} ${skillColor.text} ${skillColor.border}`}>
                            {skillName}
                          </span>
                        );
                      })}
                      {app.skills.length > 3 && (
                        <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] font-bold text-gray-500">
                          +{app.skills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
               </div>
             );
           })}
           {filteredApplicants.length === 0 && search && (
             <div className="col-span-full py-12 text-center text-gray-500">
               No applicants match your search &quot;{search}&quot;.
             </div>
           )}
        </div>
      )}

      </div>

      {/* Modals */}
      <ProfileWizardModal 
        open={showManualAdd}
        jobId={id}
        jobTitle={job.roleTitle}
        onClose={() => setShowManualAdd(false)}
        onSuccess={() => {
          setShowManualAdd(false);
          dispatch(fetchApplicantsByJob(id));
        }}
      />

      <ImportCandidateModal 
        open={showImport}
        jobId={id}
        onClose={() => setShowImport(false)}
      />
    </>
  );
}
