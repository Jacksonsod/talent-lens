"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import { addExternalApplicant, setParsedPreview, clearParsedPreview } from "@/lib/slices/applicantsSlice";
import { ParsedApplicantRow, EducationLevel } from "@/lib/types";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { UploadCloud, FileText, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { items: jobs, loading: jobsLoading } = useAppSelector(s => s.jobs);
  const { parsedPreview } = useAppSelector(s => s.applicants);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [file, setFile] = useState<File | null>(null);
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    skillsStr: "",
    yearsOfExperience: 0,
    educationLevel: "Bachelor" as EducationLevel,
    resumeUrl: ""
  });

  useEffect(() => {
    dispatch(fetchJobs());
  }, [dispatch]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedJobId) {
       toast.error("Please select a job first.");
       return;
    }

    if (acceptedFiles[0]) {
       const f = acceptedFiles[0];
       if (f.name.endsWith('.pdf')) {
          setFile(f);
       } else if (f.name.endsWith('.csv')) {
          Papa.parse(f, {
            header: true,
            complete: (results) => {
              dispatch(setParsedPreview(results.data as ParsedApplicantRow[]));
              toast.success(`Parsed ${results.data.length} rows`);
            }
          });
       } else {
          toast.error("Only PDF or CSV formats allowed.");
       }
    }
  }, [dispatch, selectedJobId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'application/pdf': ['.pdf'], 'text/csv': ['.csv']} });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJobId) return toast.error("Select a job first");
    setLoading(true);

    const formData = new FormData();
    formData.append("jobId", selectedJobId);
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("email", form.email);
    formData.append("yearsOfExperience", String(form.yearsOfExperience));
    formData.append("educationLevel", form.educationLevel);
    if (form.resumeUrl) formData.append("resumeUrl", form.resumeUrl);
    
    const skills = form.skillsStr.split(",").map(s => s.trim()).filter(Boolean);
    skills.forEach(s => formData.append("skills", s));

    if (file && file.name.endsWith('.pdf')) {
       formData.append("resume", file);
    }

    try {
      const res = await dispatch(addExternalApplicant(formData));
      if (addExternalApplicant.fulfilled.match(res)) {
        toast.success("External applicant added!");
        router.push(`/jobs/${selectedJobId}/applicants`);
      } else {
        toast.error(res.payload as string || "Upload failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUploadCSV = async () => {
     if (!selectedJobId) return;
     setLoading(true);
     let success = 0, failed = 0;
     for (const row of parsedPreview) {
        if (!row.firstName || !row.lastName || !row.email) continue;
        const fd = new FormData();
        fd.append("jobId", selectedJobId);
        fd.append("firstName", row.firstName);
        fd.append("lastName", row.lastName);
        fd.append("email", row.email);
        fd.append("yearsOfExperience", String(row.yearsOfExperience || 0));
        fd.append("educationLevel", row.educationLevel || "Bachelor");
        
        const sks = (row.skills || "").split(",").map(s => s.trim()).filter(Boolean);
        sks.forEach(s => fd.append("skills", s));

        const res = await dispatch(addExternalApplicant(fd));
        if (addExternalApplicant.fulfilled.match(res)) success++;
        else failed++;
     }
     toast.success(`Imported ${success} candidates. ${failed ? failed + ' failed.' : ''}`);
     dispatch(clearParsedPreview());
     setLoading(false);
     router.push(`/jobs/${selectedJobId}/applicants`);
  };

  if (jobsLoading) return <LoadingSpinner />;

  return (
    <div className="stagger max-w-4xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Global Applicant Upload
        </h1>
        <p className="text-sm" style={{ color: "var(--text3)" }}>
          Ingest talent into any active job posting directly via PDF or CSV batch processing.
        </p>
      </div>

      <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
         {/* Job Selection */}
         <div className="mb-8">
            <label className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase mb-3" style={{ color: "var(--text2)" }}>
               <Briefcase size={16} /> Target Job Posting
            </label>
            <select
               value={selectedJobId}
               onChange={(e) => setSelectedJobId(e.target.value)}
               className="w-full px-4 py-3 rounded-xl border focus:border-[var(--accent)] outline-none transition-all duration-200 cursor-pointer appearance-none text-base"
               style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
               <option value="" disabled>-- Select a Job to ingest into --</option>
               {jobs.filter(j => j.status !== "Closed").map(j => (
                  <option key={j._id} value={j._id}>{j.roleTitle} ({j.status})</option>
               ))}
            </select>
         </div>

         {!selectedJobId ? (
            <div className="text-center py-12 text-[var(--text3)] border-t border-[var(--border)]">
               Select a job above to reveal upload capabilities.
            </div>
         ) : parsedPreview && parsedPreview.length > 0 ? (
            <div className="space-y-4 fade-in pt-6 border-t border-[var(--border)]">
               <h3 className="font-bold text-lg text-[var(--text)] flex justify-between">
                  CSV Preview ({parsedPreview.length} rows ready)
                  <button className="text-red-400 text-xs hover:underline" onClick={() => dispatch(clearParsedPreview())}>Cancel Bulk</button>
               </h3>
               <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-xl bg-[var(--bg)] p-2">
                 {parsedPreview.map((r, i) => (
                    <div key={i} className="text-xs p-2 border-b border-[var(--border)] text-[var(--text2)] last:border-0 truncate">
                      <span className="font-bold text-[var(--text)]">{r.firstName} {r.lastName}</span> - {r.email} - Skills: {r.skills}
                    </div>
                 ))}
               </div>
               <button onClick={handleBulkUploadCSV} disabled={loading} className="btn btn-primary w-full h-12 text-base shadow-sm">
                 {loading ? "Bulk Uploading..." : "Confirm & Import All into Selected Job"}
               </button>
            </div>
         ) : (
            <form onSubmit={handleSubmit} className="space-y-6 fade-in pt-6 border-t border-[var(--border)]">
              <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border)] bg-[var(--surface2)]'}`}>
                <input {...getInputProps()} />
                <UploadCloud size={32} className={`mb-3 ${isDragActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]'}`} />
                <div className="font-bold text-base text-[var(--text)]">{file ? file.name : "Drag & drop a Resume PDF or standard CSV"}</div>
                <div className="text-sm text-[var(--text3)] mt-1">{file ? "Click to redefine payload" : "Max 5MB. Parses CSV headers automatically."}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="First Name" value={form.firstName} onChange={(v: string) => setForm({...form, firstName: v})} required={!file || !file.name.endsWith('.csv')} />
                <Input label="Last Name" value={form.lastName} onChange={(v: string) => setForm({...form, lastName: v})} required={!file || !file.name.endsWith('.csv')} />
                <Input label="Email Address" type="email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} required={!file || !file.name.endsWith('.csv')} />
                <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase tracking-widest pl-1">
                   Years of Experience
                   <input type="number" min="0" value={form.yearsOfExperience} onChange={e => setForm({...form, yearsOfExperience: parseInt(e.target.value)||0})} className="w-full mt-1 px-4 py-3 border rounded-xl bg-transparent border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] transition-all outline-none" required />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Skill Tags (comma separated)" placeholder="React, APIs, Sales" value={form.skillsStr} onChange={(v: string) => setForm({...form, skillsStr: v})} />
                 <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase tracking-widest pl-1">
                   Education Qualification
                   <select value={form.educationLevel} onChange={e => setForm({...form, educationLevel: e.target.value as EducationLevel})} className="w-full mt-1 px-4 py-3 border rounded-xl bg-transparent border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] transition-all outline-none appearance-none">
                     <option value="Associate">Associate Degree</option>
                     <option value="Bachelor">Bachelor's Degree</option>
                     <option value="Master">Master's Degree</option>
                     <option value="PhD">PhD / Doctorate</option>
                     <option value="Other">Other Certificate</option>
                   </select>
                </label>
              </div>

              <button type="submit" disabled={loading} className="btn btn-outline w-full h-14 text-base font-bold shadow-sm">
                {loading ? "Transmitting payload..." : "Upload Applicant to Job"}
              </button>
            </form>
         )}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type="text", placeholder, required=false }: any) {
  return (
    <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase tracking-widest pl-1">
       {label}
       <input 
          type={type} 
          required={required}
          placeholder={placeholder}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="w-full mt-1 px-4 py-3 border rounded-xl bg-transparent focus:border-[var(--accent)] border-[var(--border)] text-[var(--text)] outline-none transition-all" 
       />
    </label>
  );
}
