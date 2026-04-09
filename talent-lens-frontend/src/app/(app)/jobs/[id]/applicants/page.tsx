"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchApplicantsByJob, addUmuravaApplicant, addExternalApplicant, setParsedPreview, clearParsedPreview } from "@/lib/slices/applicantsSlice";
import { fetchJobById, updateJobStatus } from "@/lib/slices/jobsSlice";
import { screenAll } from "@/lib/slices/screeningSlice";
import { Applicant, EducationLevel, ParsedApplicantRow } from "@/lib/types";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Upload, FileText, Zap, User } from "lucide-react";

export default function JobApplicantsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const dispatch = useAppDispatch();

  const job = useAppSelector(s => s.jobs.selected);
  const { items: applicants, loading: appsLoading, parsedPreview } = useAppSelector(s => s.applicants);
  
  const [activeTab, setActiveTab] = useState<"umurava" | "external">("umurava");
  const [screening, setScreening] = useState(false);

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
      // Rollback to open if failed
      if (job?.status === "Open") await dispatch(updateJobStatus({ id, status: "Open" }));
      setScreening(false);
    }
  };

  if (!job) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto stagger pb-20 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl tracking-tight mb-2" style={{ color: "var(--text)" }}>
             Applicants for {job.roleTitle}
          </h1>
          <p className="text-sm" style={{ color: "var(--text3)" }}>
             {applicants.length} total applicants ready for ingestion.
          </p>
        </div>
        <button 
          className="btn btn-primary animate-pulse-subtle h-11 md:h-12 px-5 md:px-6 shadow-sm w-full sm:w-auto"
          onClick={handleScreenAll}
          disabled={screening || applicants.length === 0}
        >
          {screening ? (
            <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : <Zap size={18} className="mr-2" />}
          {screening ? "Screening..." : "Screen All Applicants"}
        </button>
      </div>

      {/* Forms Area */}
      <div className="rounded-2xl p-7" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        
        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-[var(--border)] mb-6 -mt-2">
           <button 
             className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === "umurava" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text3)] hover:text-[var(--text2)]"}`}
             onClick={() => setActiveTab("umurava")}
           >
             Umurava Platform
           </button>
           <button 
             className={`pb-4 px-2 text-sm font-bold border-b-2 transition-all ${activeTab === "external" ? "border-[var(--accent)] text-[var(--accent)]" : "border-transparent text-[var(--text3)] hover:text-[var(--text2)]"}`}
             onClick={() => setActiveTab("external")}
           >
             External / Upload
           </button>
        </div>

        {activeTab === "umurava" ? <UmuravaForm jobId={id} /> : <ExternalForm jobId={id} />}

      </div>

      {/* Applicant List */}
      <div>
        <h2 className="text-xl font-bold font-display mb-4" style={{ color: "var(--text)" }}>Imported Applicants</h2>
        {appsLoading && applicants.length === 0 ? (
          <LoadingSpinner />
        ) : applicants.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-[var(--border)] text-[var(--text3)]">
            No applicants imported yet. Use the form above to add some!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {applicants.map(app => (
               <div key={app._id} className="p-4 rounded-xl flex items-center gap-4" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--surface3)] text-[var(--text2)]">
                     <User size={18} />
                  </div>
                  <div>
                    <div className="font-bold text-[var(--text)]">{app.firstName} {app.lastName}</div>
                    <div className="text-xs text-[var(--text3)]">{app.email} • {app.currentRole || "Candidate"}</div>
                  </div>
                  <div className="ml-auto text-xs px-2 py-1 rounded bg-[var(--surface3)] border border-[var(--border)] text-[var(--text3)] uppercase font-bold tracking-widest">
                     {app.source}
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

    </div>
  );
}

// ─── Umurava Form ─────────────────────────────────────────────────────────────

