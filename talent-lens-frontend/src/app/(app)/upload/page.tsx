"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import { addExternalApplicant, bulkUploadExternalApplicants, setParsedPreview, clearParsedPreview } from "@/lib/slices/applicantsSlice";
import { screenAll } from "@/lib/slices/screeningSlice";
import { ParsedApplicantRow, EducationLevel } from "@/lib/types";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { UploadCloud, FileText, Briefcase, FileSignature, X, Database, Wand2, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { items: jobs, loading: jobsLoading } = useAppSelector(s => s.jobs);
  const { parsedPreview } = useAppSelector(s => s.applicants);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [importMode, setImportMode] = useState<"pdf" | "data">("pdf");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  
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

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];
      
      const mappedData: ParsedApplicantRow[] = json.map(row => ({
        firstName: row.firstName || row.FirstName || "",
        lastName: row.lastName || row.LastName || "",
        email: row.email || row.Email || "",
        currentRole: row.currentRole || row.Role || "",
        yearsOfExperience: row.yearsOfExperience || row.Experience || 0,
        skills: row.skills || row.Skills || "",
        educationLevel: row.educationLevel || row.Education || "Bachelor"
      }));

      dispatch(setParsedPreview(mappedData));
      toast.success(`Successfully parsed ${mappedData.length} records from Excel.`);
      setFiles([]);
    };
    reader.readAsBinaryString(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (!selectedJobId) {
       toast.error("Please select a job first.");
       return;
    }

    if (importMode === "data") {
      const dataFile = acceptedFiles.find(f => f.name.endsWith('.csv') || f.name.endsWith('.xlsx') || f.name.endsWith('.xls'));
      if (!dataFile) return toast.error("Only CSV or Excel formats allowed in this mode.");

      if (dataFile.name.endsWith('.csv')) {
        Papa.parse(dataFile, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            dispatch(setParsedPreview(results.data as ParsedApplicantRow[]));
            toast.success(`Parsed ${results.data.length} rows from CSV`);
            setFiles([]);
          }
        });
      } else {
        parseExcel(dataFile);
      }
    } else {
      const newPdfs = acceptedFiles.filter(f => f.name.endsWith('.pdf'));
      if (newPdfs.length === 0) return toast.error("Only PDF resumes allowed in AI Extraction mode.");
      setFiles(prev => [...prev, ...newPdfs]);
    }
  }, [dispatch, selectedJobId, importMode]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: importMode === "pdf" 
      ? { 'application/pdf': ['.pdf'] } 
      : { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
  });

  const downloadTemplate = () => {
    const headers = "firstName,lastName,email,currentRole,yearsOfExperience,skills,educationLevel\nJohn,Doe,john@example.com,Developer,5,\"React, Node, SQL\",Bachelor";
    const blob = new Blob([headers], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talentai_import_template.csv";
    a.click();
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
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

    if (files.length === 1) {
       formData.append("resume", files[0]);
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

  const handleBulkUploadPDFs = async () => {
    if (!selectedJobId) return toast.error("Select a job first");
    setLoading(true);
    const toastId = toast.loading(`Analyzing ${files.length} resumes with AI... Please hold on...`);
    
    try {
      const formData = new FormData();
      formData.append("jobId", selectedJobId);
      files.forEach(file => formData.append("resumes", file));

      const res = await dispatch(bulkUploadExternalApplicants(formData));
      if (bulkUploadExternalApplicants.fulfilled.match(res)) {
        toast.success(`Ingested ${res.payload.successfulUploads} candidates! Initializing auto-screening...`, { id: toastId });
        
        if (res.payload.successfulUploads > 0) {
           await dispatch(screenAll(selectedJobId));
           toast.success("AI Screening completed successfully.");
        }

        setFiles([]);
        router.push(`/jobs/${selectedJobId}/applicants`);
      } else {
        toast.error(res.payload as string || "Bulk upload failed", { id: toastId });
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
          Ingest talent into any active job posting directly via single entry, PDF bulk extraction, or CSV sheet mapping.
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
               onChange={(e) => {
                 setSelectedJobId(e.target.value);
                 if (parsedPreview.length > 0) dispatch(clearParsedPreview());
                 if (files.length > 0) setFiles([]);
               }}
               className="w-full px-4 py-3 rounded-xl border focus:border-[var(--accent)] outline-none transition-all duration-200 cursor-pointer appearance-none text-base font-medium"
               style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
            >
               <option value="" disabled>-- Select a Job to ingest into --</option>
               {jobs.filter(j => j.status !== "Closed").map(j => (
                  <option key={j._id} value={j._id}>{j.roleTitle}</option>
               ))}
            </select>
         </div>

         {!selectedJobId ? (
            <div className="text-center py-12 px-6 rounded-xl text-[var(--text3)] border border-dashed border-[var(--border)] bg-[var(--surface2)]">
               <Briefcase className="opacity-20 mx-auto mb-4" size={48} />
               Select a target job requisition above to enable dropzone capabilities.
            </div>
         ) : (
          <>
            {/* Mode Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
               <button 
                className={`p-4 rounded-xl border transition-all text-left flex items-start gap-4 ${importMode === "pdf" ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border)] bg-[var(--bg)] opacity-60 hover:opacity-100'}`}
                onClick={() => {
                  setImportMode("pdf");
                  dispatch(clearParsedPreview());
                }}
               >
                 <div className={`p-2.5 rounded-lg ${importMode === "pdf" ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface3)] text-[var(--text2)]'}`}>
                    <Wand2 size={20} />
                 </div>
                 <div>
                    <div className="font-bold text-sm text-[var(--text)]">AI Resume Extraction</div>
                    <div className="text-[11px] text-[var(--text3)] mt-0.5">Bulk OCR & Data Mining</div>
                 </div>
               </button>
               <button 
                className={`p-4 rounded-xl border transition-all text-left flex items-start gap-4 ${importMode === "data" ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border)] bg-[var(--bg)] opacity-60 hover:opacity-100'}`}
                onClick={() => {
                  setImportMode("data");
                  setFiles([]);
                }}
               >
                 <div className={`p-2.5 rounded-lg ${importMode === "data" ? 'bg-[var(--accent)] text-white' : 'bg-[var(--surface3)] text-[var(--text2)]'}`}>
                    <Database size={20} />
                 </div>
                 <div>
                    <div className="font-bold text-sm text-[var(--text)]">Direct Spreadsheet</div>
                    <div className="text-[11px] text-[var(--text3)] mt-0.5">Import from CSV or Excel</div>
                 </div>
               </button>
            </div>

            {parsedPreview && parsedPreview.length > 0 ? (
                <div className="space-y-4 fade-in pt-6 border-t border-[var(--border)]">
                  <h3 className="font-bold text-lg text-[var(--text)] flex items-center justify-between">
                      Import Preview ({parsedPreview.length} rows detected)
                      <button className="text-[var(--red)] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-[rgba(255,107,107,0.1)] transition-colors" onClick={() => dispatch(clearParsedPreview())}>
                        Cancel Batch
                      </button>
                  </h3>
                  <div className="max-h-64 overflow-y-auto border border-[var(--border)] rounded-xl bg-[var(--surface2)]">
                    {parsedPreview.map((r, i) => (
                        <div key={i} className="text-sm p-3 border-b border-[var(--border)] last:border-0 truncate flex flex-col sm:flex-row gap-1 sm:gap-4">
                          <div className="font-bold text-[var(--text)] sm:w-1/4 truncate">{r.firstName} {r.lastName}</div>
                          <div className="text-[var(--text2)] sm:w-1/4 truncate">{r.email}</div>
                          <div className="text-[var(--text3)] sm:w-1/2 min-w-0 truncate italic sm:not-italic">Skills: {r.skills}</div>
                        </div>
                    ))}
                  </div>
                  <button onClick={handleBulkUploadCSV} disabled={loading} className="btn btn-green w-full h-14 text-base font-bold shadow-sm flex items-center justify-center gap-2 mt-2">
                    {loading ? <LoadingSpinner size={20} /> : <FileText size={20} />}
                    {loading ? "Transmitting payload..." : "Confirm & Import Mapping into Selected Job"}
                  </button>
                </div>
            ) : (
                <div className="space-y-6 fade-in pt-6 border-t border-[var(--border)]">
                  <div {...getRootProps()} className={`p-8 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? 'border-[var(--accent)] bg-[var(--accent-dim)]' : 'border-[var(--border)] bg-[var(--surface2)]'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud size={40} className={`mb-4 ${isDragActive ? 'text-[var(--accent)]' : 'text-[var(--text3)]'}`} strokeWidth={1.5} />
                    <div className="font-bold text-lg text-[var(--text)] text-center">
                      {importMode === "pdf" ? "Drag & drop multiple PDF resumes here" : "Drag & drop CSV or Excel data file here"}
                    </div>
                    <div className="text-sm text-[var(--text3)] mt-2 text-center max-w-md">
                      {importMode === "pdf" 
                        ? "Upload multiple PDFs for AI batch extraction. Our Gemini model will automatically map candidate details." 
                        : "Upload a single CSV or Excel (.xlsx/.xls) file to directly import candidate rows."}
                    </div>
                  </div>

                  {importMode === "data" && (
                    <div className="flex justify-center">
                      <button 
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:underline opacity-80"
                      >
                        <Download size={14} /> Download Import Template (.csv)
                      </button>
                    </div>
                  )}

              {files.length > 0 && (
                 <div className="fade-in">
                    <h3 className="text-sm font-bold tracking-widest uppercase mb-3 flex items-center justify-between text-[var(--text2)]">
                       Queued Resumes ({files.length} selected)
                       <button onClick={() => setFiles([])} className="text-[var(--red)] uppercase tracking-widest text-[10px] font-bold px-2 py-1 rounded hover:bg-[rgba(255,107,107,0.1)] transition-colors">
                         Clear Queue
                       </button>
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-6 max-h-40 overflow-y-auto p-1">
                      {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-[var(--surface2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text)] group">
                           <FileSignature size={14} className="text-[var(--accent)]" />
                           <span className="truncate max-w-[150px]">{f.name}</span>
                           <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-[var(--text3)] hover:text-[var(--red)]">
                             <X size={14} />
                           </button>
                        </div>
                      ))}
                    </div>

                    {files.length === 1 ? (
                      <form onSubmit={handleSingleSubmit} className="space-y-6 fade-in p-6 rounded-xl border border-[var(--border)] bg-[var(--surface2)]">
                        <div className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] mb-2 flex flex-col">
                           Single PDF Upload Mode
                           <span className="text-[10px] text-[var(--text3)] normal-case font-normal mt-1 leading-relaxed">
                              When uploading exactly one candidate manually, you must provide their explicit details down below. Add another PDF above to seamlessly switch into Gemini Batch AI Extraction.
                           </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="First Name" value={form.firstName} onChange={(v: string) => setForm({...form, firstName: v})} required={true} />
                          <Input label="Last Name" value={form.lastName} onChange={(v: string) => setForm({...form, lastName: v})} required={true} />
                          <Input label="Email Address" type="email" value={form.email} onChange={(v: string) => setForm({...form, email: v})} required={true} />
                          <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase tracking-widest pl-1">
                             Years of Experience
                             <input type="number" min="0" value={form.yearsOfExperience} onChange={e => setForm({...form, yearsOfExperience: parseInt(e.target.value)||0})} className="w-full mt-1 px-4 py-3 border rounded-xl bg-[var(--surface)] border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] transition-all outline-none" required />
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Input label="Skill Tags (comma separated)" placeholder="React, APIs, Sales" value={form.skillsStr} onChange={(v: string) => setForm({...form, skillsStr: v})} />
                           <label className="space-y-1 text-xs font-bold text-[var(--text2)] uppercase tracking-widest pl-1">
                             Education Qualification
                             <select value={form.educationLevel} onChange={e => setForm({...form, educationLevel: e.target.value as EducationLevel})} className="w-full mt-1 px-4 py-3 border rounded-xl bg-[var(--surface)] border-[var(--border)] focus:border-[var(--accent)] text-[var(--text)] transition-all outline-none appearance-none">
                               <option value="Associate">Associate Degree</option>
                               <option value="Bachelor">Bachelor's Degree</option>
                               <option value="Master">Master's Degree</option>
                               <option value="PhD">PhD / Doctorate</option>
                               <option value="Other">Other Certificate</option>
                             </select>
                          </label>
                        </div>

                        <button type="submit" disabled={loading} className="btn btn-outline w-full h-14 text-base font-bold shadow-sm mt-4">
                          {loading ? "Transmitting Single Context..." : "Upload Applicant to Job"}
                        </button>
                      </form>
                    ) : (
                      <button onClick={handleBulkUploadPDFs} disabled={loading || files.length === 0} className="btn btn-primary w-full h-14 text-base font-bold shadow-sm flex items-center justify-center gap-3 animate-pulse-ai shrink-0">
                         {loading ? <LoadingSpinner size={20} /> : <FileSignature size={20} />}
                         {loading ? "Analyzing Context Matrix via Gemini..." : `Extract & Ingest ${files.length} Candidates`}
                      </button>
                    )}
                  </div>
               )}
            </div>
          )}
        </>
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
          className="w-full mt-1 px-4 py-3 border rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] border-[var(--border)] text-[var(--text)] outline-none transition-all" 
       />
    </label>
  );
}
