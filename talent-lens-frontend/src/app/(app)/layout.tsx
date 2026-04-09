"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6"
          style={{ background: "var(--bg)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
