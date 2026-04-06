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
        style={{ color: "var(--text)" }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-2.5">
        <Link
          href="/upload"
          className="btn btn-ghost"
        >
          Upload CVs
        </Link>
        <Link
          href="/jobs/new"
          className="btn btn-primary"
        >
          + New Job
        </Link>
      </div>
    </header>
  );
}
