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
  onViewDetails?: () => void;
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

export default function JobCard({ job, mode = "default", onViewDetails }: JobCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { shortlists } = useAppSelector((state) => state.screening);
  const applicants = useAppSelector((state) => state.applicants.items.filter(a => a.jobId === job._id));
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
        className="group relative bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 cursor-pointer"
        onClick={() => {
          if (mode === "compare") {
            router.push(`/compare?jobId=${job._id}`);
          } else if (onViewDetails) {
            onViewDetails();
          } else {
            router.push(`/jobs/${job._id}/applicants`);
          }
        }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Left: Icon & Title */}
          <div className="flex items-start gap-4 flex-1">
            {(() => {
              const { Icon, bg, color, border } = getJobIcon(job.roleTitle);
              return (
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{ background: bg, border: `1.5px solid ${border}` }}
                >
                  <Icon size={24} color={color} strokeWidth={1.8} />
                </div>
              );
            })()}
            <div className="min-w-[320px] max-w-[320px]">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-lg text-gray-900 tracking-tight truncate" style={{ fontFamily: "var(--font-bricolage), sans-serif" }}>
                  {job.roleTitle}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${
                  job.status === "Open" ? "bg-green-50 text-green-600 border-green-100" :
                  job.status === "Screening" ? "bg-blue-50 text-blue-600 border-blue-100" :
                  "bg-gray-50 text-gray-500 border-gray-100"
                }`}>
                  {job.status}
                </span>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-gray-400 font-medium">
                <span>{job.experienceLevel}</span>
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                <span>Target: {job.shortlistSize}</span>
                <span className="w-1 h-1 rounded-full bg-gray-200" />
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Middle: Mini Pipeline */}
          <div className="flex items-center gap-8 px-6 lg:border-x lg:border-gray-50">
            <div className="text-center">
              <div className="text-sm font-black text-gray-900">
                {applicants.length}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Applied</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-blue-600">
                {shortlists[job._id]?.filter(r => r.status === "Completed").length || 0}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Screened</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-green-600">
                {shortlists[job._id]?.length || 0}
              </div>
              <div className="text-[10px] font-bold text-gray-400 uppercase">Shortlist</div>
            </div>
          </div>

          {/* Right: Skills & Actions */}
          <div className="flex items-center justify-between lg:justify-end gap-6 min-w-[300px]">
            <div className="flex -space-x-2 overflow-hidden">
               {job.requiredSkills?.slice(0, 3).map((skill, i) => (
                 <div 
                   key={skill}
                   className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[9px] font-bold shadow-sm"
                   style={skillChipStyle(skill)}
                   title={skill}
                 >
                   {skill.substring(0, 2).toUpperCase()}
                 </div>
               ))}
               {job.requiredSkills?.length > 3 && (
                 <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-50 text-gray-400 flex items-center justify-center text-[9px] font-bold">
                   +{job.requiredSkills.length - 3}
                 </div>
               )}
            </div>

            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
              {hasShortlist || job.status === "Closed" ? (
                <button
                  className="h-10 px-5 rounded-xl bg-emerald-600 text-white text-[13px] font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                  onClick={handleViewResults}
                >
                  View Results
                </button>
              ) : (
                <button
                  className={`h-10 px-5 rounded-xl text-[13px] font-bold transition-all shadow-lg flex items-center gap-2 ${
                    job.status === "Draft" 
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none border border-gray-200" 
                      : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                  }`}
                  onClick={handleRunScreening}
                  disabled={loading || job.status === "Draft"}
                  title={job.status === "Draft" ? "Cannot screen a draft job. Publish it first." : ""}
                >
                  {loading ? "Screening..." : "Run Screening"}
                </button>
              )}

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100"
                >
                  <MoreVertical size={18} className="text-gray-400" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <button
                      onClick={handleEdit}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <Pencil size={14} /> Edit Details
                    </button>
                    <button
                      onClick={handleDeleteClick}
                      className="w-full px-4 py-2.5 text-left text-[13px] font-bold text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 size={14} /> Delete Job
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
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
