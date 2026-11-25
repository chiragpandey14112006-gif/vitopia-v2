import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function BadgeDock() {
  const { user, bookings } = useApp();
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(null);

  const hour = new Date().getHours();
  const badges = [
    {
      id: "early",
      icon: "🌅",
      title: "EARLY_BIRD // MORNING_STREAK",
      desc:
        hour <= 9
          ? "ACTIVE NOW: Morning streak bonus unlocked (+25 XP before 9AM)."
          : "8AM attendance streak maintained · +25 XP on early login.",
      active: hour <= 9,
    },
    {
      id: "owl",
      icon: "🦉",
      title: "NIGHT_OWL // LATE_LABS",
      desc:
        hour >= 20
          ? "ACTIVE NOW: Late-evening lab focus mode engaged."
          : "Regular bookings after 8 PM in CS labs unlock priority mode.",
      active: hour >= 20,
    },
    {
      id: "book",
      icon: "📚",
      title: "BOOKWORM // LIBRARY_CORE",
      desc: `XP ${user?.xp || 1240} tracked across Data Vault & Academic Library sessions.`,
      active: (user?.xp || 0) >= 1200,
    },
    {
      id: "speed",
      icon: "⚡",
      title: "SPEED_RUN // SLOT_HUNTER",
      desc: `${bookings.length}/3 concurrent resource slot(s) currently locked.`,
      active: bookings.length > 0,
    },
  ];

  return (
    <div className="fixed right-3 bottom-3 z-[800] max-w-[270px] bg-[#030310]/95 border border-cyan-400/25 rounded-lg px-2.5 py-2 shadow-[0_0_20px_rgba(0,243,255,0.28)] backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[8px] text-cyan-400/75 tracking-[1.5px] uppercase">
          // PLAY_STYLE_TRACKER
        </span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-cyan-400/60 hover:text-cyan-300"
          title="Toggle tracker"
        >
          {collapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {!collapsed && (
        <div className="relative mt-1.5">
          <div className="flex gap-1.5 items-center justify-end">
            {badges.map((b) => (
              <div
                key={b.id}
                onMouseEnter={() => setHovered(b)}
                onMouseLeave={() => setHovered(null)}
                className={`text-sm px-2 py-1 rounded-full border transition cursor-pointer ${
                  b.active
                    ? "border-cyan-400/70 bg-cyan-500/15 shadow-[0_0_12px_rgba(0,243,255,0.35)] scale-105"
                    : "border-white/10 bg-purple-500/10 opacity-75 hover:opacity-100"
                }`}
              >
                {b.icon}
              </div>
            ))}
          </div>

          {hovered && (
            <div className="absolute bottom-full right-0 mb-2 w-60 bg-[#050513] border border-[var(--nb)]/60 rounded p-2.5 text-[9px] shadow-[0_0_20px_rgba(0,243,255,0.25)] pointer-events-none">
              <div className="font-orbitron text-[8px] text-[var(--nb)] mb-1">
                {hovered.title}
              </div>
              <div className="text-slate-300 leading-relaxed">{hovered.desc}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
