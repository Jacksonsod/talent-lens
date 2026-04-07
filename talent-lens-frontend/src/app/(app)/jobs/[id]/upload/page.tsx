"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import { runScreening } from "@/lib/slices/screeningSlice";
import { StatCard } from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Upload, Users, ArrowLeft, CheckCircle2, CloudDownload } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function IngestionPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useAppDispatch();

  // Scenario selection
  const type = searchParams.get("type") || "external";
  const [ingesting, setIngesting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [count, setCount] = useState(0);

  const handleIngest = (e: React.MouseEvent) => {
    e.preventDefault();
    setIngesting(true);
    // Simulate ingestion logic
    setTimeout(() => {
      setCount(type === "umurava" ? 82 : 45);
      setIngesting(false);
      setSuccess(true);
      toast.success("Candidates loaded successfully!", { icon: "🚀" });
    }, 2000);
  };

  const handleStartScreening = () => {
    dispatch(runScreening(id));
    router.push(`/jobs/${id}`);
    toast.success("AI Analysis started...");
  };

  return (
    <div className="stagger max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href={`/jobs/${id}`} className="flex items-center gap-2 text-sm mb-4" style={{ color: "var(--text3)" }}>
          <ArrowLeft size={14} /> Back to Job Hub
        </Link>
        <h1 className="font-display font-bold text-2xl tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Candidate Ingestion — Phase 3
        </h1>
        <p className="text-sm" style={{ color: "var(--text3)" }}>
          Feed external or internal talent into Gemini 1.5 Pro AI engine for analysis.
        </p>
      </div>

      {!success ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Main Ingestion Card */}
          <div className="rounded-2xl p-8 border border-[var(--border)] bg-[var(--surface)] text-center">
            {type === "umurava" ? (
              <div className="animate-fade-up">
                <div className="w-16 h-16 rounded-2xl bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center mx-auto mb-6">
                  <CloudDownload size={32} />
                </div>
                <h2 className="font-display font-bold text-xl mb-2">Scenario 1: Internal Umurava Talent</h2>
                <p className="text-sm max-w-sm mx-auto mb-8 text-[var(--text3)]">
                  Securely pull verified talent profiles directly from Umurava's internal database based on your job requirements.
                </p>
                <button 
                  className="btn btn-primary h-14 px-12 text-base font-bold animate-pulse-ai"
                  onClick={handleIngest}
                  disabled={ingesting}
                >
                  {ingesting ? "Connecting..." : "Import from Umurava"}
                </button>
              </div>
            ) : (
              <div className="animate-fade-up">
                <div className="w-16 h-16 rounded-2xl bg-[var(--accent-dim)] text-[var(--accent)] flex items-center justify-center mx-auto mb-6">
                  <Upload size={32} />
                </div>
                <h2 className="font-display font-bold text-xl mb-2">Scenario 2: External Bulk Upload</h2>
                <p className="text-sm max-w-sm mx-auto mb-8 text-[var(--text3)]">
                  Drag and drop a CSV file of applicants or bulk-upload individual PDF resumes.
                </p>
                <div className="border-1.5 border-dashed border-[var(--border2)] rounded-xl py-12 px-6 mb-8 cursor-pointer hover:border-[var(--accent)] hover:bg-[var(--accent-dim)] group transition-all">
                  <div className="text-sm font-bold text-[var(--text)] group-hover:text-[var(--accent)]">Click to browse or drop CSV/PDFs</div>
                  <div className="text-[11px] text-[var(--text3)] mt-1">Supports up to 200 files at once</div>
                </div>
                <button 
                  className="btn btn-primary h-14 px-12 text-base font-bold"
                  onClick={handleIngest}
                  disabled={ingesting}
                >
                   {ingesting ? "Parsing Resumes..." : "Bulk Load Applicants"}
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl p-12 border border-[var(--green)] bg-[var(--green-dim)] text-center animate-fade-up">
          <div className="w-16 h-16 rounded-full bg-[var(--green)] text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--green-mid)]">
             <CheckCircle2 size={32} />
          </div>
          <h2 className="font-display font-bold text-2xl mb-2 text-[var(--text)]">Successfully Loaded!</h2>
          <div className="font-display font-extrabold text-5xl mb-4 text-[var(--green)] tracking-tighter">
             {count}
          </div>
          <p className="text-sm font-medium mb-12 text-[var(--text)]">
             Candidates loaded and ready for Phase 4: AI Screening.
          </p>
          <div className="flex gap-4 justify-center">
            <button 
                className="btn btn-primary h-12 px-8"
                onClick={() => router.push(`/jobs/${id}`)}
              >
              Back to Job Hub
            </button>
            <button 
              className="btn btn-ghost h-12 px-8 border-[var(--green)] text-[var(--text)] hover:bg-[var(--green-mid)]"
              onClick={handleStartScreening}
            >
              Start AI Screening
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
