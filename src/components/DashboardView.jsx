import React, { useEffect, useMemo, useState } from "react";
import { RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { RES_ICONS } from "../data/seedData";

export default function DashboardView() {
  const {
    user,
    resources,
    bookings,
    timetable,
    exams,
    calendarEvents,
    aiInsight,
    setAiInsight,
    navigateToCalDate,
    jumpToBookResource,
    setActiveView,
    pushToast,
  } = useApp();

  const [usersOnline, setUsersOnline] = useState(214);
  const [latency, setLatency] = useState("2ms");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const lats = ["1ms", "2ms", "2ms", "3ms", "1ms", "2ms"];
    let li = 0;
    const t1 = setInterval(() => {
      setLatency(lats[li++ % lats.length]);
    }, 2200);
    const t2 = setInterval(() => {
      setUsersOnline((prev) =>
        Math.max(195, Math.min(238, prev + (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1)))
      );
    }, 2800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const handleRefreshAI = async () => {
    if (!user?.reg_no) return;
    setAiLoading(true);
    try {
      const res = await api.refreshInsight(user.reg_no);
      setAiInsight(res);
      pushToast("🧠 Neural analysis refreshed", "var(--np)");
    } catch {
      // keep existing insight
    } finally {
      setAiLoading(false);
    }
  };

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return calendarEvents
      .filter((e) => e.category === "event" || e.category === "fat")
      .map((e) => {
        const d = new Date(e.date_str + "T00:00:00");
        const diff = Math.ceil((d - todayMid) / 86400000);
        return { ...e, diff };
      })
      .filter((e) => e.diff >= 0)
      .slice(0, 5);
  }, [calendarEvents]);

  const avgAttendance = useMemo(() => {
    const seen = new Map();
    timetable.forEach((s) => {
      if (!seen.has(s.course_code) && s.total > 0) {
        seen.set(s.course_code, (s.attended / s.total) * 100);
      }
    });
    if (!seen.size) return 87;
    const sum = Array.from(seen.values()).reduce((a, b) => a + b, 0);
    return Math.round(sum / seen.size);
  }, [timetable]);

  const nextExamDays = useMemo(() => {
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const upcoming = exams
      .filter((e) => e.status !== "COMPLETED")
      .map((e) => Math.ceil((new Date(e.exam_date + "T00:00:00") - todayMid) / 86400000))
      .filter((d) => d >= 0);
    if (!upcoming.length) return "NONE";
    const min = Math.min(...upcoming);
    return min === 0 ? "TODAY" : `${min} DAYS`;
  }, [exams]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      {/* Main Column */}
      <div className="flex flex-col gap-4">
        {/* Stat Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--np)] hover:border-b-[var(--nb)] p-3 text-center rounded transition">
            <div className="text-[8px] text-slate-500 tracking-wider mb-1">USERS_ONLINE</div>
            <div className="font-orbitron text-xl text-[var(--nb)]">{usersOnline}</div>
          </div>
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--np)] hover:border-b-[var(--nb)] p-3 text-center rounded transition">
            <div className="text-[8px] text-slate-500 tracking-wider mb-1">ACTIVE_SLOTS</div>
            <div className="font-orbitron text-xl text-[var(--np)]">{bookings.length}</div>
          </div>
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--np)] hover:border-b-[var(--nb)] p-3 text-center rounded transition">
            <div className="text-[8px] text-slate-500 tracking-wider mb-1">DEMAND_INDEX</div>
            <div
              className="font-orbitron text-lg"
              style={{ color: aiInsight?.demand_color || "var(--nk)" }}
            >
              {aiInsight?.demand || "HIGH"}
            </div>
          </div>
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--np)] hover:border-b-[var(--nb)] p-3 text-center rounded transition">
            <div className="text-[8px] text-slate-500 tracking-wider mb-1">LATENCY</div>
            <div className="font-orbitron text-xl text-[var(--ng)]">{latency}</div>
          </div>
        </div>

        {/* Neural AI Suggestion */}
        <div className="bg-purple-600/5 border border-purple-500/35 rounded p-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="font-orbitron text-[10px] text-[var(--np)] drop-shadow-[0_0_8px_var(--np)] flex items-center gap-1.5">
              <Sparkles size={12} /> [NEURAL_AI_SUGGESTION]
            </span>
            <button
              onClick={handleRefreshAI}
              disabled={aiLoading}
              className="flex items-center gap-1 border border-purple-500/40 text-[var(--np)] hover:bg-purple-500/15 font-orbitron text-[8px] px-2.5 py-1 rounded-sm transition"
            >
              <RefreshCw size={10} className={aiLoading ? "animate-spin" : ""} />
              REFRESH
            </button>
          </div>

          <div className="text-[11px] text-slate-200 leading-relaxed min-h-[34px]">
            {aiLoading ? (
              <span className="flex items-center gap-2 text-purple-300">
                // NEURAL_ANALYSIS <span className="typing-dot" /> <span className="typing-dot" /> <span className="typing-dot" />
              </span>
            ) : (
              aiInsight?.text || "Analyzing campus telemetry and timetable..."
            )}
          </div>

          <div className="mt-3 pt-2.5 border-t border-purple-500/15 grid grid-cols-3 gap-3">
            <div>
              <div className="text-[8px] text-slate-500 tracking-wider mb-1">DEMAND_INDEX</div>
              <div
                className="font-orbitron text-xs"
                style={{ color: aiInsight?.demand_color || "var(--nk)" }}
              >
                {aiInsight?.demand || "—"} ({aiInsight?.demand_pct ?? 0}%)
              </div>
              <div className="h-[3px] bg-[#0a0a14] rounded overflow-hidden mt-1">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${aiInsight?.demand_pct ?? 50}%`,
                    background: aiInsight?.demand_color || "var(--nk)",
                  }}
                />
              </div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500 tracking-wider mb-1">OPTIMAL_LAB</div>
              <div className="font-orbitron text-[11px] text-[var(--nb)] truncate">
                {aiInsight?.optimal_lab || "CS Lab AB1-301"}
              </div>
            </div>
            <div>
              <div className="text-[8px] text-slate-500 tracking-wider mb-1">CROWD_FORECAST</div>
              <div className="font-orbitron text-[11px] text-[var(--ng)]">
                {aiInsight?.trend || "→ STABLE"}
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="cyber-panel p-4">
          <div className="font-orbitron text-[10px] text-[var(--no)] tracking-widest mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--no)] shadow-[0_0_8px_var(--no)] animate-pulse" />
            UPCOMING_EVENTS // CAMPUS_ACTIVITIES
          </div>
          <div className="space-y-1.5">
            {upcomingEvents.length === 0 ? (
              <div className="text-[10px] text-slate-600 py-2">No upcoming scheduled events.</div>
            ) : (
              upcomingEvents.map((ev) => (
                <div
                  key={ev.id || ev.date_str + ev.title}
                  onClick={() => navigateToCalDate(ev.date_str)}
                  className="flex justify-between items-center p-2.5 border border-[var(--bd)] hover:border-[var(--no)] hover:bg-orange-500/5 rounded-sm cursor-pointer transition group"
                >
                  <div>
                    <div className="font-orbitron text-[10px] text-slate-200 group-hover:text-[var(--no)] transition">
                      {ev.title}
                    </div>
                    <div className="text-[8.5px] text-slate-500 mt-0.5">
                      {ev.date_str} · 📅 click to inspect in Neural Calendar
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="font-orbitron text-xl text-[var(--no)] leading-none">
                      {String(ev.diff).padStart(2, "0")}
                    </div>
                    <div className="text-[7.5px] text-slate-500 tracking-wider mt-0.5">
                      DAYS_LEFT
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bright VTOP Bridge */}
        <div className="vtbox p-5 text-center">
          <span className="absolute top-0 right-3 bg-[var(--nb)] text-black font-orbitron text-[7px] font-bold px-2 py-0.5 tracking-wider">
            EXTERNAL_BRIDGE
          </span>
          <div className="font-orbitron text-sm text-[var(--nb)] font-bold drop-shadow-[0_0_12px_var(--nb)] mb-1 flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[var(--nb)] shadow-[0_0_10px_var(--nb)] animate-pulse" />
            [ACCESS_VTOP] // OFFICIAL_PORTAL
          </div>
          <div className="text-[10px] text-cyan-200/80 mb-1">
            SECURE_HANDSHAKE: vtop.vitbhopal.ac.in
          </div>
          <div className="text-[9px] text-cyan-400/50 mb-4">
            Student Management System · Attendance · Grades · Fees
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://vtop.vitbhopal.ac.in/vtop/login"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-cyan-400/10 border-2 border-[var(--nb)] text-[var(--nb)] hover:bg-[var(--nb)] hover:text-black font-orbitron text-[10px] px-6 py-2.5 rounded-sm tracking-[2px] transition shadow-[0_0_18px_rgba(0,243,255,0.2)]"
            >
              ⚡ INITIATE_VTOP_SESSION <ExternalLink size={12} />
            </a>
            <button
              onClick={() => setActiveView("tt")}
              className="inline-flex items-center gap-1.5 border border-[var(--ng)]/70 text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black font-orbitron text-[9px] px-4 py-2.5 rounded-sm tracking-wider transition"
            >
              IMPORT TIMETABLE →
            </button>
          </div>
        </div>

        {/* All Resources */}
        <div>
          <div className="font-orbitron text-[10px] text-slate-500 tracking-[2px] mb-2">
            // ALL_RESOURCES (CLICK_TO_BOOK)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {resources.map((r) => (
              <div
                key={r.id}
                onClick={() => jumpToBookResource(r.id)}
                className="cyber-card p-3.5 cursor-pointer"
              >
                <div className="text-[8.5px] text-[var(--nb)] tracking-wider mb-1">
                  {RES_ICONS[r.cat] || "[RES]"} {r.cat.toUpperCase()}
                </div>
                <div className="font-orbitron text-[11px] text-slate-100 mb-1.5">
                  {r.name}
                </div>
                <div className="text-[9px] text-slate-400">
                  {r.loc} | CAP:{r.cap} | LOAD:{r.fill}%
                </div>
                <div className="h-[3px] bg-[#151522] mt-2.5 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${r.fill}%`,
                      background:
                        r.fill > 70
                          ? "linear-gradient(90deg, var(--no), var(--nr))"
                          : "linear-gradient(90deg, var(--np), var(--nk))",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--nk)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            PROCTOR_COMMAND_FEED
          </div>
          <div className="divide-y divide-dashed divide-[var(--bd)] text-[10.5px]">
            <div className="py-2">
              <span className="block font-orbitron text-[8px] text-[var(--nk)] mb-0.5">
                URGENT // 10:45
              </span>
              All students must verify Lab exit logs before 5PM.
            </div>
            <div className="py-2">
              <span className="block font-orbitron text-[8px] text-[var(--nb)] mb-0.5">
                INFO // 09:12
              </span>
              Maintenance in AB2 Floor 3 during weekend hours.
            </div>
            <div className="py-2">
              <span className="block font-orbitron text-[8px] text-[var(--np)] mb-0.5">
                ALERT // 08:00
              </span>
              75% attendance lock enforced ahead of upcoming FAT exams.
            </div>
            <div className="py-2">
              <span className="block font-orbitron text-[8px] text-[var(--ng)] mb-0.5">
                UPDATE // 07:30
              </span>
              Library extended hours: open till 11PM this week.
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="font-orbitron text-[10px] text-[var(--nb)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            QUICK_STATS
          </div>
          <div className="text-[10px] text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>NEXT_EXAM</span>
              <span className="text-[var(--nr)] font-orbitron">{nextExamDays}</span>
            </div>
            <div className="flex justify-between">
              <span>AVG_ATTENDANCE</span>
              <span
                className="font-orbitron"
                style={{ color: avgAttendance >= 75 ? "var(--ng)" : "var(--nr)" }}
              >
                {avgAttendance}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>CURRENT_CGPA</span>
              <span className="text-[var(--ng)] font-orbitron">{user?.cgpa ?? 8.74}</span>
            </div>
            <div className="flex justify-between">
              <span>CAMPUS_TEMP</span>
              <span className="text-[var(--no)]">28°C ☀️</span>
            </div>
            <div className="flex justify-between">
              <span>SHUTTLE_ETA</span>
              <span className="text-[var(--nb)]">5 min 🚌</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
