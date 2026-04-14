"use client";

import { Job } from "@/lib/types";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { screenAll } from "@/lib/slices/screeningSlice";
import { updateJobStatus, deleteJob } from "@/lib/slices/jobsSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Code2,
  BrainCircuit,
  PenTool,
  Server,
  BarChart2,
  ShieldCheck,
  Smartphone,
  Database,
  Globe,
  Briefcase,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface JobCardProps {
  job: Job;
  mode?: "default" | "compare";
}

// 6 vibrant color palettes — deterministic by skill name hash
const CHIP_PALETTES = [
  { background: "#EEF2FF", color: "#4F46E5", border: "#C7D2FE" }, // indigo
  { background: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" }, // blue
  { background: "#F0FDF4", color: "#16A34A", border: "#BBF7D0" }, // green
  { background: "#FFF7ED", color: "#EA580C", border: "#FED7AA" }, // orange
  { background: "#FDF4FF", color: "#9333EA", border: "#E9D5FF" }, // purple
  { background: "#ECFDF5", color: "#0D9488", border: "#99F6E4" }, // teal
];

function skillChipStyle(skill: string) {
  let hash = 0;
  for (let i = 0; i < skill.length; i++) hash += skill.charCodeAt(i);
  const p = CHIP_PALETTES[hash % CHIP_PALETTES.length];
  return { background: p.background, color: p.color, border: `1px solid ${p.border}` };
}

type IconConfig = {
  Icon: React.ElementType;
  bg: string;
  color: string;
  border: string;
};

function getJobIcon(title: string): IconConfig {
  const t = title.toLowerCase();
  if (t.includes("ai") || t.includes("ml") || t.includes("machine learning") || t.includes("llm"))
    return { Icon: BrainCircuit, bg: "#7C3AED", color: "#ffffff", border: "#6D28D9" };
  if (t.includes("design") || t.includes("ux") || t.includes("ui") || t.includes("figma"))
    return { Icon: PenTool,     bg: "#E11D48", color: "#ffffff", border: "#BE123C" };
  if (t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("react native"))
    return { Icon: Smartphone,  bg: "#EA580C", color: "#ffffff", border: "#C2410C" };
  if (t.includes("data") || t.includes("analyst") || t.includes("analytics"))
    return { Icon: BarChart2,   bg: "#D97706", color: "#ffffff", border: "#B45309" };
  if (t.includes("backend") || t.includes("back-end") || t.includes("server") || t.includes("devops") || t.includes("infra"))
    return { Icon: Server,      bg: "#16A34A", color: "#ffffff", border: "#15803D" };
  if (t.includes("security") || t.includes("cyber"))
    return { Icon: ShieldCheck, bg: "#0D9488", color: "#ffffff", border: "#0F766E" };
  if (t.includes("database") || t.includes("dba"))
    return { Icon: Database,    bg: "#2563EB", color: "#ffffff", border: "#1D4ED8" };
  if (t.includes("full stack") || t.includes("fullstack") || t.includes("engineer") || t.includes("developer"))
    return { Icon: Code2,       bg: "#2563EB", color: "#ffffff", border: "#1D4ED8" };
  if (t.includes("web") || t.includes("frontend") || t.includes("front-end"))
    return { Icon: Globe,       bg: "#0284C7", color: "#ffffff", border: "#0369A1" };
  return { Icon: Briefcase,     bg: "#475569", color: "#ffffff", border: "#334155" };
}

export default function JobCard({ job, mode = "default" }: JobCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { shortlists } = useAppSelector((state) => state.screening);
  const hasShortlist = shortlists[job._id] && shortlists[job._id].length > 0;

  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleRunScreening = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    if (job.status !== "Screening" && job.status !== "Closed") {
      await dispatch(updateJobStatus({ id: job._id, status: "Screening" }));
    }
    const result = await dispatch(screenAll(job._id));
    if (screenAll.fulfilled.match(result)) {
      await dispatch(updateJobStatus({ id: job._id, status: "Closed" }));
      toast.success("AI screening completed successfully!");
      router.push(`/jobs/${job._id}/shortlist`);
    } else {
      toast.error((result.payload as string) || "AI screening failed. Please try again.");
      setLoading(false);
    }
  };

  const handleViewResults = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/jobs/${job._id}/shortlist`);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/compare?jobId=${job._id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    router.push(`/jobs/${job._id}/edit`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    const result = await dispatch(deleteJob(job._id));
    if (deleteJob.fulfilled.match(result)) {
      toast.success(`"${job.roleTitle}" deleted successfully.`);
    } else {
      toast.error((result.payload as string) || "Failed to delete job.");
    }
    setDeleting(false);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className="job-header flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200 hover:border-[var(--accent)]"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        onClick={() => {
          if (mode === "compare") {
            router.push(`/compare?jobId=${job._id}`);
          } else {
            router.push(`/jobs/${job._id}/applicants`);
          }
        }}
      >
        {/* Left: Icon + mobile title */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {(() => {
            const { Icon, bg, color, border } = getJobIcon(job.roleTitle);
            return (
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: bg, border: `1.5px solid ${border}` }}
              >
                <Icon size={20} color={color} strokeWidth={1.8} />
              </div>
            );
          })()}
          <div className="flex-1 min-w-0 sm:hidden">
            <div className="font-display font-bold text-[16px] tracking-tight truncate" style={{ color: "var(--text)" }}>
              {job.roleTitle}
            </div>
          </div>
        </div>

        {/* Center: job info */}
        <div className="flex-1 min-w-0 w-full">
          <div className="hidden sm:block font-display font-bold text-[16px] tracking-tight" style={{ color: "var(--text)" }}>
            {job.roleTitle}
            {job.status && (
              <span className="ml-3 text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[var(--border)]" style={{ color: "var(--text3)" }}>
                {job.status}
              </span>
            )}
          </div>
          <div className="text-[12px] mt-0.5 mb-2" style={{ color: "var(--text3)" }}>
            {job.experienceLevel} · Target Shortlist: {job.shortlistSize}
            {job.status && (
              <span className="sm:hidden ml-2 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-[var(--border)]">
                {job.status}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills && job.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="text-[10px] sm:text-[11px] px-2 py-[2px] sm:py-[3px] rounded-full font-medium"
                style={skillChipStyle(skill)}
              >
                {skill}
              </span>
            ))}
            {job.requiredSkills && job.requiredSkills.length > 4 && (
              <span
                className="text-[10px] sm:text-[11px] px-2 py-[2px] sm:py-[3px] rounded-full font-medium"
                style={{ background: "var(--surface3)", color: "var(--text3)" }}
              >
                +{job.requiredSkills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Right: action buttons + kebab menu */}
        <div
          className="flex items-center gap-2 sm:gap-3 shrink-0 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-[var(--border)]"
          onClick={(e) => e.stopPropagation()}
        >
          {mode === "compare" ? (
            <button
              className="btn flex-1 sm:flex-none px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm bg-[rgba(124,111,255,0.1)] hover:bg-[var(--accent)] text-[var(--accent)] hover:text-white transition-colors rounded-lg"
              onClick={handleCompareClick}
            >
              Compare
            </button>
          ) : hasShortlist || job.status === "Closed" ? (
            <button
              className="btn btn-ghost flex-1 sm:flex-none px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm"
              onClick={handleViewResults}
            >
              View Results
            </button>
          ) : (
            <button
              className="btn btn-green flex-1 sm:flex-none px-4 sm:px-5 py-2.5 font-bold text-xs sm:text-sm shadow-sm"
              onClick={handleRunScreening}
              disabled={loading}
            >
              {loading ? "Screening..." : "Run Screening"}
            </button>
          )}

          {/* Kebab menu — only in default mode */}
          {mode !== "compare" && (
            <div className="relative" ref={menuRef}>
              <button
                id={`job-menu-${job._id}`}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-150 hover:bg-[var(--surface3)]"
                style={{ color: "var(--text3)" }}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
                aria-label="Job actions"
              >
                <MoreVertical size={16} />
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-10 z-50 rounded-xl py-1.5 shadow-xl min-w-[152px]"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    animation: "dropdownEnter 0.14s ease-out",
                  }}
                >
                  <button
                    id={`job-edit-${job._id}`}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-left transition-colors hover:bg-[var(--surface3)]"
                    style={{ color: "var(--text2)" }}
                    onClick={handleEdit}
                  >
                    <Pencil size={14} />
                    Edit Job
                  </button>
                  <div style={{ height: "1px", background: "var(--border)", margin: "4px 12px" }} />
                  <button
                    id={`job-delete-${job._id}`}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-left transition-colors hover:bg-red-50"
                    style={{ color: "#ef4444" }}
                    onClick={handleDeleteClick}
                  >
                    <Trash2 size={14} />
                    Delete Job
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Job Post"
        description={`Are you sure you want to delete "${job.roleTitle}"? This will permanently remove the job and all associated applicant data. This action cannot be undone.`}
        confirmLabel="Delete Job"
        cancelLabel="Keep Job"
        danger
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      <style>{`
        @keyframes dropdownEnter {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
