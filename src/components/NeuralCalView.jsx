import React, { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";

const MONTHS = [
  "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
  "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
];

export default function NeuralCalView() {
  const { user, calendarEvents, setCalendarEvents, highlightedDate, setHighlightedDate, applyNewXP } =
    useApp();

  const now = new Date();
  const [viewMonth, setViewMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selectedDay, setSelectedDay] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  );
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("event");

  useEffect(() => {
    if (highlightedDate) {
      const [y, m] = highlightedDate.split("-").map(Number);
      if (y && m) {
        setViewMonth({ year: y, month: m - 1 });
        setSelectedDay(highlightedDate);
      }
      const timer = setTimeout(() => setHighlightedDate(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [highlightedDate, setHighlightedDate]);

  const eventsByDate = useMemo(() => {
    const map = new Map();
    calendarEvents.forEach((ev) => {
      if (!map.has(ev.date_str)) map.set(ev.date_str, []);
      map.get(ev.date_str).push(ev);
    });
    return map;
  }, [calendarEvents]);

  const daysInMonth = new Date(viewMonth.year, viewMonth.month + 1, 0).getDate();
  const firstDow = new Date(viewMonth.year, viewMonth.month, 1).getDay(); // 0=Sun
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const changeMonth = (delta) => {
    const d = new Date(viewMonth.year, viewMonth.month + delta, 1);
    setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !user?.reg_no) return;
    const res = await api.addCalendarEvent({
      reg_no: user.reg_no,
      date_str: selectedDay,
      title: newTitle.trim(),
      category: newCat,
      description: "Custom student calendar reminder",
    });
    setCalendarEvents(res.calendar_events);
    setNewTitle("");
    applyNewXP(res.xp, "📅 +5 XP — Calendar event added", "var(--no)");
  };

  const selectedDayEvents = eventsByDate.get(selectedDay) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-4 text-[9px] text-slate-300">
          {[
            ["rgba(0,255,136,0.25)", "var(--ng)", "INSTRUCTIONAL"],
            ["rgba(255,0,64,0.2)", "var(--nr)", "FAT_EXAM"],
            ["rgba(255,255,0,0.18)", "var(--ny)", "HOLIDAY"],
            ["rgba(255,102,0,0.18)", "var(--no)", "CAMPUS_EVENT"],
            ["#111", "#333", "NO_INST"],
          ].map(([bg, border, lbl]) => (
            <span key={lbl} className="flex items-center gap-1.5">
              <i
                className="w-2.5 h-2.5 inline-block rounded-[2px] border"
                style={{ background: bg, borderColor: border }}
              />
              {lbl}
            </span>
          ))}
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3">
          <div className="font-orbitron text-sm text-[var(--nk)] border-l-4 border-[var(--nk)] pl-2.5">
            {MONTHS[viewMonth.month]}_{viewMonth.year}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => changeMonth(-1)}
              className="p-1.5 border border-[var(--bd)] hover:border-[var(--nb)] text-slate-300 rounded-sm"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setViewMonth({ year: now.getFullYear(), month: now.getMonth() })}
              className="font-orbitron text-[8.5px] px-2.5 py-1.5 border border-[var(--ng)]/50 text-[var(--ng)] rounded-sm hover:bg-emerald-500/10"
            >
              TODAY
            </button>
            <button
              onClick={() => changeMonth(1)}
              className="p-1.5 border border-[var(--bd)] hover:border-[var(--nb)] text-slate-300 rounded-sm"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((h) => (
            <div
              key={h}
              className="font-orbitron text-[8.5px] text-[var(--nb)] py-2 text-center border-b border-[var(--bd)]"
            >
              {h}
            </div>
          ))}

          {Array.from({ length: firstDow }).map((_, idx) => (
            <div key={`pad-${idx}`} className="min-h-[68px]" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = `${viewMonth.year}-${String(viewMonth.month + 1).padStart(2, "0")}-${String(
              dayNum
            ).padStart(2, "0")}`;
            const dayEvents = eventsByDate.get(dateStr) || [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const isHighlighted = dateStr === highlightedDate;
            const dow = (firstDow + idx) % 7;

            const hasFat = dayEvents.some((e) => e.category === "fat");
            const hasEv = dayEvents.some((e) => e.category === "event");
            const hasHol = dayEvents.some((e) => e.category === "holiday");

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDay(dateStr)}
                className={`min-h-[68px] p-1.5 rounded-[3px] border relative cursor-pointer transition ${
                  isHighlighted
                    ? "cal-hl"
                    : isToday
                    ? "bg-emerald-500/10 border-[var(--ng)] shadow-[0_0_10px_rgba(0,255,136,0.2)]"
                    : hasFat
                    ? "bg-rose-500/10 border-rose-500/40"
                    : hasEv
                    ? "bg-orange-500/10 border-orange-500/40"
                    : hasHol
                    ? "bg-yellow-500/10 border-yellow-500/35"
                    : isSelected
                    ? "bg-cyan-500/10 border-[var(--nb)]"
                    : "bg-[#0b0b14] border-[var(--bd)] hover:border-purple-500/40"
                }`}
              >
                <span className="font-orbitron text-[9px] text-slate-400">{String(dayNum).padStart(2, "0")}</span>
                {isToday && (
                  <span className="block text-[7.5px] font-orbitron text-[var(--ng)] animate-pulse mt-0.5">
                    TODAY ←
                  </span>
                )}
                <div className="mt-1 space-y-0.5">
                  {dayEvents.map((ev, i) => (
                    <span
                      key={i}
                      className="block text-[7px] leading-tight truncate font-mono"
                      style={{
                        color:
                          ev.category === "fat"
                            ? "var(--nr)"
                            : ev.category === "event"
                            ? "var(--no)"
                            : ev.category === "holiday"
                            ? "var(--ny)"
                            : "var(--ng)",
                      }}
                    >
                      {ev.title}
                    </span>
                  ))}
                  {dayEvents.length === 0 && !isToday && (
                    <span className="block text-[7px] text-slate-600 mt-2">
                      {dow === 0 ? "NO_INST" : dow === 6 ? "REMOTE" : "INST"}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Inspector Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--np)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            DAY_INSPECTOR
          </div>
          <div className="font-orbitron text-xs text-[var(--nb)] mb-2">{selectedDay}</div>
          {selectedDayEvents.length === 0 ? (
            <div className="text-[10px] text-slate-500 mb-3">
              Standard academic schedule. No special flags logged.
            </div>
          ) : (
            <div className="space-y-2 mb-3">
              {selectedDayEvents.map((ev, i) => (
                <div key={i} className="p-2 bg-[#0b0b14] border border-[var(--bd)] rounded-sm">
                  <div className="font-orbitron text-[9px] text-[var(--no)]">{ev.title}</div>
                  {ev.description && (
                    <div className="text-[9px] text-slate-400 mt-1">{ev.description}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddReminder} className="border-t border-[var(--bd)] pt-3 space-y-2">
            <div className="font-orbitron text-[8.5px] text-[var(--ng)]">// ADD_EVENT_TO_{selectedDay}</div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Reminder / Exam / Club meet..."
              className="cyber-input w-full text-[10px]"
            />
            <select
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="cyber-input w-full text-[10px]"
            >
              <option value="event">CAMPUS_EVENT</option>
              <option value="fat">EXAM / DEADLINE</option>
              <option value="holiday">HOLIDAY / LEAVE</option>
            </select>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1 font-orbitron text-[8.5px] py-2 border border-[var(--np)] text-[var(--np)] hover:bg-[var(--np)] hover:text-white rounded-sm transition"
            >
              <Plus size={11} /> LOCK_REMINDER
            </button>
          </form>
        </div>
      </aside>
    </div>
  );
}
