"use client";

import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/hooks/redux";
import { fetchJobs } from "@/lib/slices/jobsSlice";
import { fetchShortlist, screenAll } from "@/lib/slices/screeningSlice";
import { Job, ScreeningResult } from "@/lib/types";
import { timeAgo, getInitials } from "@/lib/utils/helpers";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EmptyState from "@/components/ui/EmptyState";
import { 
  Zap, 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronRight, 
  ArrowRight,
  ChevronDown,
  TrendingUp,
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
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// ─── Constants ────────────────────────────────
const BRICOLAGE = "'Bricolage Grotesque', sans-serif";
const DM_SANS = "'DM Sans', sans-serif";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { items: jobs, loading } = useAppSelector((s) => s.jobs);
  const { shortlists } = useAppSelector((s) => s.screening);
  const { data: user } = useAppSelector((s) => s.profile);
  const { searchTerm } = useAppSelector((s) => s.ui);

  useEffect(() => {
    dispatch(fetchJobs()).then((action) => {
      if (fetchJobs.fulfilled.match(action)) {
        // Fetch shortlists for all jobs to populate metrics
        action.payload.forEach((job: Job) => {
          if (job.status === "Closed" || job.status === "Screening") {
            dispatch(fetchShortlist(job._id));
          }
        });
      }
    });
  }, [dispatch]);

  // ─── Data Derivations ───────────────────────
  const activeJobs = jobs.filter(j => j.status === "Open");
  const closedJobs = jobs.filter(j => j.status === "Closed");
  const totalJobs = jobs.length;
  
  // Aggregate all screening results
  const allResults = Object.values(shortlists).flat();
  const screenedJobsCount = Object.keys(shortlists).length;
  
  const avgMatchScore = allResults.length > 0 
    ? Math.round(allResults.reduce((acc, r) => acc + r.matchScore, 0) / allResults.length)
    : 0;

  const topCandidateResult = allResults.length > 0
    ? [...allResults].sort((a, b) => b.matchScore - a.matchScore)[0]
    : null;

  // Pipeline Metrics
  // Since real counts aren't available, we estimate/mock as requested
  const appliedCount = totalJobs * 12 + 42; // Fallback estimate
  const screenedCount = allResults.length;
  const shortlistedCount = screenedCount;
  const reviewedCount = 0;
  const hiredCount = 0;

  // ─── Attention Logic ────────────────────────
  const attentionItems = [];

  // Urgent: Open jobs with "waiting" applicants
  jobs.filter(j => j.status === "Open").forEach(job => {
    // For demo, we assume 2 applicants waiting if job is Open
    attentionItems.push({
      id: `urgent-${job._id}`,
      type: "urgent",
      text: `${job.roleTitle} — 2 applicants waiting to be screened.`,
      jobId: job._id
    });
  });

  // Warn: Shortlists ready but not reviewed
  jobs.filter(j => j.status === "Closed" && shortlists[j._id]).forEach(job => {
    attentionItems.push({
      id: `warn-${job._id}`,
      type: "warn",
      text: `${job.roleTitle} — shortlist ready. ${shortlists[job._id].length} candidates ranked. Awaiting review.`
    });
  });

  // OK: Always show progress
  const screeningPct = totalJobs > 0 ? Math.round((screenedJobsCount / totalJobs) * 100) : 0;
  attentionItems.push({
    id: "ok-progress",
    type: "ok",
    text: `${screenedJobsCount} of ${totalJobs} jobs screened — ${screeningPct}% complete.`,
    pct: screeningPct
  });

  // ─── Filter Logic ──────────────────────────
  const filteredJobsList = jobs.filter(j => 
    j.roleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && jobs.length === 0) return <LoadingSpinner />;
  if (totalJobs === 0 && !loading) {
    return (
       <div className="p-8">
          <div className="mt-12 flex flex-col items-center justify-center text-center">
            <EmptyState
              title="Welcome to TalentAI"
              description="Start by creating a job posting to see AI insights here."
              action={{ label: "Create Your First Job", href: "/jobs/new" }}
            />
          </div>
       </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 p-6 md:p-7 max-w-[1600px] mx-auto stagger">

      {/* SECTION 2: METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px]">
        <MetricCard 
          label="Active Jobs" 
          value={activeJobs.length} 
          context={`${closedJobs.length} closed · ${totalJobs} total`} 
          color="#2563EB"
          progress={(activeJobs.length / Math.max(1, totalJobs)) * 100}
        />
        <MetricCard 
          label="Screened Jobs" 
          value={screenedJobsCount} 
          context={`${screeningPct}% of all jobs complete`} 
          color="#10b981"
          progress={screeningPct}
          trend={`${screeningPct}%`}
        />
        <MetricCard 
          label="Avg Match Score" 
          value={avgMatchScore || "—"} 
          context="across all screened jobs" 
          color="#f59e0b"
          progress={avgMatchScore}
        />
        <MetricCard 
          label="Top Candidate" 
          value={topCandidateResult?.matchScore || "—"} 
          context={topCandidateResult 
            ? `${(typeof topCandidateResult.applicantId === 'object' ? topCandidateResult.applicantId.firstName : 'Candidate')} · ${jobs.find(j => j._id === topCandidateResult.jobId)?.roleTitle || 'Role'}`
            : "No candidates yet"
          } 
          color="#6c3eb8"
          progress={topCandidateResult?.matchScore || 0}
        />
      </div>

      {/* SECTION 3: TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-[16px]">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-[16px]">
          {/* Recruitment Pipeline Funnel */}
          <div className="bg-white rounded-[14px] border border-black/[0.07] p-[20px_22px]">
            <div className="flex items-center justify-between mb-6">
              <h3 style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "16px" }}>Recruitment Pipeline</h3>
              <Link href="/jobs" className="text-[#2563EB] text-[13px] font-semibold flex items-center gap-1 hover:underline">
                All jobs <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="flex items-end justify-between gap-1 mb-10">
              <FunnelStage label="Applied" count={appliedCount} height={80} color="#2563EB" />
              <ChevronRight size={16} className="text-gray-300 mb-2" />
              <FunnelStage label="Screened" count={screenedCount} height={64} color="#10b981" conversion={appliedCount > 0 ? Math.round((screenedCount/appliedCount)*100) : 0} />
              <ChevronRight size={16} className="text-gray-300 mb-2" />
              <FunnelStage label="Shortlisted" count={shortlistedCount} height={48} color="#6c3eb8" conversion={screenedCount > 0 ? 100 : 0} />
              <ChevronRight size={16} className="text-gray-300 mb-2" />
              <FunnelStage label="Reviewed" count={reviewedCount || "—"} height={32} color="#f59e0b" />
              <ChevronRight size={16} className="text-gray-300 mb-2" />
              <FunnelStage label="Hired" count={hiredCount || "—"} height={16} color="#10b981" />
            </div>

            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-gray-100">
              <StatBox label="Avg time to screen" value="6.8d" />
              <StatBox label="Shortlist rate" value={appliedCount > 0 ? `${Math.round((shortlistedCount/appliedCount)*100)}%` : "—"} />
              <StatBox label="Hire rate" value="—" />
              <StatBox label="Avg AI score" value={avgMatchScore ? `${avgMatchScore}%` : "—"} />
            </div>
          </div>

          {/* Jobs List */}
          <div className="bg-white rounded-[14px] border border-black/[0.07] p-[20px_22px]">
            <div className="flex items-center justify-between mb-2">
              <h3 style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "16px" }}>Your Postings</h3>
              <div className="flex items-center gap-2 text-[12px] text-gray-500">
                Sort by: 
                <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 transition-colors">
                  Urgency <ChevronDown size={12} />
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {filteredJobsList.length > 0 ? (
                filteredJobsList.slice(0, 6).map(job => (
                  <JobRow 
                    key={job._id} 
                    job={job} 
                    shortlist={shortlists[job._id]}
                    applicantsCount={2}
                  />
                ))
              ) : (
                <div className="py-12 text-center">
                  <p className="text-gray-400 text-[13px]">No postings match &quot;{searchTerm}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-[16px]">
          {/* Pipeline Health */}
          <HealthCard screenedJobs={screenedJobsCount} totalJobs={totalJobs} avgScore={avgMatchScore} />

          {/* Top Candidates */}
          <TopCandidatesCard results={allResults} jobs={jobs} />

          {/* Recent Activity */}
          <RecentActivityCard jobs={jobs} shortlists={shortlists} />
        </div>

      </div>
    </div>
  );
}

