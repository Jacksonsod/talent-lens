"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  ListChecks,
  GitCompare,
  Upload,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

/* ─── nav tree ────────────────────────────────────────────────── */
type NavChild = { label: string; href: string };
type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  children?: NavChild[];
};

const navItems: NavItem[] = [
  { label: "Dashboard",  href: "/dashboard",  icon: LayoutDashboard },
  {
    label: "Jobs",
    href: "/jobs",
    icon: Briefcase,
    badge: "3",
    children: [
      { label: "All Jobs",  href: "/jobs" },
      { label: "Create Job", href: "/jobs/new" },
    ],
  },
  { label: "Shortlists", href: "/shortlists", icon: ListChecks },
  { label: "Compare",    href: "/compare",    icon: GitCompare },
  { label: "Upload CVs", href: "/upload",     icon: Upload },
];

/* ─── component ───────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  // track which group is open (by href)
  const [openGroup, setOpenGroup] = useState<string | null>("/jobs");

  const isActive = (href: string) => {
    if (pathname === href) return true;
    return pathname.startsWith(href + "/");
  };

  const toggleGroup = (href: string) =>
    setOpenGroup((prev) => (prev === href ? null : href));

  /* ── sidebar width ── */
  const W = collapsed ? "72px" : "230px";

  return (
    <aside
      className="flex flex-col shrink-0 h-screen transition-all duration-300 overflow-hidden"
      style={{
        width: W,
        minWidth: W,
        background: "#2563EB",
      }}
    >
      {/* ── Header: logo + collapse btn ── */}
      <div
        className="flex items-center justify-between px-4 pt-5 pb-5"
        style={{ 
          minHeight: 64,
          borderBottom: "1px solid rgba(255,255,255,0.12)"
        }}
      >
        {!collapsed && (
          <div className="flex flex-col leading-none mt-1">
            <span
              className="font-display font-extrabold text-[20px] tracking-tight text-white mb-0.5"
              style={{ letterSpacing: "-0.5px" }}
            >
              TalentAI<span className="text-white">.</span>
            </span>
            <span
              className="text-[9px] tracking-widest uppercase font-semibold"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Powered by Umurava
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center rounded-lg transition-all duration-150 shrink-0"
          style={{
            width: 30,
            height: 30,
            border: "1.5px solid rgba(255,255,255,0.45)",
            background: "transparent",
            color: "#fff",
            marginLeft: collapsed ? "auto" : 0,
            marginRight: collapsed ? "auto" : 0,
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* ── Main nav ── */}
      <nav className="flex-1 overflow-y-auto px-3 mt-4 flex flex-col gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const hasChildren = !!item.children?.length;
          const isOpen = openGroup === item.href;

          return (
            <div key={item.href}>
              {/* ── parent row ── */}
              {hasChildren ? (
                /* clickable div to toggle group */
                <button
                  onClick={() => toggleGroup(item.href)}
                  className="w-full flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-150"
                  style={{
                    padding: "10px 12px",
                    background: active ? "#FFFFFF" : isOpen ? "rgba(255,255,255,0.12)" : "transparent",
                    color: active ? "#2563EB" : "rgba(255,255,255,0.92)",
                    textAlign: "left",
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{
                            background:
                              active 
                                ? "rgba(37,99,235,0.14)"
                                : "rgba(255,255,255,0.18)",
                            color: active ? "#2563EB" : "#fff",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronUp size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                      ) : (
                        <ChevronDown size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                      )}
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-150"
                  style={{
                    padding: "10px 12px",
                    background: active ? "#FFFFFF" : "transparent",
                    color: active ? "#2563EB" : "rgba(255,255,255,0.92)",
                  }}
                  title={collapsed ? item.label : undefined}
                  onMouseEnter={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.background =
                        "rgba(255,255,255,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active)
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                  }}
                >
                  <Icon size={16} style={{ flexShrink: 0 }} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span
                          className="text-[11px] px-1.5 py-0.5 rounded-full font-bold"
                          style={{
                            background: active
                              ? "rgba(37,99,235,0.14)"
                              : "rgba(255,255,255,0.18)",
                            color: active ? "#2563EB" : "#fff",
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )}

              {/* ── children (sub-items) ── */}
              {hasChildren && isOpen && !collapsed && (
                <div className="mt-0.5 mb-1 ml-4 flex flex-col gap-0.5 border-l border-white/20 pl-3">
                  {item.children!.map((child) => {
                    const childActive = isActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="flex items-center gap-2 rounded-lg text-[12.5px] font-medium transition-all duration-150"
                        style={{
                          padding: "7px 10px",
                          background: childActive
                            ? "rgba(255,255,255,0.18)"
                            : "transparent",
                          color: childActive
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.72)",
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive)
                            (e.currentTarget as HTMLElement).style.color =
                              "#FFFFFF";
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive)
                            (e.currentTarget as HTMLElement).style.color =
                              "rgba(255,255,255,0.72)";
                        }}
                      >
                        <span
                          className="w-1 h-1 rounded-full shrink-0"
                          style={{
                            background: childActive
                              ? "#fff"
                              : "rgba(255,255,255,0.45)",
                          }}
                        />
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Recruiter profile card ── */}
      <div
        className="px-3 py-3"
        style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}
      >
        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-150 cursor-pointer"
          style={{ background: "rgba(255,255,255,0.10)" }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.16)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.background =
              "rgba(255,255,255,0.10)")
          }
        >
          {/* Avatar */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0"
            style={{
              background: "rgba(255,255,255,0.22)",
              border: "1.5px solid rgba(255,255,255,0.35)",
              color: "#fff",
            }}
          >
            HR
          </div>

          {/* Name + role */}
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div
                className="text-[13px] font-semibold truncate leading-tight"
                style={{ color: "#FFFFFF" }}
              >
                Hope Rukundo
              </div>
              <div
                className="text-[11px] truncate leading-tight mt-0.5"
                style={{ color: "rgba(255,255,255,0.60)" }}
              >
                Recruiter
              </div>
            </div>
          )}

          {/* Dots menu */}
          {!collapsed && (
            <div
              className="flex flex-col gap-[3px] shrink-0"
              style={{ opacity: 0.55 }}
            >
              <span className="w-1 h-1 rounded-full bg-white block" />
              <span className="w-1 h-1 rounded-full bg-white block" />
              <span className="w-1 h-1 rounded-full bg-white block" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
