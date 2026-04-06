"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/jobs": "All Jobs",
  "/jobs/new": "Create New Job",
  "/upload": "Upload CVs / Resumes",
  "/compare": "Compare Candidates",
  "/shortlists": "Shortlists",
};

export default function Topbar() {
  const pathname = usePathname();

  const title =
    Object.entries(pageTitles).find(([key]) =>
      pathname === key || pathname.startsWith(key + "/")
    )?.[1] ?? "TalentAI";

  return (
    <header
      className="flex items-center justify-between px-7 py-4 shrink-0"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <h1
        className="font-display font-bold text-xl tracking-tight"
        style={{ color: "#f0f0f5" }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-2.5">
        <Link
          href="/upload"
          className="px-4 py-2 rounded-lg text-[13px] font-medium border transition-colors"
          style={{
            background: "transparent",
            borderColor: "rgba(255,255,255,0.12)",
            color: "#9090a8",
          }}
        >
          Upload CVs
        </Link>
        <Link
          href="/jobs/new"
          className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
          style={{ background: "#7c6fff", color: "#fff" }}
        >
          + New Job
        </Link>
      </div>
    </header>
  );
}