function UmuravaForm({ jobId }: { jobId: string }) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    skillsStr: "",
    yearsOfExperience: 0,
    educationLevel: "Bachelor" as EducationLevel,
    currentRole: "",
    umuravaId: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const payload = {
      jobId, ...form,
      skills: form.skillsStr.split(",").map(s => s.trim()).filter(Boolean),
      profileData: { umuravaId: form.umuravaId }
    };
    
    try {
      const res = await dispatch(addUmuravaApplicant(payload));
      if (addUmuravaApplicant.fulfilled.match(res)) {
        toast.success("Umurava applicant added!");
        setForm({ firstName: "", lastName: "", email: "", phone: "", skillsStr: "", yearsOfExperience: 0, educationLevel: "Bachelor", currentRole: "", umuravaId: "" });
      } else {
        toast.error(res.payload as string);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" value={form.firstName} onChange={(v: string) => setForm({...form, firstName: v})} required />
        <Input label="Last Name" value={form.lastName} onChange={(v: string) => setForm({...form, lastName: v})} required />
        <Input label="Email" type="email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} required />
        <Input label="Phone (optional)" value={form.phone} onChange={(v: string) => setForm({...form, phone: v})} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
         <Input label="Current Role" value={form.currentRole} onChange={(v: string) => setForm({...form, currentRole: v})} />
         <Input label="Umurava Profile ID" value={form.umuravaId} onChange={(v: string) => setForm({...form, umuravaId: v})} />
      </div>
      <Input label="Skills (comma separated)" placeholder="React, Node, UX" value={form.skillsStr} onChange={(v: string) => setForm({...form, skillsStr: v})} required />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase">
           Years of Exp
           <input type="number" min="0" value={form.yearsOfExperience} onChange={e => setForm({...form, yearsOfExperience: parseInt(e.target.value)||0})} className="w-full mt-1 px-3 py-2 border rounded-lg bg-transparent border-[var(--border)] text-[var(--text)]" required />
        </label>
        <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase">
           Education Label
           <select value={form.educationLevel} onChange={e => setForm({...form, educationLevel: e.target.value as EducationLevel})} className="w-full mt-1 px-3 py-2 border rounded-lg bg-transparent border-[var(--border)] text-[var(--text)]">
             <option value="High School">High School</option>
             <option value="Associate">Associate</option>
             <option value="Bachelor">Bachelor</option>
             <option value="Master">Master</option>
             <option value="PhD">PhD</option>
             <option value="Other">Other</option>
           </select>
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-outline w-full mt-4 h-12">
        {loading ? "Adding..." : "Add Umurava Candidate"}
      </button>
    </form>
  );
}

// ─── External Form ─────────────────────────────────────────────────────────────

