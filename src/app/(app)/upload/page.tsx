"use client";

import React, { useState } from "react";
import { useAppDispatch } from "@/lib/hooks/redux";
import { runScreening } from "@/lib/slices/screeningSlice";
import ScreeningModal from "@/components/ui/ScreeningModal";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [showPreview, setShowPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleUpload = async () => {
    setIsUploading(true);
    toast.loading("Processing files...", { id: "upload" });
    // Simulate real upload success for simulation purposes
    setTimeout(async () => {
      setShowPreview(true);
      setIsUploading(false);
      toast.success("5 candidates parsed successfully!", { id: "upload" });
    }, 1500);
  };

  const handleStartScreening = () => {
    // Defaulting to job-001 for the demo workflow
    dispatch(runScreening("job-001"));
    toast.success("AI Screening started for Senior Full Stack Engineer");
  };

  return (
    <div className="stagger">
      {/* Upload Area */}
      <div
        className="border-1.5 border-dashed border-[var(--border2)] rounded-xl py-12 px-6 text-center cursor-pointer transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-dim)] group mb-8"
        onClick={handleUpload}
      >
        <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📁</div>
        <div className="font-display font-semibold text-base mb-1" style={{ color: "var(--text)" }}>
          Drop your CSV or PDF resumes here
        </div>
        <div className="text-sm" style={{ color: "var(--text3)" }}>
          Supports .csv, .xlsx, .pdf · Up to 200 files at once
        </div>
      </div>

      {showPreview && (
        <div className="animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold font-display text-[var(--text2)] uppercase tracking-wider">
              Preview — 5 candidates parsed
            </h2>
            <button 
              className="btn btn-green animate-pulse-ai"
              onClick={handleStartScreening}
            >
              ▶ Screen These Candidates
            </button>
          </div>

          <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--surface)] shadow-xl">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[var(--surface2)] border-b border-[var(--border)]">
                  {["#", "Name", "Role", "Experience", "Top Skills", "Source"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text3)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-[var(--text2)]">
                {[
                  { id: 1, name: "Alice Mutoni", role: "Full Stack Dev", exp: "6 years", skills: "React, Node.js, TS", source: "CSV upload" },
                  { id: 2, name: "Brian Otieno", role: "Backend Eng", exp: "5 years", skills: "Node.js, Mongo, Python", source: "PDF resume" },
                  { id: 3, name: "Chloe Nkusi", role: "Frontend Eng", exp: "4 years", skills: "Next.js, Tailwind, Redux", source: "CSV upload" },
                  { id: 4, name: "David Mugisha", role: "Software Eng", exp: "3 years", skills: "React, Python, SQL", source: "Resume link" },
                  { id: 5, name: "Eva Habimana", role: "Full Stack Dev", exp: "5 years", skills: "Vue.js, Node.js, AWS", source: "PDF resume" },
                ].map((row) => (
                  <tr key={row.id} className="border-b border-[var(--border)] hover:bg-[var(--surface2)] transition-colors">
                    <td className="px-4 py-3">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{row.name}</td>
                    <td className="px-4 py-3">{row.role}</td>
                    <td className="px-4 py-3">{row.exp}</td>
                    <td className="px-4 py-3">{row.skills}</td>
                    <td className="px-4 py-3">{row.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Screening Modal */}
      <ScreeningModal />
    </div>
  );
}