// ─── Sub-Components ───────────────────────────

function AttentionPanel({ items }: { items: any[] }) {
  const router = Link;
  return (
    <div className="bg-[#0f1623] rounded-[16px] p-[20px_24px] flex flex-col md:flex-row items-center gap-5">
      <div className="w-11 h-11 bg-red-900/40 rounded-xl flex items-center justify-center shrink-0 border border-red-800/50 shadow-lg shadow-red-900/20">
        <Zap size={22} className="text-red-400 fill-red-400" />
      </div>
      
      <div className="flex-1 space-y-2">
        <h4 style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "15px" }} className="text-white">
          {items.length} things need your attention today
        </h4>
        <div className="space-y-1.5">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 text-[13px]">
              {item.type === "urgent" && <AlertCircle size={14} className="text-[#fca5a5]" />}
              {item.type === "warn" && <AlertTriangle size={14} className="text-[#fcd34d]" />}
              {item.type === "ok" && <CheckCircle2 size={14} className="text-[#6ee7b7]" />}
              <span className={item.type === "urgent" ? "text-[#fca5a5] font-medium" : item.type === "warn" ? "text-[#fcd34d]" : "text-[#6ee7b7]"}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
        <button className="bg-[#2563EB] text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-900/30">
          Run Screening →
        </button>
        <button className="text-white border border-white/20 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-white/5 transition-all">
          Review Shortlist
        </button>
      </div>
    </div>
  );
}

