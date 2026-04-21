"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import { addExternalApplicant, bulkUploadExternalApplicants, setParsedPreview, clearParsedPreview } from "@/lib/slices/applicantsSlice";
import { ParsedApplicantRow } from "@/lib/types";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { UploadCloud, FileText, X, Database, Wand2, UserPlus, Download, CheckCircle, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import ProfileWizardModal from "@/components/profile/ProfileWizardModal";

type Mode = "pdf" | "csv" | "profile";

export default function UploadPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const { items: jobs, loading: jobsLoading } = useAppSelector(s => s.jobs);
  const { parsedPreview } = useAppSelector(s => s.applicants);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [jobOpen, setJobOpen] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [mode, setMode] = useState<Mode>("pdf");
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [failCount, setFailCount] = useState(0);

  useEffect(() => { dispatch(fetchJobs()); }, [dispatch]);

  const selectedJob = jobs.find(j => j._id === selectedJobId);
  const openJobs = jobs.filter(j => j.status === "Open");
  const filteredJobs = openJobs.filter(j =>
    j.roleTitle.toLowerCase().includes(jobSearch.toLowerCase())
  );

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(e.target?.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws) as any[];
      const mapped: ParsedApplicantRow[] = json.map(r => ({
        firstName: r.firstName || r.FirstName || "",
        lastName: r.lastName || r.LastName || "",
        email: r.email || r.Email || "",
        phone: r.phone || "",
        currentRole: r.currentRole || r.Role || "",
        headline: r.headline || "",
        location: r.location || "",
        bio: r.bio || "",
        yearsOfExperience: r.yearsOfExperience || 0,
        skills: r.skills || r.Skills || "",
        educationLevel: r.educationLevel || "Bachelor",
      }));
      dispatch(setParsedPreview(mapped));
      toast.success(`Parsed ${mapped.length} records from Excel.`);
    };
    reader.readAsBinaryString(file);
  }, [dispatch]);

  const onDrop = useCallback((accepted: File[]) => {
    if (!selectedJobId) return toast.error("Select a job first.");
    if (mode === "csv") {
      const f = accepted[0];
      if (!f) return;
      if (f.name.endsWith(".csv")) {
        Papa.parse(f, { header: true, skipEmptyLines: true, complete: (r) => { dispatch(setParsedPreview(r.data as ParsedApplicantRow[])); toast.success(`Parsed ${r.data.length} rows`); } });
      } else parseExcel(f);
    } else {
      const pdfs = accepted.filter(f => f.name.endsWith(".pdf"));
      if (!pdfs.length) return toast.error("Only PDFs allowed.");
      setFiles(prev => [...prev, ...pdfs]);
    }
  }, [dispatch, selectedJobId, mode, parseExcel]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mode === "pdf" ? { "application/pdf": [".pdf"] } : { "text/csv": [".csv"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] }
  });

  const downloadTemplate = () => {
    const csv = "firstName,lastName,email,phone,currentRole,headline,location,bio,yearsOfExperience,skills,educationLevel\nAlice,Mutoni,alice@example.com,+250700000000,Backend Engineer,Node.js Engineer,Kigali,5yr API builder,5,\"React,Node.js\",Bachelor";
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "talentai_template.csv"; a.click();
  };

  const handleBulkPDF = async () => {
    if (!selectedJobId || !files.length) return;
    setLoading(true);
    const toastId = toast.loading(`Analyzing ${files.length} resumes with AI...`);
    const fd = new FormData();
    fd.append("jobId", selectedJobId);
    files.forEach(f => fd.append("resumes", f));
    const res = await dispatch(bulkUploadExternalApplicants(fd));
    if (bulkUploadExternalApplicants.fulfilled.match(res)) {
      setDoneCount(d => d + (res.payload.successfulUploads || 0));
      toast.success(`Ingested ${res.payload.successfulUploads} candidates!`, { id: toastId });
      setFiles([]);
      router.push(`/jobs/${selectedJobId}/applicants`);
    } else {
      setFailCount(f => f + 1);
      toast.error(res.payload as string || "Upload failed", { id: toastId });
    }
    setLoading(false);
  };

  const handleBulkCSV = async () => {
    if (!selectedJobId) return;
    setLoading(true);
    let ok = 0, fail = 0;
    for (const row of parsedPreview) {
      if (!row.firstName || !row.email) continue;
      const fd = new FormData();
      fd.append("jobId", selectedJobId);
      Object.entries(row).forEach(([k, v]) => { if (k === "skills") (v as string).split(",").map(s => s.trim()).filter(Boolean).forEach(s => fd.append("skills", s)); else if (v !== undefined && v !== null) fd.append(k, String(v)); });
      const r = await dispatch(addExternalApplicant(fd));
      addExternalApplicant.fulfilled.match(r) ? ok++ : fail++;
    }
    setDoneCount(d => d + ok); setFailCount(f => f + fail);
    toast.success(`Imported ${ok} candidates.${fail ? ` ${fail} failed.` : ""}`);
    dispatch(clearParsedPreview()); setLoading(false);
    router.push(`/jobs/${selectedJobId}/applicants`);
  };

  if (jobsLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-[1060px] mx-auto pb-20 animate-fade-up">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-5">

        {/* ─── LEFT COLUMN ─── */}
        <div>
          {/* PAGE HEADER */}
          <div className="mb-5">
            <h1 className="font-display font-extrabold text-[24px] tracking-tight text-[var(--text)] mb-1">Upload Candidates</h1>
            <p className="text-[13px] text-[var(--text3)]">Add applicants to any job via PDF resumes, CSV spreadsheet, or manual profile entry — Gemini extracts and structures data automatically.</p>
          </div>

          {/* STEP 1: JOB SELECTOR */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-3.5 focus-within:border-blue-300 transition-colors">
            <div className="flex items-center gap-2 mb-3.5">
              <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ${selectedJobId ? "bg-emerald-500" : "bg-blue-600"}`}>
                {selectedJobId ? <CheckCircle size={13} /> : "1"}
              </div>
              <span className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-wider">Select target job posting</span>
              <span className="ml-auto text-[11px] text-[var(--text3)]">{openJobs.length} jobs available</span>
            </div>

            {/* Combobox */}
            <div className="relative">
              <div
                className={`flex items-center gap-2.5 px-3.5 py-3 border-[1.5px] rounded-xl cursor-pointer transition-all ${selectedJob ? "border-blue-300 bg-blue-50" : "border-[var(--border2)] bg-[var(--surface2)] hover:border-blue-300"}`}
                onClick={() => { if (!selectedJob) setJobOpen(o => !o); }}
              >
                <span className="text-[18px]">{selectedJob ? "💻" : "🔍"}</span>
                {selectedJob ? (
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[14px] text-[var(--text)] truncate">{selectedJob.roleTitle}</div>
                    <div className="text-[11.5px] text-[var(--text3)]">{selectedJob.experienceLevel} · {selectedJob.status}</div>
                  </div>
                ) : (
                  <span className="text-[14px] text-[var(--text3)] flex-1">Search or select a job posting...</span>
                )}
                {selectedJob && (
                  <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">{selectedJob.status}</span>
                )}
                {selectedJob ? (
                  <X size={16} className="text-[var(--text3)] hover:text-red-500 cursor-pointer shrink-0" onClick={e => { e.stopPropagation(); setSelectedJobId(""); dispatch(clearParsedPreview()); setFiles([]); }} />
                ) : (
                  <ChevronDown size={14} className={`text-[var(--text3)] transition-transform ${jobOpen ? "rotate-180" : ""}`} />
                )}
              </div>

              {jobOpen && (
                <div className="absolute left-0 right-0 top-full bg-[var(--surface)] border-[1.5px] border-blue-500 border-t-0 rounded-b-xl shadow-xl z-50 max-h-[340px] overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--surface2)] border-b border-[var(--border)]">
                    <span className="text-[var(--text3)] text-[13px]">🔍</span>
                    <input autoFocus className="flex-1 bg-transparent outline-none text-[13.5px] text-[var(--text)] placeholder-[var(--text3)]" placeholder="Type to search jobs..." value={jobSearch} onChange={e => setJobSearch(e.target.value)} />
                    <span className="text-[11px] text-[var(--text3)]">{filteredJobs.length} jobs</span>
                  </div>
                  <div className="overflow-y-auto max-h-[270px]">
                    {filteredJobs.length === 0 ? (
                      <div className="p-6 text-center text-[13px] text-[var(--text3)]">No jobs match your search</div>
                    ) : filteredJobs.map(j => (
                      <div key={j._id} className="flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-[var(--border)] transition-colors" onClick={() => { setSelectedJobId(j._id); setJobSearch(""); setJobOpen(false); }}>
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-[14px] shrink-0">💻</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-[var(--text)] truncate">{j.roleTitle}</div>
                          <div className="text-[11px] text-[var(--text3)]">{j.experienceLevel} · {j.status}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${j.status === "Open" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>{j.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STEP 2: METHOD */}
          {selectedJobId && (
            <>
              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-3.5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-[22px] h-[22px] rounded-full bg-blue-600 flex items-center justify-center text-[11px] font-bold text-white shrink-0">2</div>
                  <span className="text-[11px] font-bold text-[var(--text3)] uppercase tracking-wider">Choose upload method</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <ModeTab active={mode === "pdf"} onClick={() => { setMode("pdf"); dispatch(clearParsedPreview()); }} color="blue" badge="Recommended" icon="📄" title="PDF Resumes" desc="Multiple PDFs — Gemini extracts details automatically" />
                  <ModeTab active={mode === "csv"} onClick={() => { setMode("csv"); setFiles([]); }} color="green" icon="📊" title="CSV / Excel" desc="Spreadsheet import with preview before upload" />
                  <ModeTab active={mode === "profile"} onClick={() => { setMode("profile"); setWizardOpen(true); }} color="purple" icon="👤" title="Structured Profile" desc="Full 7-step wizard for a single candidate" />
                </div>
              </div>

              {/* UPLOAD ZONE */}
              {mode !== "profile" && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 mb-3.5">

                  {/* CSV PREVIEW TABLE */}
                  {mode === "csv" && parsedPreview.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-display font-bold text-[15px] text-[var(--text)]">Import Preview</div>
                          <div className="text-[12px] text-[var(--text3)] mt-0.5">{parsedPreview.length} candidates — review before importing</div>
                        </div>
                        <button className="text-red-500 text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-50" onClick={() => dispatch(clearParsedPreview())}>Cancel</button>
                      </div>
                      <div className="border border-[var(--border)] rounded-xl overflow-hidden max-h-[280px] overflow-y-auto">
                        <table className="w-full text-left text-[12px]">
                          <thead><tr className="bg-[var(--surface2)] border-b border-[var(--border)]">
                            {["#","Name","Email","Skills","Exp","Education"].map(h => <th key={h} className="px-3 py-2 text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider">{h}</th>)}
                          </tr></thead>
                          <tbody>{parsedPreview.map((r, i) => (
                            <tr key={i} className="border-b border-[var(--border)] hover:bg-[var(--surface2)]">
                              <td className="px-3 py-2 text-[var(--text3)]">{i+1}</td>
                              <td className="px-3 py-2 font-medium text-[var(--text)]">{r.firstName} {r.lastName}</td>
                              <td className="px-3 py-2 text-blue-600">{r.email}</td>
                              <td className="px-3 py-2 text-[var(--text2)] max-w-[140px] truncate">{r.skills}</td>
                              <td className="px-3 py-2 text-[var(--text3)]">{r.yearsOfExperience}yr</td>
                              <td className="px-3 py-2"><span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10.5px] font-medium">{r.educationLevel}</span></td>
                            </tr>
                          ))}</tbody>
                        </table>
                      </div>
                      <button onClick={handleBulkCSV} disabled={loading} className="w-full mt-4 h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all disabled:opacity-50">
                        {loading ? <LoadingSpinner size={18} /> : <FileText size={16} />}
                        {loading ? "Importing..." : `Import ${parsedPreview.length} Candidates`}
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* DROPZONE */}
                      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl py-9 px-5 text-center cursor-pointer transition-all ${isDragActive ? "border-blue-500 bg-blue-50" : "border-[var(--border2)] hover:border-blue-400 hover:bg-[var(--surface2)]"}`}>
                        <input {...getInputProps()} />
                        <div className="text-[32px] mb-2.5">{mode === "pdf" ? "📂" : "📊"}</div>
                        <div className="font-display font-bold text-[15px] text-[var(--text)] mb-1.5">{mode === "pdf" ? "Drag & drop PDF resumes here" : "Drop your CSV or Excel file"}</div>
                        <div className="text-[12px] text-[var(--text3)] max-w-xs mx-auto leading-snug">{mode === "pdf" ? "Gemini extracts candidate details from each PDF automatically" : "Preview all parsed candidates before confirming import"}</div>
                        <div className="flex gap-1.5 justify-center mt-2.5 flex-wrap">
                          {(mode === "pdf" ? ["PDF only", "Max 5MB each", "Up to 50 files"] : [".csv", ".xlsx", "firstName, lastName, email, skills"]).map(t => (
                            <span key={t} className="text-[10.5px] px-2.5 py-0.5 rounded-full border border-[var(--border2)] text-[var(--text3)] bg-[var(--surface2)]">{t}</span>
                          ))}
                        </div>
                      </div>

                      {/* CSV TEMPLATE */}
                      {mode === "csv" && (
                        <div className="flex items-center justify-between mt-3 p-3.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl">
                          <div>
                            <div className="text-[12px] font-bold text-[var(--text)]">Need a template?</div>
                            <div className="text-[11px] text-[var(--text3)] mt-0.5">Download CSV with all supported columns pre-defined</div>
                          </div>
                          <button onClick={downloadTemplate} className="flex items-center gap-1.5 text-[12px] font-bold px-3.5 py-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shrink-0">
                            <Download size={13} /> Download Template
                          </button>
                        </div>
                      )}

                      {/* PDF FILE LIST */}
                      {mode === "pdf" && files.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 px-3 py-2.5 bg-[var(--surface2)] border border-[var(--border)] rounded-xl">
                              <span className="text-[16px]">📄</span>
                              <span className="text-[12.5px] font-medium text-[var(--text)] flex-1 truncate">{f.name}</span>
                              <span className="text-[10.5px] text-[var(--text3)]">{(f.size/1024).toFixed(0)}KB</span>
                              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Ready</span>
                              <X size={14} className="cursor-pointer text-[var(--text3)] hover:text-red-500" onClick={() => setFiles(files.filter((_, idx) => idx !== i))} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* SUBMIT */}
              {mode === "pdf" && files.length > 0 && (
                <button onClick={handleBulkPDF} disabled={loading} className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 mb-2">
                  {loading ? <LoadingSpinner size={18} /> : <UploadCloud size={16} />}
                  {loading ? "Extracting with Gemini..." : `Upload & Extract ${files.length} PDF${files.length !== 1 ? "s" : ""} with Gemini`}
                </button>
              )}
            </>
          )}
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="flex flex-col gap-3">

          {/* Upload Summary */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[17px_19px]">
            <div className="font-display font-bold text-[13px] flex items-center gap-1.5 mb-3">📈 Upload Summary</div>
            {[
              { label: "Ready to upload", val: mode === "pdf" ? files.length : parsedPreview.length, color: "text-blue-600" },
              { label: "Successfully added", val: doneCount, color: "text-emerald-600" },
              { label: "Failed / skipped", val: failCount, color: "text-red-500" },
              { label: "Duplicates ignored", val: 0, color: "text-amber-600" },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                <span className="text-[12.5px] text-[var(--text2)]">{label}</span>
                <span className={`font-display font-bold text-[15px] ${color}`}>{val}</span>
              </div>
            ))}
          </div>



          {/* Tips */}
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-[17px_19px]">
            <div className="font-display font-bold text-[13px] flex items-center gap-1.5 mb-3">💡 Upload Tips</div>
            {[
              "PDFs with text content extract better than scanned images",
              "CSV must include firstName, lastName, email, skills",
              "Duplicate emails for the same job are automatically skipped",
              "Use Structured Profile for detailed manual candidate entry",
            ].map((t, i) => (
              <div key={i} className="flex gap-2 mb-2.5 last:mb-0 items-start">
                <div className="w-[18px] h-[18px] rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div>
                <div className="text-[12px] text-[var(--text2)] leading-snug">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Wizard Modal */}
      <ProfileWizardModal
        open={wizardOpen}
        jobId={selectedJobId}
        jobTitle={selectedJob?.roleTitle}
        onClose={() => { setWizardOpen(false); setMode("pdf"); }}
        onSuccess={() => { setWizardOpen(false); router.push(`/jobs/${selectedJobId}/applicants`); }}
      />
    </div>
  );
}

function ModeTab({ active, onClick, color, badge, icon, title, desc }: { active: boolean; onClick: () => void; color: string; badge?: string; icon: string; title: string; desc: string; }) {
  const colors: Record<string, string> = { blue: "border-blue-400 bg-blue-50", green: "border-emerald-400 bg-emerald-50", purple: "border-purple-400 bg-purple-50" };
  return (
    <div onClick={onClick} className={`relative p-[14px_16px] rounded-xl border-[1.5px] cursor-pointer transition-all ${active ? colors[color] : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border2)]"}`}>
      {badge && <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-600 text-white uppercase tracking-wider">{badge}</span>}
      <div className="text-[20px] mb-2">{icon}</div>
      <div className="font-bold text-[13px] text-[var(--text)] mb-0.5">{title}</div>
      <div className="text-[11px] text-[var(--text3)] leading-snug">{desc}</div>
    </div>
  );
}
