"use client";

import { Job } from "@/lib/types";
import { useAppDispatch } from "@/lib/hooks/redux";
import { runScreening } from "@/lib/slices/screeningSlice";
import { useRouter } from "next/navigation";

interface JobCardProps {
  job: Job;
}

const workTypeLabel: Record<string, string> = {
  remote: "Remote",
  onsite: "On-site",
  hybrid: "Hybrid",
};

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
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
        style={{
          background: "var(--accent-dim)",
          border: "1px solid rgba(124,111,255,0.25)",
        }}
      >
        {job.title.toLowerCase().includes("engineer") ? "💻" : job.title.toLowerCase().includes("designer") ? "🎨" : "🤖"}
      </div>

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
              className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--surface3)",
                color: "var(--text2)",
                border: "1px solid var(--border)",
              }}
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{ color: "var(--text3)" }}
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
            className="btn btn-ghost"
            onClick={() => router.push(`/jobs/${job._id}/shortlist`)}
          >
            View Results
          </button>
        ) : (
          <button
            className="btn btn-green"
            onClick={handleRunScreening}
          >
            ▶ Run AI Screening
          </button>
        )}
      </div>
    </div>
  );
}
