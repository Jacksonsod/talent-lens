"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Plus, Upload } from "lucide-react";

interface TopbarProps {
  onMenuClick: () => void;
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/jobs": "All Jobs",
  "/jobs/new": "Create New Job",
  "/upload": "Upload CVs / Resumes",
  "/compare": "Compare Candidates",
  "/shortlists": "Shortlists",
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();

  // Check for exact match first, then fall back to startsWith (sorted by length to match deeper routes first)
  const title =
    pageTitles[pathname] ||
    (Object.entries(pageTitles)
      .sort((a, b) => b[0].length - a[0].length)
      .find(([key]) => pathname.startsWith(key + "/"))?.[1] ??
      "TalentAI");

  return (
    <header
      className="flex items-center justify-between px-4 md:px-7 py-4 shrink-0"
      style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-[var(--surface2)]"
          style={{ color: "var(--text)" }}
        >
          <Menu size={20} />
        </button>
        <h1
          className="font-display font-bold text-lg md:text-xl tracking-tight truncate max-w-[150px] sm:max-w-none"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/upload"
          className="btn btn-ghost hidden sm:flex h-10"
        >
          <Upload size={16} className="md:mr-2" />
          <span className="hidden md:inline">Upload CVs</span>
        </Link>
        <Link
          href="/jobs/new"
          className="btn btn-primary h-10 px-3 md:px-5"
        >
          <Plus size={16} className="md:mr-2" />
          <span className="hidden md:inline">New Job</span>
          <span className="md:hidden">Add</span>
        </Link>
      </div>
    </header>
  );
}
