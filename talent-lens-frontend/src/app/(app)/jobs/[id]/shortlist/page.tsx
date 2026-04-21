"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchShortlist } from "@/lib/slices/screeningSlice";
import { fetchJobById } from "@/lib/slices/jobsSlice";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ClipboardList, Download, ArrowLeft, GitCompare } from "lucide-react";
import { CSVLink } from "react-csv";
import { Applicant, ScreeningResult } from "@/lib/types";
import CandidateCard from "@/components/screening/CandidateCard";

export default function ShortlistPage() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "complete" | "incomplete">("all");

  const shortlist = useAppSelector((s) => s.screening.shortlists[id]);
  const job = useAppSelector((s) => s.jobs.selected);
  const loading = useAppSelector((s) => s.screening.isScreening || s.jobs.loading);

  useEffect(() => {
    dispatch(fetchJobById(id));
    dispatch(fetchShortlist(id));
  }, [id, dispatch]);

  if (loading && !shortlist) return <LoadingSpinner />;

  if (!shortlist || shortlist.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="flex justify-center mb-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[#EEF2FF] border border-[#C7D2FE]">
            <ClipboardList size={28} color="#4F46E5" strokeWidth={1.6} />
          </div>
        </div>
        <div className="font-display font-bold text-base mb-2 text-[var(--text)]">No shortlist yet</div>
        <p className="text-sm mb-5 text-[var(--text2)]">Run AI screening to generate a shortlist.</p>
        <button className="btn btn-primary px-8 mx-auto" onClick={() => router.push(`/dashboard`)}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // Derived stats
  const topScore = Math.max(...shortlist.map(r => r.matchScore));
  const avgScore = Math.round(shortlist.reduce((a, c) => a + c.matchScore, 0) / shortlist.length);
  const stronglyRecommended = shortlist.filter(r => r.finalRecommendation?.toLowerCase().includes("strongly")).length;

  const incompleteItems = shortlist.filter(r => {
    const app = r.applicantId as Applicant;
    return !app.yearsOfExperience || !app.currentRole || !app.educationLevel || app.educationLevel === "Other";
  });

  const topCandidate = shortlist.find(r => r.matchScore === topScore);
  const topCandidateApp = topCandidate?.applicantId as Applicant | undefined;
  const topCandidateName = topCandidateApp ? `${topCandidateApp.firstName} ${topCandidateApp.lastName}` : "—";

  const filteredShortlist = shortlist.filter(r => {
    const app = r.applicantId as Applicant;
    const isIncomplete = !app.yearsOfExperience || !app.currentRole || !app.educationLevel || app.educationLevel === "Other";
    if (filter === "complete") return !isIncomplete;
    if (filter === "incomplete") return isIncomplete;
    return true;
  });

  const csvData = shortlist.map((r, i) => {
    const app = r.applicantId as Applicant;
    return {
      Rank: i + 1,
      FirstName: app.firstName || "",
      LastName: app.lastName || "",
      Email: app.email || "",
      MatchScore: r.matchScore,
      Recommendation: r.finalRecommendation,
      Strengths: r.strengths,
      Gaps: r.gaps,
    };
  });

  return (
    <div className="max-w-6xl mx-auto pb-20 animate-fade-up">

      {/* PAGE HEADER */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h1 className="font-display font-extrabold text-[24px] tracking-tight text-[var(--text)] mb-1">
            {job?.roleTitle ?? "Shortlist"}
          </h1>
          <p className="text-[13px] text-[var(--text3)]">
            AI Screening completed · Reviewed {shortlist.length} applicants · Results ranked by Gemini AI
          </p>
        </div>
        <div className="flex items-center gap-2.5 mt-1">
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border2)] rounded-[9px] text-[13px] text-[var(--text2)] hover:bg-[var(--surface2)] transition-colors"
            onClick={() => router.back()}
          >
            <ArrowLeft size={14} /> Back
          </button>
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[var(--surface)] border border-[var(--border2)] rounded-[9px] text-[13px] text-[var(--text2)] hover:bg-[var(--surface2)] transition-colors"
            onClick={() => router.push(`/compare?jobId=${id}`)}
          >
            <GitCompare size={14} /> Compare Top 3
          </button>
          <CSVLink
            data={csvData}
            filename={`shortlist-${job?.roleTitle || id}.csv`}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-[9px] text-[13px] font-semibold transition-colors"
          >
            <Download size={14} /> Export CSV
          </CSVLink>
        </div>
      </div>

      {/* INCOMPLETE ALERT BANNER */}
      {incompleteItems.length > 0 && (
        <div
          className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3.5 mb-4 cursor-pointer hover:bg-orange-100 transition-colors"
          onClick={() => setFilter("incomplete")}
        >
          <div className="w-9 h-9 rounded-[9px] bg-orange-600 flex items-center justify-center text-[16px] shrink-0">⚠️</div>
          <div className="flex-1">
            <div className="text-[13.5px] font-semibold text-orange-700 mb-0.5">
              {incompleteItems.length} candidate{incompleteItems.length > 1 ? "s" : ""} have incomplete profiles — AI scores may be inaccurate
            </div>
            <div className="text-[12px] text-[var(--text2)] leading-snug">
              These candidates submitted resumes with missing fields (0yr experience, no current role, or no education data). Their match scores are likely lower than their true ability. Consider reviewing their CVs directly before making a decision.
            </div>
          </div>
          <div className="flex items-center gap-1 text-[12px] font-semibold text-orange-700 whitespace-nowrap">
            View incomplete <span className="text-[10px]">›</span>
          </div>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard label="Total Shortlisted" value={shortlist.length} sub={`of ${job?.shortlistSize ?? "—"} target`} progress={job?.shortlistSize ? (shortlist.length / job.shortlistSize) * 100 : 0} accentClass="before:bg-blue-500" valueClass="text-blue-600" />
        <StatCard label="Top Match Score" value={topScore} sub={topCandidateName} progress={topScore} accentClass="before:bg-emerald-500" valueClass="text-emerald-600" />
        <StatCard label="Avg Match Score" value={avgScore} sub={`across ${shortlist.length} candidates`} progress={avgScore} accentClass="before:bg-amber-500" valueClass="text-amber-600" />
        <StatCard label="Strongly Recommended" value={stronglyRecommended} sub="by Gemini AI" progress={(stronglyRecommended / shortlist.length) * 100} accentClass="before:bg-purple-500" valueClass="text-purple-600" />
        <StatCard label="Incomplete Profiles" value={incompleteItems.length} sub="scores may be lower" progress={(incompleteItems.length / shortlist.length) * 100} accentClass="before:bg-orange-500" valueClass="text-orange-600" />
      </div>

      {/* JOB BAR */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-5 py-4 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[10px] bg-blue-50 flex items-center justify-center text-[18px]">💻</div>
          <div>
            <div className="font-display font-bold text-[16px] text-[var(--text)]">{job?.roleTitle}</div>
            <div className="text-[11.5px] text-[var(--text3)] mt-0.5 flex items-center gap-1.5">
              {job?.experienceLevel} · Target shortlist: {job?.shortlistSize ?? "—"} ·
              <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Gemini AI
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-[var(--text3)]">Show:</span>
          <div className="flex gap-1.5">
            <FilterPill label={`All (${shortlist.length})`} active={filter === "all"} onClick={() => setFilter("all")} />
            <FilterPill label={`Complete (${shortlist.length - incompleteItems.length})`} active={filter === "complete"} onClick={() => setFilter("complete")} />
            <FilterPill label={`⚠ Incomplete (${incompleteItems.length})`} active={filter === "incomplete"} onClick={() => setFilter("incomplete")} warn />
          </div>
        </div>
      </div>

      {/* SECTION LABEL */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold text-[var(--text3)] uppercase tracking-wider">
          {filteredShortlist.length === shortlist.length
            ? `Top ${filteredShortlist.length} candidates — ranked by AI match score`
            : `${filteredShortlist.length} candidates — ${filter} profiles`}
        </div>
        <div className="text-[12px] text-[var(--text3)]">Click a card to expand AI analysis</div>
      </div>

      {/* CANDIDATE CARDS */}
      <div className="flex flex-col gap-2.5">
        {filteredShortlist.map((result, i) => {
          const app = result.applicantId as Applicant;
          const isIncomplete = !app.yearsOfExperience || !app.currentRole || !app.educationLevel || app.educationLevel === "Other";
          return (
            <CandidateCard
              key={result._id}
              result={result}
              rank={shortlist.indexOf(result) + 1}
              defaultOpen={i === 0}
              isIncomplete={isIncomplete}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ─── Stat Card ─── */
function StatCard({ label, value, sub, progress, accentClass, valueClass }: {
  label: string; value: number | string; sub: string; progress: number; accentClass: string; valueClass: string;
}) {
  return (
    <div className={`relative bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-4 overflow-hidden before:content-[''] before:absolute before:top-0 before:left-0 before:right-0 before:h-[3px] before:rounded-t-xl ${accentClass}`}>
      <div className="text-[10px] font-bold text-[var(--text3)] uppercase tracking-wider mb-2">{label}</div>
      <div className={`font-display font-extrabold text-[26px] tracking-tight mb-1 ${valueClass}`}>{value}</div>
      <div className="text-[11px] text-[var(--text3)]">{sub}</div>
      <div className="mt-2.5 h-[3px] bg-[var(--surface3)] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${accentClass.replace("before:bg-", "bg-")}`} style={{ width: `${Math.min(progress, 100)}%` }} />
      </div>
    </div>
  );
}

/* ─── Filter Pill ─── */
function FilterPill({ label, active, onClick, warn }: { label: string; active: boolean; onClick: () => void; warn?: boolean; }) {
  if (warn) {
    return (
      <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${active ? "bg-orange-600 text-white border-orange-600" : "bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100"}`}>
        {label}
      </button>
    );
  }
  return (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${active ? "bg-blue-600 text-white border-blue-600" : "bg-[var(--surface)] text-[var(--text2)] border-[var(--border2)] hover:border-blue-400 hover:text-blue-600"}`}>
      {label}
    </button>
  );
}
