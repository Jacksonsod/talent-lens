"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import CandidateCard from "@/components/screening/CandidateCard";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { calcAverageScore } from "@/lib/utils/helpers";

export default function ShortlistPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const shortlist = useAppSelector((s) => s.screening.results[id]);
  const job = useAppSelector((s) => s.jobs.selected);
  const loading = useAppSelector(
    (s) => s.screening.isScreening || s.jobs.loading
  );

  useEffect(() => {
    dispatch(fetchJobById(id));
    dispatch(fetchShortlist(id));
  }, [id, dispatch]);

  if (loading && !shortlist) return <LoadingSpinner />;
  
  if (!shortlist) {
    return (
      <div className="text-center py-20" style={{ color: "var(--text3)" }}>
        <div className="text-3xl mb-3">📋</div>
        <div className="font-display font-bold text-base mb-2" style={{ color: "var(--text)" }}>
          No shortlist yet
        </div>
        <p className="text-sm mb-5 text-[var(--text2)]">Run AI screening to generate a shortlist.</p>
        <button
          className="btn btn-primary px-8 mx-auto"
          onClick={() => router.push(`/dashboard`)}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const avgScore = calcAverageScore(shortlist.results);

  return (
    <div className="stagger">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Screened" value={shortlist.totalScreened} />
        <StatCard label="Shortlisted" value={shortlist.shortlistCount} color="green" />
        <StatCard label="Avg Score" value={avgScore} color="amber" />
        <StatCard label="Top Score" value={shortlist.topScore} color="green" />
      </div>

      {/* Job context bar */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-xl mb-5 border border-[var(--border)] bg-[var(--surface)]"
      >
        <div>
          <div
            className="font-display font-bold text-base"
            style={{ color: "var(--text)" }}
          >
            {job?.title ?? "Job"}
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "var(--text3)" }}>
            AI screening completed · Gemini 1.5 Pro
          </div>
        </div>
        <div className="flex gap-2.5">
          <button
            className="btn btn-ghost"
            onClick={() => router.push(`/compare?jobId=${id}`)}
          >
            Compare Top 3
          </button>
          <button
            className="btn btn-primary"
          >
            Export Shortlist
          </button>
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div
          className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text3)]"
        >
          Top {shortlist.shortlistCount} candidates
        </div>
        <div className="text-[12px] text-[var(--text3)]">
          Click a card to see AI reasoning
        </div>
      </div>

      {/* Candidate list */}
      <div className="flex flex-col gap-2.5">
        {shortlist.results.map((result, i) => (
          <CandidateCard key={result._id} result={result} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}
