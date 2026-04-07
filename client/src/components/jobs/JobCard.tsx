"use client";

import { Job } from "@/lib/types";
import { useAppDispatch } from "@/lib/hooks/redux";
import { runScreening } from "@/lib/slices/screeningSlice";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

interface JobCardProps {
  job: Job;
}

const workTypeLabel: Record<string, string> = {
  remote: "Remote",
  onsite: "On-site",
  hybrid: "Hybrid",
};

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

// ── Job icon resolver ──────────────────────────────────────────────────────
type IconConfig = {
  Icon: React.ElementType;
  bg: string;
  color: string;
  border: string;
};

function getJobIcon(title: string, department?: string): IconConfig {
  const t = (title + " " + (department ?? "")).toLowerCase();

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

  // fallback
  return { Icon: Briefcase,  bg: "#475569", color: "#ffffff", border: "#334155" };
}

export default function JobCard({ job }: JobCardProps) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const handleRunScreening = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Dispatch simulation thunk. Modal in DashboardPage will open.
    dispatch(runScreening(job._id));
  };

  return (
    <div
      className="job-header flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
      }}
      onClick={() => router.push(`/jobs/${job._id}/applicants`)}
    >
      {/* Icon */}
      {(() => {
        const { Icon, bg, color, border } = getJobIcon(job.title, job.department);
        return (
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: bg, border: `1.5px solid ${border}` }}
          >
            <Icon size={20} color={color} strokeWidth={1.8} />
          </div>
        );
      })()}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="font-display font-bold text-[16px] tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {job.title}
        </div>
        <div className="text-[12px] mt-0.5 mb-2" style={{ color: "var(--text3)" }}>
          {job.location} · {workTypeLabel[job.workType] ?? job.workType} ·{" "}
          {job.contractType} · Posted 3 days ago
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2.5 py-[3px] rounded-full font-medium"
              style={skillChipStyle(skill)}
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span
              className="text-[11px] px-2.5 py-[3px] rounded-full font-medium"
              style={{ background: "var(--surface3)", color: "var(--text3)" }}
            >
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-4 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[12px]" style={{ color: "var(--text3)" }}>
          {job.applicantCount} applicants
        </span>
        {job.status === "screened" ? (
          <button
            className="btn btn-ghost px-5 py-2.5 font-bold"
            onClick={() => router.push(`/jobs/${job._id}/shortlist`)}
          >
            View Results
          </button>
        ) : (
          <button
            className="btn btn-green px-5 py-2.5 font-bold shadow-sm animate-pulse-subtle"
            onClick={handleRunScreening}
          >
            ▶ Run AI Screening
          </button>
        )}
      </div>
    </div>
  );
}
