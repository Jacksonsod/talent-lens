"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/helpers";
import {
  LayoutDashboard,
  Briefcase,
  ListChecks,
  GitCompare,
  Upload,
  Plus,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Jobs", href: "/jobs", icon: Briefcase, badge: "3" },
  { label: "Shortlists", href: "/shortlists", icon: ListChecks },
  { label: "Compare", href: "/compare", icon: GitCompare },
];

const toolItems = [
  { label: "Upload CVs", href: "/upload", icon: Upload },
  { label: "New Job", href: "/jobs/new", icon: Plus },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside
      className="w-[220px] flex flex-col shrink-0 h-screen"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-5"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div
          className="font-display font-black text-lg tracking-tight"
          style={{ color: "#f0f0f5" }}
        >
          TalentAI
        </div>
        <div
          className="text-[10px] tracking-widest uppercase mt-0.5"
          style={{ color: "#5a5a72" }}
        >
          Powered by Umurava
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-4 overflow-y-auto">
        <NavSection label="Main" items={navItems} isActive={isActive} />
        <NavSection label="Tools" items={toolItems} isActive={isActive} />
      </nav>

      {/* User */}
      <div
        className="px-5 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{
              background: "rgba(124,111,255,0.15)",
              border: "1px solid rgba(124,111,255,0.4)",
              color: "#7c6fff",
            }}
          >
            HR
          </div>
          <div>
            <div className="text-[13px] font-medium" style={{ color: "#f0f0f5" }}>
              Hope Rukundo
            </div>
            <div className="text-[11px]" style={{ color: "#5a5a72" }}>
              Recruiter
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function NavSection({
  label,
  items,
  isActive,
}: {
  label: string;
  items: typeof navItems;
  isActive: (href: string) => boolean;
}) {
  return (
    <div className="mb-2">
      <div
        className="text-[10px] font-semibold tracking-widest uppercase px-2 mb-1.5 mt-4"
        style={{ color: "#5a5a72" }}
      >
        {label}
      </div>
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13.5px] mb-0.5 transition-all",
              active
                ? "text-[#7c6fff]"
                : "hover:text-[#f0f0f5]"
            )}
            style={{
              color: active ? "#7c6fff" : "#9090a8",
              background: active ? "rgba(124,111,255,0.12)" : "transparent",
            }}
          >
            <Icon size={15} />
            <span>{item.label}</span>
            {"badge" in item && item.badge && (
              <span
                className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(124,111,255,0.15)",
                  color: "#7c6fff",
                }}
              >
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