function MetricCard({ label, value, context, color, progress, trend }: any) {
  return (
    <div className="bg-white rounded-[14px] border border-black/[0.07] p-[18px_20px] relative overflow-hidden group hover:shadow-lg hover:shadow-black/5 transition-all cursor-default">
      <div className="absolute top-0 left-0 w-full h-[3px]" style={{ backgroundColor: color }} />
      
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{label}</span>
        {trend && (
          <div className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5">
            <TrendingUp size={10} /> {trend}
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span 
          style={{ fontFamily: BRICOLAGE, fontWeight: 800, fontSize: "30px", letterSpacing: "-1px", color }}
        >
          {value}
        </span>
      </div>

      <p className="text-[12px] text-gray-500 mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
        {context}
      </p>

      <div className="w-full h-[3px] bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function FunnelStage({ label, count, height, color, conversion }: any) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 group">
      <div 
        className="w-full rounded-md transition-all duration-500 group-hover:brightness-95" 
        style={{ height: `${height}px`, backgroundColor: color + "33" }} // Dim background
      >
        <div 
          className="w-full h-full rounded-md opacity-20" 
          style={{ backgroundColor: color }}
        ></div>
      </div>
      <div className="flex flex-col items-center">
        <span style={{ fontFamily: BRICOLAGE, fontWeight: 800, fontSize: "18px" }}>{count}</span>
        <span className="text-[10.5px] uppercase font-bold text-gray-400 tracking-tight">{label}</span>
        {conversion !== undefined && (
          <span className="text-[10px] font-bold" style={{ color }}>{conversion}%</span>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string }) {
  return (
    <div className="bg-gray-50/80 rounded-lg p-2 text-center border border-gray-100">
      <div style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "14px" }}>{value}</div>
      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{label}</div>
    </div>
  );
}

function JobRow({ job, shortlist, applicantsCount }: { job: Job, shortlist?: ScreeningResult[], applicantsCount: number }) {
  const getJobIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes("ai") || t.includes("ml") || t.includes("machine learning") || t.includes("llm"))
      return { Icon: BrainCircuit, bg: "#7C3AED", color: "#ffffff", border: "#6D28D9" };
    if (t.includes("design") || t.includes("ux") || t.includes("ui") || t.includes("figma"))
      return { Icon: PenTool,     bg: "#E11D48", color: "#ffffff", border: "#BE123C" };
    if (t.includes("mobile") || t.includes("ios") || t.includes("android") || t.includes("react native"))
      return { Icon: Smartphone,  bg: "#EA580C", color: "#ffffff", border: "#C2410C" };
    if (t.includes("data") || t.includes("analyst") || t.includes("analytics") || t.includes("qa") || t.includes("test"))
      return { Icon: BarChart2,   bg: "#D97706", color: "#ffffff", border: "#B45309" };
    if (t.includes("backend") || t.includes("back-end") || t.includes("server") || t.includes("node"))
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
  };

  const { Icon, bg, color, border } = getJobIcon(job.roleTitle);
  const topScore = shortlist && shortlist.length > 0 
    ? Math.max(...shortlist.map(r => r.matchScore)) 
    : null;

  const scoreColorClass = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 65) return "text-amber-600";
    return "text-red-600";
  };

  return (
    <div className="flex items-center gap-3 py-4 group hover:bg-gray-50/80 -mx-4 px-4 transition-all border-b border-gray-100 last:border-0">
      <div 
        className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 shadow-sm"
        style={{ background: bg, border: `1.5px solid ${border}` }}
      >
        <Icon size={18} color={color} strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-[14px] truncate" style={{ color: "var(--text2)" }}>{job.roleTitle}</span>
          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
            job.status === "Open" ? "bg-blue-50 text-blue-600 border border-blue-100" :
            job.status === "Closed" ? "bg-gray-100 text-gray-500" :
            "bg-amber-50 text-amber-600 border border-amber-100"
          }`}>
            {job.status}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 mb-2">
          {timeAgo(job.createdAt)} · {applicantsCount} applicants · Shortlist: {job.shortlistSize}
        </div>
        <div className="flex gap-1">
          <div className="h-[3px] rounded-full flex-1 bg-blue-500" />
          <div className={`h-[3px] rounded-full flex-1 ${shortlist ? 'bg-green-500' : 'bg-gray-100'}`} />
          <div className={`h-[3px] rounded-full flex-1 ${shortlist ? 'bg-green-500' : 'bg-gray-100'}`} />
          <div className={`h-[3px] rounded-full flex-1 bg-gray-100`} />
        </div>
      </div>

      <div className="text-right shrink-0">
        {topScore !== null ? (
          <div>
            <div 
              style={{ fontFamily: BRICOLAGE, fontWeight: 800, fontSize: "17px" }}
              className={scoreColorClass(topScore)}
            >
              {topScore}
            </div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">top score</div>
          </div>
        ) : (
          <div>
            <div style={{ fontFamily: BRICOLAGE, fontWeight: 800, fontSize: "17px" }} className="text-gray-300">—</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase">pending</div>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthCard({ screenedJobs, totalJobs, avgScore }: any) {
  const screeningPct = totalJobs > 0 ? (screenedJobs / totalJobs) * 100 : 0;
  const healthScore = Math.min(100, Math.round((screeningPct * 0.4) + (avgScore * 0.4) + 20));

  const data = [
    { name: 'Health', value: healthScore },
    { name: 'Remaining', value: 100 - healthScore },
  ];
  const COLORS = ['#0a8a5c', '#eef0f4'];

  return (
    <div className="bg-white rounded-[14px] border border-black/[0.07] p-[20px_22px]">
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "15px" }}>Pipeline Health</h3>
        <Link href="#" className="text-gray-400 text-[11px] font-bold hover:text-[var(--accent)] flex items-center gap-1 transition-colors">
          Details <ArrowRight size={12} />
        </Link>
      </div>

      <div className="flex items-center gap-5 mb-5">
        <div className="relative w-[90px] h-[90px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={45}
                paddingAngle={0}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span style={{ fontFamily: BRICOLAGE, fontWeight: 800, fontSize: "22px" }} className="text-[#0a8a5c] leading-none">{healthScore}</span>
            <span className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">Score</span>
          </div>
        </div>
        
        <div className="flex-1 space-y-3">
          <FactorBar label="Screening" value={Math.round(screeningPct)} color="#0a8a5c" />
          <FactorBar label="AI Quality" value={avgScore} color="#f59e0b" />
          <FactorBar label="Speed" value={72} color="#2563EB" />
          <FactorBar label="Diversity" value={90} color="#6c3eb8" />
        </div>
      </div>
    </div>
  );
}

function FactorBar({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-bold text-gray-500 uppercase w-[65px]">{label}</span>
      <div className="flex-1 h-[4px] bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-[10px] font-bold text-gray-700 w-[24px] text-right">{value}%</span>
    </div>
  );
}

function TopCandidatesCard({ results, jobs }: { results: ScreeningResult[], jobs: Job[] }) {
  const topCandidates = [...results]
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);

  const colors = ["bg-green-100 text-green-700", "bg-blue-100 text-blue-700", "bg-purple-100 text-purple-700", "bg-amber-100 text-amber-700", "bg-red-100 text-red-700"];
  const ranks = ["#d97706", "#64748b", "#9a6b4b", "gray", "gray"];

  if (topCandidates.length === 0) {
    return (
      <div className="bg-white rounded-[14px] border border-black/[0.07] p-[20px_22px]">
        <h3 className="mb-8" style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "15px" }}>Top Candidates</h3>
        <EmptyState 
          title="No candidates yet" 
          description="Run AI screening to see top candidates here." 
          compact
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[14px] border border-black/[0.07] p-[20px_22px]">
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "15px" }}>Top Candidates</h3>
        <Link href="/shortlists" className="text-gray-400 text-[11px] font-bold hover:text-[var(--accent)] flex items-center gap-1 transition-colors">
          View all <ArrowRight size={12} />
        </Link>
      </div>

      <div className="space-y-4">
        {topCandidates.map((res, i) => {
          const applicant = typeof res.applicantId === "object" ? res.applicantId : null;
          const name = applicant ? `${applicant.firstName} ${applicant.lastName}` : "Candidate";
          const role = jobs.find(j => j._id === res.jobId)?.roleTitle || "Role";
          
          return (
            <div key={res._id} className="flex items-center gap-3">
              <span className="text-[12px] font-bold w-5 shrink-0" style={{ color: ranks[i] || 'gray' }}>#{i+1}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${colors[i % colors.length]}`}>
                {getInitials(name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] truncate" style={{ color: "var(--text2)" }}>{name}</div>
                <div className="text-[10px] text-gray-500 truncate">{role} · 5yr</div>
              </div>
              <div 
                style={{ fontFamily: BRICOLAGE, fontWeight: 800, fontSize: "16px" }}
                className={res.matchScore >= 80 ? 'text-green-600' : res.matchScore >= 65 ? 'text-amber-600' : 'text-red-600'}
              >
                {res.matchScore}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ActivityItem {
  id: string;
  text: string;
  sub?: string;
  time: string | number | Date;
  color: string;
}

function RecentActivityCard({ jobs, shortlists }: { jobs: Job[], shortlists: Record<string, ScreeningResult[]> }) {
  const activities: ActivityItem[] = [];

  // derive from state
  Object.keys(shortlists).forEach(jobId => {
    const job = jobs.find(j => j._id === jobId);
    const results = shortlists[jobId];
    if (job && results.length > 0) {
      activities.push({
        id: `activity-screen-${jobId}`,
        text: `AI screened ${results.length} candidates for ${job.roleTitle}`,
        sub: `${results.filter(r => r.matchScore >= 80).length} shortlisted`,
        time: results[0].createdAt,
        color: "#10b981"
      });
    }
  });

  jobs.filter(j => j.status === "Open").forEach(job => {
    activities.push({
      id: `activity-open-${job._id}`,
      text: `${job.roleTitle} is open and awaiting applicants`,
      time: job.createdAt,
      color: "#2563EB"
    });
  });

  const sortedActivities = activities
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  return (
    <div className="bg-white rounded-[14px] border border-black/[0.07] p-[20px_22px]">
      <div className="flex items-center justify-between mb-5">
        <h3 style={{ fontFamily: BRICOLAGE, fontWeight: 700, fontSize: "15px" }}>Recent Activity</h3>
        <button className="text-gray-400 text-[11px] font-bold hover:text-[var(--accent)] flex items-center gap-1 transition-colors">
          All <ArrowRight size={12} />
        </button>
      </div>

      <div className="space-y-4">
        {sortedActivities.map(act => (
          <div key={act.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0">
            <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: act.color }} />
            <div>
              <p className="text-[13px] leading-tight" style={{ color: "var(--text2)" }}>
                {act.text} {act.sub && <span className="text-gray-400">— {act.sub}</span>}
              </p>
              <span className="text-[11px] text-gray-400">{timeAgo(act.time)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
