"use client";

import React, { useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { addExternalApplicant, bulkUploadExternalApplicants, setParsedPreview, clearParsedPreview, fetchApplicantsByJob } from "@/lib/slices/applicantsSlice";
import { ParsedApplicantRow } from "@/lib/types";
import toast from "react-hot-toast";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { UploadCloud, FileText, X, Database, Wand2, FileSignature, Download } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Props {
  open: boolean;
  jobId: string;
  onClose: () => void;
}

export default function ImportCandidateModal({ open, jobId, onClose }: Props) {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [importMode, setImportMode] = useState<"pdf" | "data">("pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimate(true));
      document.body.style.overflow = "hidden";
    } else {
      setAnimate(false);
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(() => {
      onClose();
      dispatch(clearParsedPreview());
      setFiles([]);
      setImportMode("pdf");
    }, 200);
  };

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet) as any[];
      
      const mappedData: ParsedApplicantRow[] = json.map(row => ({
        firstName: row.firstName || row.FirstName || row.first_name || "",
        lastName: row.lastName || row.LastName || row.last_name || "",
        email: row.email || row.Email || "",
        phone: row.phone || row.Phone || "",
        currentRole: row.currentRole || row.Role || row.role || "",
        headline: row.headline || row.Headline || row.title || "",
        location: row.location || row.Location || row.city || "",
        bio: row.bio || row.Bio || row.summary || "",
        yearsOfExperience: row.yearsOfExperience || row.Experience || row.years || 0,
        skills: row.skills || row.Skills || "",
        educationLevel: row.educationLevel || row.Education || row.degree || "Bachelor"
      }));

      dispatch(setParsedPreview(mappedData));
      toast.success(`Successfully parsed ${mappedData.length} records from Excel.`);
      setFiles([]);
    };
    reader.readAsBinaryString(file);
  }, [dispatch]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
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
  }, [dispatch, importMode, parseExcel]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: importMode === "pdf" 
      ? { 'application/pdf': ['.pdf'] } 
      : { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'], 'application/vnd.ms-excel': ['.xls'] }
  });

  const { parsedPreview } = useAppSelector(s => s.applicants);

  const downloadTemplate = () => {
    const headers = [
      "firstName", "lastName", "email", "phone", "currentRole",
      "headline", "location", "bio", "yearsOfExperience", "skills", "educationLevel"
    ].join(",");
    const example = [
      "Alice", "Mutoni", "alice@example.com", "+250 700 000 000", "Backend Engineer",
      "Node.js & AI Systems Engineer", "Kigali Rwanda", "5 years building distributed APIs",
      "5", '"React, Node.js, Python, Docker"', "Bachelor"
    ].join(",");
    const csv = headers + "\n" + example;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "talentai_import_template.csv";
    a.click();
  };

  const handleBulkUploadPDFs = async () => {
    setLoading(true);
    const toastId = toast.loading(`Analyzing ${files.length} resumes with AI... Please hold on...`);
    
    try {
      const formData = new FormData();
      formData.append("jobId", jobId);
      files.forEach(file => formData.append("resumes", file));

      const res = await dispatch(bulkUploadExternalApplicants(formData));
      if (bulkUploadExternalApplicants.fulfilled.match(res)) {
        toast.success(`Ingested ${res.payload.successfulUploads} candidates successfully!`, { id: toastId });
        setFiles([]);
        dispatch(fetchApplicantsByJob(jobId));
        handleClose();
      } else {
        toast.error(res.payload as string || "Bulk upload failed", { id: toastId });
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
        if (row.phone) fd.append("phone", row.phone);
        if (row.headline) fd.append("headline", row.headline);
        if (row.location) fd.append("location", row.location);
        if (row.bio) fd.append("bio", row.bio);
        if (row.currentRole) fd.append("currentRole", row.currentRole);
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
     dispatch(fetchApplicantsByJob(jobId));
     setLoading(false);
     handleClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-opacity duration-200"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", opacity: animate ? 1 : 0 }}
        onClick={handleClose}
      />

      {/* Modal Content */}
      <div
        className="relative w-full max-w-3xl bg-[var(--surface)] rounded-[2rem] shadow-2xl overflow-hidden transition-all duration-300 flex flex-col max-h-[90vh]"
        style={{
          transform: animate ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
          opacity: animate ? 1 : 0,
        }}
      >
        <div className="flex items-center justify-between p-8 border-b border-[var(--border)]">
          <div>
             <h2 className="text-2xl font-display font-extrabold text-[var(--text)] tracking-tight">Import Candidates</h2>
             <p className="text-[15px] text-[var(--text2)] mt-1">Bulk upload resumes for AI extraction, or import structured data.</p>
          </div>
          <button onClick={handleClose} className="p-2.5 rounded-full hover:bg-[var(--surface2)] text-[var(--text3)] transition-all">
            <X size={22} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar">
            {/* Mode Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
               <button 
                className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${importMode === "pdf" ? 'border-blue-500 bg-blue-50/50 shadow-sm shadow-blue-500/10' : 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-100'}`}
                onClick={() => {
                  setImportMode("pdf");
                  dispatch(clearParsedPreview());
                }}
               >
                 <div className={`p-3 rounded-xl ${importMode === "pdf" ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                    <Wand2 size={24} />
                 </div>
                 <div>
                    <div className="font-bold text-gray-900 text-[15px]">AI Batch Extraction</div>
                    <div className="text-[13px] text-gray-500 mt-1">Upload multiple PDFs for auto parsing.</div>
                 </div>
               </button>

               <button 
                className={`p-5 rounded-2xl border-2 transition-all text-left flex items-start gap-4 ${importMode === "data" ? 'border-indigo-500 bg-indigo-50/50 shadow-sm shadow-indigo-500/10' : 'border-gray-100 bg-gray-50 opacity-70 hover:opacity-100'}`}
                onClick={() => {
                  setImportMode("data");
                  setFiles([]);
                }}
               >
                 <div className={`p-3 rounded-xl ${importMode === "data" ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                    <Database size={24} />
                 </div>
                 <div>
                    <div className="font-bold text-gray-900 text-[15px]">Direct Spreadsheet</div>
                    <div className="text-[13px] text-gray-500 mt-1">Import directly from CSV or Excel data.</div>
                 </div>
               </button>
            </div>

            {parsedPreview && parsedPreview.length > 0 ? (
                <div className="space-y-5 fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">
                        Import Preview
                      </h3>
                      <p className="text-[13px] mt-1 text-gray-500">
                        {parsedPreview.length} candidates detected — review before importing.
                      </p>
                    </div>
                    <button
                      className="text-red-500 text-sm font-bold uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                      onClick={() => dispatch(clearParsedPreview())}
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Table preview */}
                  <div className="max-h-[300px] overflow-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
                    <table className="w-full text-left text-[13px] min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] sticky top-0 bg-gray-50 text-gray-500">Name</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] sticky top-0 bg-gray-50 text-gray-500">Email</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] sticky top-0 bg-gray-50 text-gray-500">Role</th>
                          <th className="px-4 py-3 font-bold uppercase tracking-wider text-[11px] sticky top-0 bg-gray-50 text-gray-500">Skills</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedPreview.map((r, i) => (
                          <tr key={i} className="border-b border-gray-100 hover:bg-indigo-50/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-gray-900">{r.firstName} {r.lastName}</td>
                            <td className="px-4 py-3 text-gray-500">{r.email}</td>
                            <td className="px-4 py-3 text-gray-500">{r.currentRole || "—"}</td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1.5">
                                {(r.skills || "").split(",").filter(Boolean).slice(0, 2).map((sk, j) => (
                                  <span key={j} className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                    {sk.trim()}
                                  </span>
                                ))}
                                {(r.skills || "").split(",").filter(Boolean).length > 2 && (
                                  <span className="text-[10px] text-gray-400 font-medium">+{ (r.skills || "").split(",").filter(Boolean).length - 2 }</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button onClick={handleBulkUploadCSV} disabled={loading} className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-[15px] font-bold shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all">
                    {loading ? <LoadingSpinner size={20} /> : <FileText size={20} />}
                    {loading ? `Importing candidates...` : `Import ${parsedPreview.length} Candidates`}
                  </button>
                </div>
            ) : (
                <div className="space-y-6 fade-in">
                  <div {...getRootProps()} className={`p-10 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center transition-all cursor-pointer ${isDragActive ? (importMode === 'pdf' ? 'border-blue-400 bg-blue-50/50' : 'border-indigo-400 bg-indigo-50/50') : 'border-gray-200 bg-gray-50 hover:bg-gray-100/50'}`}>
                    <input {...getInputProps()} />
                    <UploadCloud size={48} className={`mb-4 ${isDragActive ? (importMode === 'pdf' ? 'text-blue-500' : 'text-indigo-500') : 'text-gray-400'}`} strokeWidth={1.5} />
                    <div className="font-display font-bold text-xl text-gray-900 text-center">
                      {importMode === "pdf" ? "Drag & drop multiple PDF resumes here" : "Drag & drop CSV or Excel data file here"}
                    </div>
                    <div className="text-[15px] text-gray-500 mt-2 text-center max-w-md leading-relaxed">
                      {importMode === "pdf" 
                        ? "Upload multiple PDFs for AI batch extraction. Our Gemini model will automatically map candidate details." 
                        : "Upload a single CSV or Excel (.xlsx/.xls) file to directly import structured candidate rows."}
                    </div>
                  </div>

                  {importMode === "data" && (
                    <div className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-indigo-50 border border-indigo-100">
                      <div>
                        <div className="text-[14px] font-bold text-indigo-900">Need a template?</div>
                        <div className="text-[13px] mt-0.5 text-indigo-700/80">
                          Download our CSV template with all supported columns pre-defined.
                        </div>
                      </div>
                      <button
                        onClick={downloadTemplate}
                        className="flex items-center gap-2 text-[13px] font-bold px-5 py-2.5 rounded-xl transition-all shrink-0 bg-white text-indigo-600 border border-indigo-200 shadow-sm hover:bg-indigo-600 hover:text-white"
                      >
                        <Download size={16} /> Download Template
                      </button>
                    </div>
                  )}

                  {files.length > 0 && (
                     <div className="fade-in pt-4">
                        <h3 className="text-[13px] font-black tracking-widest uppercase mb-4 flex items-center justify-between text-gray-400">
                           Queued Resumes ({files.length} selected)
                           <button onClick={() => setFiles([])} className="text-red-500 tracking-widest text-[11px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors">
                             CLEAR QUEUE
                           </button>
                        </h3>
                        <div className="flex flex-wrap gap-2.5 mb-8 max-h-48 overflow-y-auto pr-2">
                          {files.map((f, i) => (
                            <div key={i} className="flex items-center gap-2.5 bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-2.5 text-[13px] font-medium text-gray-700 group">
                               <FileSignature size={16} className="text-blue-500" />
                               <span className="truncate max-w-[180px]">{f.name}</span>
                               <button onClick={(e) => { e.stopPropagation(); setFiles(files.filter((_, idx) => idx !== i)); }} className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-gray-400 hover:text-red-500">
                                 <X size={16} />
                               </button>
                            </div>
                          ))}
                        </div>

                        <button onClick={handleBulkUploadPDFs} disabled={loading || files.length === 0} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[15px] font-bold shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 transition-all">
                           {loading ? <LoadingSpinner size={20} /> : <Wand2 size={20} />}
                           {loading ? "Analyzing Context Matrix via Gemini..." : `Extract & Ingest ${files.length} Candidates`}
                        </button>
                     </div>
                  )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
