"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import CandidateCard from "@/components/screening/CandidateCard";
import StatCard from "@/components/ui/StatCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ClipboardList } from "lucide-react";
import { CSVLink } from "react-csv";

export default function ShortlistPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();

  const shortlist = useAppSelector((s) => s.screening.shortlists[id]);
  const job = useAppSelector((s) => s.jobs.selected);
  const loading = useAppSelector(
    (s) => s.screening.isScreening || s.jobs.loading
  );

  useEffect(() => {
    dispatch(fetchJobById(id));
    dispatch(fetchShortlist(id));
  }, [id, dispatch]);

  if (loading && !shortlist) return <LoadingSpinner />;
  
  if (!shortlist || shortlist.length === 0) {
    return (
      <div className="text-center py-20" style={{ color: "var(--text3)" }}>
        <div className="flex justify-center mb-3">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "#EEF2FF", border: "1.5px solid #C7D2FE" }}
          >
            <ClipboardList size={28} color="#4F46E5" strokeWidth={1.6} />
          </div>
        </div>
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

  const totalScreened = shortlist.length;
  const topScore = shortlist.length > 0 ? Math.max(...shortlist.map(r => r.matchScore)) : 0;
  const avgScore = shortlist.length > 0 ? Math.round(shortlist.reduce((acc, curr) => acc + curr.matchScore, 0) / shortlist.length) : 0;

  // Prepare CSV Data
  const csvData = shortlist.map((r, i) => {
    const app = r.applicantId as any;
    return {
      Rank: i + 1,
      FirstName: app.firstName || "",
      LastName: app.lastName || "",
      Email: app.email || "",
      MatchScore: r.matchScore,
      Recommendation: r.finalRecommendation,
      Strengths: r.strengths,
      Gaps: r.gaps
    };
  });

  return (
    <div className="stagger max-w-6xl mx-auto pb-20">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total in Shortlist" value={totalScreened} />
        <StatCard label="Avg Match Score" value={avgScore} color="amber" />
        <StatCard label="Top Match Score" value={topScore} color="green" />
        <StatCard label="Target Shortlist" value={job?.shortlistSize || "-"} color="blue" />
      </div>

      {/* Job context bar */}
      <div
        className="flex flex-col md:flex-row items-center justify-between px-5 py-4 rounded-xl mb-5 border border-[var(--border)] bg-[var(--surface)] gap-4"
      >
        <div>
          <div
            className="font-display font-bold text-base"
            style={{ color: "var(--text)" }}
          >
            {job?.roleTitle ?? "Job"}
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
          <CSVLink 
            data={csvData} 
            filename={`shortlist-${job?.roleTitle || id}.csv`}
            className="btn btn-primary cursor-pointer flex items-center justify-center"
          >
            Export Shortlist
          </CSVLink>
        </div>
      </div>

      {/* Section heading */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div
          className="text-[11px] font-semibold tracking-widest uppercase text-[var(--text3)]"
        >
          Top {totalScreened} candidates
        </div>
        <div className="text-[12px] text-[var(--text3)]">
          Click a card to see Gemini analysis
        </div>
      </div>

      {/* Candidate list */}
      <div className="flex flex-col gap-2.5">
        {shortlist.map((result, i) => (
          <CandidateCard key={result._id} result={result} rank={i + 1} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}
