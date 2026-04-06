"use client";

import { Job } from "@/lib/types";
import { useAppDispatch } from "@/lib/hooks/redux";
import { runScreening } from "@/lib/slices/screeningSlice";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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
    toast.loading("Starting AI screening...", { id: "screening" });
    try {
      await dispatch(runScreening(job._id)).unwrap();
      toast.success("Screening complete!", { id: "screening" });
      router.push(`/jobs/${job._id}/shortlist`);
    } catch (err) {
      toast.error("Screening failed. Please try again.", { id: "screening" });
    }
  };

  return (
    <div
      className="flex items-start gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all"
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
          background: "rgba(124,111,255,0.12)",
          border: "1px solid rgba(124,111,255,0.2)",
        }}
      >
        💼
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div
          className="font-display font-bold text-[15px] tracking-tight"
          style={{ color: "#f0f0f5" }}
        >
          {job.title}
        </div>
        <div className="text-[12px] mt-0.5 mb-2" style={{ color: "#5a5a72" }}>
          {job.location} · {workTypeLabel[job.workType] ?? job.workType} ·{" "}
          {job.contractType}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 5).map((skill) => (
            <span
              key={skill}
              className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{
                background: "var(--surface3)",
                color: "#9090a8",
                border: "1px solid var(--border)",
              }}
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 5 && (
            <span
              className="text-[11px] px-2.5 py-0.5 rounded-full"
              style={{ color: "#5a5a72" }}
            >
              +{job.skills.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className="flex items-center gap-3 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[12px]" style={{ color: "#5a5a72" }}>
          {job.applicantCount} applicants
        </span>
        {job.status === "screened" ? (
          <button
            className="px-4 py-2 rounded-lg text-[12px] font-medium transition-colors border"
            style={{
              background: "transparent",
              borderColor: "rgba(255,255,255,0.12)",
              color: "#9090a8",
            }}
            onClick={() => router.push(`/jobs/${job._id}/shortlist`)}
          >
            View Results
          </button>
        ) : (
          <button
            className="px-4 py-2 rounded-lg text-[12px] font-medium transition-all border"
            style={{
              background: "rgba(0,229,160,0.1)",
              borderColor: "rgba(0,229,160,0.2)",
              color: "#00e5a0",
            }}
            onClick={handleRunScreening}
          >
            ▶ Run AI Screening
          </button>
        )}
      </div>
    </div>
  );
}