function ExternalForm({ jobId }: { jobId: string }) {
  const dispatch = useAppDispatch();
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

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
       // Check if PDF or CSV
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
  }, [dispatch]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: {'application/pdf': ['.pdf'], 'text/csv': ['.csv']} });
  const { parsedPreview } = useAppSelector(s => s.applicants);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append("jobId", jobId);
    formData.append("firstName", form.firstName);
    formData.append("lastName", form.lastName);
    formData.append("email", form.email);
    formData.append("yearsOfExperience", String(form.yearsOfExperience));
    formData.append("educationLevel", form.educationLevel);
    if (form.resumeUrl) formData.append("resumeUrl", form.resumeUrl);
    
    // Arrays must be appended per item
    const skills = form.skillsStr.split(",").map(s => s.trim()).filter(Boolean);
    skills.forEach(s => formData.append("skills", s)); // Wait! The spec says `skills[]` or `skills`? "Skills array in FormData must be sent as multiple fields with same key e.g. formData.append("skills", "MongoDB") repeated per skill". OK! I used `skills`. However wait! `skills[]` in bash example, but `skills` in form note. We'll use `skills` based on rule 7 "formData.append('skills', 'MongoDB')".

    if (file && file.name.endsWith('.pdf')) {
       formData.append("resume", file);
    }

    try {
      const res = await dispatch(addExternalApplicant(formData));
      if (addExternalApplicant.fulfilled.match(res)) {
        toast.success("External applicant added!");
        setForm({...form, firstName: "", lastName: "", email: "", skillsStr: ""});
        setFile(null);
      } else {
        toast.error(res.payload as string);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUploadCSV = async () => {
     setLoading(true);
     let success = 0, failed = 0;
     for (const row of parsedPreview) {
        if (!row.firstName || !row.lastName || !row.email) continue;
        const fd = new FormData();
        fd.append("jobId", jobId);
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
     await dispatch(fetchApplicantsByJob(jobId));
     setLoading(false);
  };

  if (parsedPreview && parsedPreview.length > 0) {
      return (
        <div className="space-y-4 fade-in">
           <h3 className="font-bold text-lg text-[var(--text)] flex justify-between">
              CSV Preview ({parsedPreview.length} rows)
              <button className="text-red-400 text-xs hover:underline" onClick={() => dispatch(clearParsedPreview())}>Cancel Bulk</button>
           </h3>
           <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-xl bg-[var(--bg)] p-2">
             {parsedPreview.map((r, i) => (
                <div key={i} className="text-xs p-2 border-b border-[var(--border)] text-[var(--text2)] last:border-0 truncate">
                  <span className="font-bold text-[var(--text)]">{r.firstName} {r.lastName}</span> - {r.email} - Skills: {r.skills}
                </div>
             ))}
           </div>
           <button onClick={handleBulkUploadCSV} disabled={loading} className="btn btn-outline w-full h-12">
             {loading ? "Bulk Uploading..." : "Confirm & Import All"}
           </button>
        </div>
      )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 fade-in">
      <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border)] bg-[var(--bg)]'}`}>
        <input {...getInputProps()} />
        <FileText size={32} className={`mb-3 ${isDragActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]'}`} />
        <div className="font-bold text-sm text-[var(--text)]">{file ? file.name : "Drag & drop a Resume PDF or CSV"}</div>
        <div className="text-xs text-[var(--text3)] mt-1">{file ? "Click to change file" : "Max 5MB. PDF for single upload, CSV for bulk."}</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="First Name" value={form.firstName} onChange={(v: string) => setForm({...form, firstName: v})} required={!file || !file.name.endsWith('.csv')} />
        <Input label="Last Name" value={form.lastName} onChange={(v: string) => setForm({...form, lastName: v})} required={!file || !file.name.endsWith('.csv')} />
        <Input label="Email" type="email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} required={!file || !file.name.endsWith('.csv')} />
        <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase">
           Years of Exp
           <input type="number" min="0" value={form.yearsOfExperience} onChange={e => setForm({...form, yearsOfExperience: parseInt(e.target.value)||0})} className="w-full mt-1 px-3 py-2 border rounded-lg bg-transparent border-[var(--border)] text-[var(--text)]" required />
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Skills (comma separated)" placeholder="React, APIs" value={form.skillsStr} onChange={(v: string) => setForm({...form, skillsStr: v})} />
         <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase">
           Education
           <select value={form.educationLevel} onChange={e => setForm({...form, educationLevel: e.target.value as EducationLevel})} className="w-full mt-1 px-3 py-2 border rounded-lg bg-transparent border-[var(--border)] text-[var(--text)]">
             <option value="Associate">Associate</option>
             <option value="Bachelor">Bachelor</option>
             <option value="Master">Master</option>
             <option value="PhD">PhD</option>
             <option value="Other">Other</option>
           </select>
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-outline w-full h-12">
        {loading ? "Uploading..." : "Upload Single Applicant"}
      </button>
    </form>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────

function Input({ label, value, onChange, type="text", placeholder, required=false }: any) {
  return (
    <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase">
       {label}
       <input 
          type={type} 
          required={required}
          placeholder={placeholder}
          value={value} 
          onChange={e => onChange(e.target.value)} 
          className="w-full mt-1 px-3 py-2 border rounded-lg bg-transparent focus:border-[var(--accent)] border-[var(--border)] text-[var(--text)] outline-none" 
       />
    </label>
  );
}
