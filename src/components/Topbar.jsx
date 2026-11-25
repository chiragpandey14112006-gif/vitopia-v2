import React, { useState } from "react";
import { LogOut, Menu, RefreshCw, X } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getLevel, getLevelProgress } from "../data/seedData";

const NAV_ITEMS = [
  { id: "home", label: "DASHBOARD" },
  { id: "map", label: "CAMPUS_MAP" },
  { id: "tt", label: "CHRONOS" },
  { id: "cal", label: "NEURAL_CAL" },
  { id: "exam", label: "EXAM_TERM" },
  { id: "book", label: "TERM_BOOK" },
  { id: "mybk", label: "MY_SLOTS" },
  { id: "vault", label: "⬡ VAULT", accent: "vault" },
  { id: "reddit", label: "REDDIT", accent: "red" },
  { id: "proctor", label: "PROCTOR_CHAT" },
  { id: "admin", label: "ADMIN_PORT", accent: "adm" },
];

export default function Topbar() {
  const { user, activeView, setActiveView, logout, apiStatus, syncDashboard } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const xp = user?.xp ?? 1240;
  const lvl = getLevel(xp);
  const prog = getLevelProgress(xp);

  const btnClasses = (item) => {
    const active = activeView === item.id;
    const base =
      "font-orbitron text-[8.5px] px-2.5 py-1.5 rounded-sm border transition whitespace-nowrap tracking-wider ";
    if (item.accent === "adm") {
      return (
        base +
        (active
          ? "text-[var(--no)] border-[var(--no)] shadow-[0_0_8px_rgba(255,102,0,0.4)]"
          : "text-slate-500 border-transparent hover:text-[var(--no)] hover:border-[var(--no)]")
      );
    }
    if (item.accent === "red") {
      return (
        base +
        (active
          ? "text-[#ff4500] border-[#ff4500] shadow-[0_0_8px_rgba(255,69,0,0.4)]"
          : "text-slate-500 border-transparent hover:text-[#ff4500] hover:border-[#ff4500]")
      );
    }
    if (item.accent === "vault") {
      return (
        base +
        (active
          ? "text-[var(--ng)] border-[var(--ng)] shadow-[0_0_8px_rgba(0,255,136,0.4)]"
          : "text-emerald-400/80 border-transparent hover:text-[var(--ng)] hover:border-[var(--ng)]")
      );
    }
    return (
      base +
      (active
        ? "text-[var(--nb)] border-[var(--nb)] shadow-[0_0_8px_rgba(0,243,255,0.4)]"
        : "text-slate-500 border-transparent hover:text-[var(--nb)] hover:border-[var(--nb)]")
    );
  };

  return (
    <header className="sticky top-0 z-[500] bg-[#04040a]/95 backdrop-blur-md border-b border-[var(--nb)] shadow-[0_2px_24px_rgba(0,243,255,0.12)]">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-[54px] flex items-center justify-between gap-3">
        {/* Brand */}
        <div
          className="flex flex-col shrink-0 cursor-pointer"
          onClick={() => setActiveView("home")}
        >
          <div className="flex items-baseline gap-1.5">
            <span className="logo-3d-top">VITOPIA</span>
            <span className="text-[7px] text-cyan-400/60 font-mono">v2.0</span>
          </div>
          <span className="text-[7px] text-cyan-400/40 tracking-[2px] leading-none mt-0.5">
            // CAMPUS_OS
          </span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={btnClasses(item)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* XP Bar */}
          <div className="hidden sm:flex items-center gap-2 pr-3 border-r border-[var(--bd)]">
            <span className="font-orbitron text-[7px] text-cyan-400/70 tracking-wider">
              LVL
            </span>
            <span className="font-orbitron text-[10px] text-[var(--ng)] drop-shadow-[0_0_6px_var(--ng)]">
              {lvl}
            </span>
            <div className="w-16 h-1.5 bg-[#050511] rounded-full overflow-hidden border border-[var(--bd)]">
              <div
                className="h-full transition-all duration-500"
                style={{
                  width: `${prog}%`,
                  background: "linear-gradient(90deg, var(--ng), var(--nb))",
                }}
              />
            </div>
            <span className="text-[8px] text-slate-400 font-mono">{xp} XP</span>
          </div>

          {/* API Status + Sync */}
          <button
            onClick={() => syncDashboard(user?.reg_no)}
            title="Sync campus state"
            className="hidden md:flex items-center gap-1 text-[8px] font-orbitron px-2 py-1 rounded-sm border border-[var(--bd)] hover:border-[var(--nb)] text-slate-400 hover:text-[var(--nb)] transition"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                apiStatus === "online" ? "bg-[var(--ng)]" : "bg-[var(--no)]"
              }`}
            />
            <RefreshCw size={10} />
          </button>

          {/* User Pill */}
          <div className="text-right pl-2 border-l border-[var(--bd)]">
            <div className="font-orbitron text-[10px] text-[var(--np)] leading-tight flex items-center justify-end gap-1.5">
              {user?.vtop_synced ? (
                <span className="text-[7px] px-1 py-0.2 bg-emerald-500/15 border border-emerald-400/50 text-[var(--ng)] rounded-sm">
                  VTOP
                </span>
              ) : null}
              <span>{user?.name || "Student"}</span>
            </div>
            <div className="text-[8px] text-slate-500 font-mono">
              {user?.reg_no} · {user?.semester || "SEM-4"}
            </div>
          </div>

          <button
            onClick={logout}
            title="Switch account / Logout"
            className="p-1.5 border border-[var(--bd)] hover:border-[var(--nr)] text-slate-400 hover:text-[var(--nr)] rounded-sm transition"
          >
            <LogOut size={13} />
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="xl:hidden p-1.5 border border-[var(--bd)] text-[var(--nb)] rounded-sm"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {/* Tablet/Mobile Nav Strip */}
      <div className="hidden md:flex xl:hidden border-t border-[var(--bd)]/70 px-3 py-1.5 gap-1 overflow-x-auto">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={btnClasses(item)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Mobile Dropdown Nav */}
      {mobileOpen && (
        <div className="xl:hidden bg-[#060613] border-t border-[var(--nb)]/30 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setMobileOpen(false);
              }}
              className={btnClasses(item) + " text-left"}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
