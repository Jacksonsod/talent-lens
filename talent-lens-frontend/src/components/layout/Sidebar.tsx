"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  LogOut,
  X,
} from "lucide-react";

import ConfirmModal from "@/components/ui/ConfirmModal";

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

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>("/jobs");
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isActive = (href: string, exact = false) => {
    if (pathname === href) return true;
    if (exact) return false;

    // If we are on a specific job's shortlist, highlight "Shortlists" instead of "Jobs"
    if (pathname.includes("/shortlist")) {
      if (href === "/shortlists") return true;
      if (href === "/jobs") return false;
    }

    return pathname.startsWith(href + "/");
  };

  const toggleGroup = (href: string) =>
    setOpenGroup((prev) => (prev === href ? null : href));

  const executeLogout = () => {
    localStorage.removeItem("token");
    setShowLogoutModal(false);
    router.push("/login");
  };

  const W = collapsed ? "72px" : "230px";

  return (
    <>
      {/* ── Overlay for mobile ── */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`flex flex-col shrink-0 h-screen transition-all duration-300 overflow-hidden fixed md:static z-50 ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        style={{
          width: W,
          minWidth: W,
          background: "#2563EB",
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-4 pt-5 pb-5"
          style={{ 
            minHeight: 64,
            borderBottom: "1px solid rgba(255,255,255,0.12)"
          }}
        >
          {!collapsed && (
            <div className="flex flex-col leading-none mt-1">
              <span className="font-display font-extrabold text-[20px] tracking-tight text-white mb-0.5">
                TalentAI<span className="text-white">.</span>
              </span>
              <span className="text-[9px] tracking-widest uppercase font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>
                Powered by Umurava
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex items-center justify-center rounded-lg transition-all duration-150 shrink-0"
            style={{
              width: 30,
              height: 30,
              border: "1.5px solid rgba(255,255,255,0.45)",
              background: "transparent",
              color: "#fff",
              marginLeft: collapsed ? "auto" : 0,
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto px-3 mt-4 flex flex-col gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const hasChildren = !!item.children?.length;
            const isOpen = openGroup === item.href;

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <button
                    onClick={() => toggleGroup(item.href)}
                    className="w-full flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-150"
                    style={{
                      padding: "10px 12px",
                      background: active ? "#FFFFFF" : isOpen ? "rgba(255,255,255,0.12)" : "transparent",
                      color: active ? "#2563EB" : "rgba(255,255,255,0.92)",
                    }}
                  >
                    <Icon size={16} />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {isOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                      </>
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 rounded-xl text-[13.5px] font-medium transition-all duration-150"
                    style={{
                      padding: "10px 12px",
                      background: active ? "#FFFFFF" : "transparent",
                      color: active ? "#2563EB" : "rgba(255,255,255,0.92)",
                    }}
                  >
                    <Icon size={16} />
                    {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
                  </Link>
                )}
                {/* ... children logic ... */}
                {hasChildren && isOpen && !collapsed && (
                  <div className="mt-1 mb-2 ml-4 flex flex-col gap-1 border-l border-white/20 pl-4">
                    {item.children!.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-lg text-[13px] font-medium transition-all duration-150"
                        style={{
                          padding: "9px 12px",
                          color: isActive(child.href, true) ? "#FFFFFF" : "rgba(255,255,255,0.72)",
                          background: isActive(child.href, true) ? "rgba(255,255,255,0.18)" : "transparent",
                        }}
                      >
                         <span className={`w-1 h-1 rounded-full ${isActive(child.href, true) ? 'bg-white' : 'bg-white/40'}`} />
                         {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Logout ── */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-all duration-150 hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.92)" }}
          >
            <LogOut size={16} />
            {!collapsed && <span className="truncate">Logout</span>}
          </button>
        </div>
      </aside>

      {/* ── Logout Confirmation Modal ── */}
      <ConfirmModal
        isOpen={showLogoutModal}
        title="Sign Out"
        description="Are you sure you want to sign out? You will need to log back in to access your projects and shortlists."
        confirmLabel="Sign Out"
        cancelLabel="Stay Logged In"
        onConfirm={executeLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}
