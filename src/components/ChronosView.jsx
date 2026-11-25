import React, { useMemo, useState } from "react";
import { Plus, Upload, CheckCircle2, AlertTriangle } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { FREE_SLOTS_MATRIX, SUBJECT_COLORS, TIME_SLOTS } from "../data/seedData";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

function getBunkMath(attended, total) {
  if (!total) return { pct: 100, canSkip: 0, mustAttend: 0, status: "SAFE" };
  const pct = Math.round((attended / total) * 1000) / 10;
  if (pct >= 75) {
    const canSkip = Math.max(0, Math.floor(attended / 0.75 - total));
    return { pct, canSkip, mustAttend: 0, status: pct >= 80 ? "SAFE" : "BORDERLINE" };
  }
  const mustAttend = Math.max(1, Math.ceil((0.75 * total - attended) / 0.25));
  return { pct, canSkip: 0, mustAttend, status: "DETAIN_RISK" };
}

export default function ChronosView() {
  const { user, timetable, setTimetable, applyNewXP, pushToast } = useApp();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [rawImport, setRawImport] = useState(
    "MON | 10:05-11:35 | CSA2001 | AB02-230 | Data Structures & Algorithms\nWED | 13:15-14:45 | PHY1003 | AB-507 | Engineering Physics"
  );
  const [importStatus, setImportStatus] = useState("");
  const [newSlot, setNewSlot] = useState({
    day: "TUE",
    slot_idx: 1,
    slot_code: "E11",
    course_code: "CSE3001",
    course_name: "Database Mgmt Systems",
    venue: "AB1-304",
    faculty: "Dr. S. Kumar",
    credits: 4,
    attended: 20,
    total: 24,
    is_lab: false,
  });

  const todayCode = useMemo(() => {
    const map = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const d = map[new Date().getDay()];
    return DAYS.includes(d) ? d : "MON";
  }, []);

  // Index timetable by `${day}_${slot_idx}`
  const gridMap = useMemo(() => {
    const map = new Map();
    timetable.forEach((s) => {
      map.set(`${s.day}_${s.slot_idx}`, s);
    });
    return map;
  }, [timetable]);

  // Unique courses list
  const subjectList = useMemo(() => {
    const seen = new Map();
    timetable.forEach((s) => {
      if (!seen.has(s.course_code)) seen.set(s.course_code, s);
    });
    return Array.from(seen.values());
  }, [timetable]);

  const todaysClasses = useMemo(
    () => timetable.filter((s) => s.day === todayCode).sort((a, b) => a.slot_idx - b.slot_idx),
    [timetable, todayCode]
  );

  const handleAttendanceBump = async (slot, attendDelta, totalDelta) => {
    if (!user?.reg_no) return;
    const nextAtt = Math.max(0, slot.attended + attendDelta);
    const nextTot = Math.max(nextAtt, slot.total + totalDelta);
    try {
      const res = await api.updateAttendance(user.reg_no, slot.course_code, {
        attended: nextAtt,
        total: nextTot,
      });
      setTimetable(res.timetable);
      setSelectedSlot((prev) =>
        prev ? { ...prev, attended: nextAtt, total: nextTot } : prev
      );
      pushToast(`✓ Updated ${slot.course_code} attendance (${nextAtt}/${nextTot})`, "var(--ng)");
    } catch (e) {
      pushToast(`✗ ${e.message}`, "var(--nr)");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.reg_no) return;
    const text = await file.text();
    try {
      const res = await api.importTimetable({
        reg_no: user.reg_no,
        content: text,
        filename: file.name,
      });
      setTimetable(res.timetable);
      setImportStatus(`✓ Imported ${res.count} slot(s) from ${file.name}`);
      applyNewXP(res.xp, "🧠 +25 XP — Timetable synced!", "var(--nb)");
    } catch (err) {
      setImportStatus(`✗ ${err.message}`);
    }
  };

  const handleTextImport = async () => {
    if (!user?.reg_no || !rawImport.trim()) return;
    try {
      const res = await api.importTimetable({
        reg_no: user.reg_no,
        content: rawImport,
        filename: "pasted.txt",
      });
      setTimetable(res.timetable);
      setImportStatus(`✓ Parsed & synced ${res.count} slot(s) into Chronos!`);
      applyNewXP(res.xp, "🧠 +25 XP — Timetable parsed!", "var(--nb)");
    } catch (err) {
      setImportStatus(`✗ ${err.message}`);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!user?.reg_no) return;
    try {
      const res = await api.addTimetableSlot({ reg_no: user.reg_no, ...newSlot });
      setTimetable(res.timetable);
      setShowAdd(false);
      applyNewXP(res.xp, `⚡ +10 XP — Added ${newSlot.course_code}`, "var(--ng)");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    }
  };

  const bunkStats = selectedSlot
    ? getBunkMath(selectedSlot.attended, selectedSlot.total)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="flex flex-col gap-4">
        {/* Header Bar */}
        <div className="cyber-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <div className="font-orbitron text-xs text-[var(--nb)] tracking-wider">
                CHRONOS // LIVE_FFCS_TIMETABLE
              </div>
              <div className="text-[9px] text-slate-500">
                Click any course block to inspect attendance & "Can I Bunk?" simulator
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowImport((v) => !v);
                  setShowAdd(false);
                }}
                className="flex items-center gap-1.5 font-orbitron text-[8.5px] px-3 py-1.5 border border-[var(--nb)] text-[var(--nb)] hover:bg-cyan-400/15 rounded-sm transition"
              >
                <Upload size={11} /> IMPORT_VTOP / CSV
              </button>
              <button
                onClick={() => {
                  setShowAdd((v) => !v);
                  setShowImport(false);
                }}
                className="flex items-center gap-1.5 font-orbitron text-[8.5px] px-3 py-1.5 border border-[var(--ng)] text-[var(--ng)] hover:bg-emerald-400/15 rounded-sm transition"
              >
                <Plus size={11} /> ADD_SLOT
              </button>
            </div>
          </div>

          {/* Importer Drawer */}
          {showImport && (
            <div className="mb-4 p-3.5 border border-cyan-400/30 bg-cyan-500/5 rounded space-y-2.5 view-animate">
              <div className="font-orbitron text-[9px] text-[var(--nb)]">
                // CHRONOS_PARSER — UPLOAD VTOP HTML / CSV / JSON OR PASTE SLOTS
              </div>
              <label className="block border border-dashed border-cyan-400/40 rounded p-3 text-center cursor-pointer hover:bg-cyan-400/5 transition">
                <input
                  type="file"
                  accept=".html,.htm,.csv,.json,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="font-orbitron text-[9px] text-[var(--nb)]">
                  📄 CLICK TO UPLOAD SAVED VTOP TIMETABLE (.html / .csv / .json)
                </div>
              </label>
              <textarea
                rows={3}
                value={rawImport}
                onChange={(e) => setRawImport(e.target.value)}
                className="cyber-input w-full text-[10px]"
                placeholder="MON | 10:05-11:35 | CSA2001 | AB02-230 | Data Structures"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[9px] text-slate-400">{importStatus}</span>
                <button
                  onClick={handleTextImport}
                  className="font-orbitron text-[8.5px] px-4 py-1.5 border border-[var(--nb)] text-[var(--nb)] hover:bg-[var(--nb)] hover:text-black rounded-sm transition"
                >
                  PARSE_&_APPLY
                </button>
              </div>
            </div>
          )}

          {/* Add Slot Form */}
          {showAdd && (
            <form
              onSubmit={handleAddSlot}
              className="mb-4 p-3.5 border border-emerald-400/30 bg-emerald-500/5 rounded grid grid-cols-2 sm:grid-cols-4 gap-2.5 view-animate"
            >
              <select
                value={newSlot.day}
                onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                className="cyber-input"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
              <select
                value={newSlot.slot_idx}
                onChange={(e) => setNewSlot({ ...newSlot, slot_idx: Number(e.target.value) })}
                className="cyber-input"
              >
                {TIME_SLOTS.map((t, i) => (
                  <option key={t} value={i}>{t}</option>
                ))}
              </select>
              <input
                value={newSlot.course_code}
                onChange={(e) => setNewSlot({ ...newSlot, course_code: e.target.value.toUpperCase() })}
                placeholder="Code (CSE3001)"
                className="cyber-input"
                required
              />
              <input
                value={newSlot.venue}
                onChange={(e) => setNewSlot({ ...newSlot, venue: e.target.value })}
                placeholder="Venue (AB1-304)"
                className="cyber-input"
                required
              />
              <input
                value={newSlot.course_name}
                onChange={(e) => setNewSlot({ ...newSlot, course_name: e.target.value })}
                placeholder="Course Title"
                className="cyber-input col-span-2"
                required
              />
              <input
                value={newSlot.faculty}
                onChange={(e) => setNewSlot({ ...newSlot, faculty: e.target.value })}
                placeholder="Faculty"
                className="cyber-input"
              />
              <button
                type="submit"
                className="font-orbitron text-[9px] border border-[var(--ng)] text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black rounded-sm transition"
              >
                SAVE_SLOT
              </button>
            </form>
          )}

          {/* Timetable Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[740px] text-[10px]">
              <thead>
                <tr>
                  <th className="w-9 p-2 border border-cyan-400/20 bg-purple-500/10 font-orbitron text-[8px] text-[var(--np)]">
                    DAY
                  </th>
                  {TIME_SLOTS.slice(0, 3).map((t) => (
                    <th
                      key={t}
                      className="p-2 border border-cyan-400/15 bg-cyan-500/5 font-orbitron text-[8px] text-[var(--nb)]"
                    >
                      {t}
                    </th>
                  ))}
                  <th className="w-7 p-1 border border-yellow-400/20 bg-yellow-500/5 font-orbitron text-[7px] text-[var(--ny)]">
                    LUNCH
                  </th>
                  {TIME_SLOTS.slice(3).map((t) => (
                    <th
                      key={t}
                      className="p-2 border border-cyan-400/15 bg-cyan-500/5 font-orbitron text-[8px] text-[var(--nb)]"
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day, dIdx) => {
                  const isToday = day === todayCode;
                  const cells = [];
                  let skipNext = false;

                  for (let idx = 0; idx < TIME_SLOTS.length; idx++) {
                    if (idx === 3) {
                      if (dIdx === 0) {
                        cells.push(
                          <td
                            key="lunch"
                            rowSpan={5}
                            className="border border-[var(--bd)] text-center font-orbitron text-[8px] text-[var(--ny)] bg-yellow-400/5"
                          >
                            L<br />U<br />N<br />C<br />H
                          </td>
                        );
                      }
                    }

                    if (skipNext) {
                      skipNext = false;
                      continue;
                    }

                    const entry = gridMap.get(`${day}_${idx}`);
                    if (entry) {
                      const colSpan = entry.col_span > 1 ? 2 : 1;
                      if (colSpan === 2) skipNext = true;
                      const style = SUBJECT_COLORS[entry.color_key] || SUBJECT_COLORS.csa;
                      const pct = Math.round((entry.attended / Math.max(1, entry.total)) * 100);
                      cells.push(
                        <td
                          key={idx}
                          colSpan={colSpan}
                          onClick={() => setSelectedSlot(entry)}
                          style={{
                            background: style.bg,
                            borderColor: `${style.border}44`,
                            borderLeft: `3px solid ${style.border}`,
                          }}
                          className="p-1.5 border text-center h-[60px] cursor-pointer hover:brightness-125 transition"
                        >
                          <span
                            className="block font-orbitron text-[8.5px] font-bold"
                            style={{ color: style.text }}
                          >
                            {entry.course_code}
                          </span>
                          <span className="block text-[7.5px] text-slate-400">{entry.venue}</span>
                          <span
                            className="block text-[7px] mt-0.5 font-mono"
                            style={{ color: pct < 75 ? "var(--nr)" : "#64748b" }}
                          >
                            {pct}% {entry.is_lab ? "◆ LAB" : ""}
                          </span>
                        </td>
                      );
                    } else {
                      cells.push(
                        <td
                          key={idx}
                          className="p-1.5 border border-[var(--bd)] text-center text-slate-600 text-[9px] h-[60px]"
                        >
                          {FREE_SLOTS_MATRIX[day]?.[idx] || "—"}
                        </td>
                      );
                    }
                  }

                  return (
                    <tr key={day} className={isToday ? "bg-cyan-500/[0.03]" : ""}>
                      <td
                        className="border border-[var(--bd)] font-orbitron text-[8.5px] text-center font-bold bg-purple-500/5"
                        style={{ color: isToday ? "var(--ng)" : "var(--np)" }}
                      >
                        {day}
                      </td>
                      {cells}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Subject Index */}
          <div className="mt-4 pt-3 border-t border-[var(--bd)]">
            <div className="font-orbitron text-[9px] text-[var(--nb)] mb-2 tracking-wider">
              // SUBJECT_INDEX
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {subjectList.map((s) => {
                const st = SUBJECT_COLORS[s.color_key] || SUBJECT_COLORS.csa;
                const pct = Math.round((s.attended / Math.max(1, s.total)) * 100);
                return (
                  <button
                    key={s.course_code}
                    onClick={() => setSelectedSlot(s)}
                    style={{ borderColor: `${st.border}33`, borderLeft: `3px solid ${st.border}` }}
                    className="text-left p-2 rounded-sm border bg-[#0b0b14] hover:brightness-125 transition flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="font-orbitron text-[8.5px]" style={{ color: st.text }}>
                        {s.course_code}
                      </span>{" "}
                      <span className="text-[9.5px] text-slate-300">— {s.course_name}</span>
                    </div>
                    <span
                      className="font-orbitron text-[9px] shrink-0"
                      style={{ color: pct >= 75 ? "var(--ng)" : "var(--nr)" }}
                    >
                      {pct}%
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Class Detail & Bunk Simulator */}
          {selectedSlot && bunkStats && (
            <div className="mt-4 p-4 bg-black/85 border border-[var(--nb)] rounded view-animate">
              <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                  <div className="font-orbitron text-xs text-[var(--nb)] mb-1">
                    {selectedSlot.course_code} — {selectedSlot.course_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedSlot.day} · {selectedSlot.time_range} · Venue: {selectedSlot.venue} · Faculty: {selectedSlot.faculty}
                  </div>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-slate-300 font-mono">
                      Classes: <strong>{selectedSlot.attended}/{selectedSlot.total}</strong>
                    </span>
                    <button
                      onClick={() => handleAttendanceBump(selectedSlot, 1, 1)}
                      className="font-orbitron text-[8px] px-2.5 py-1 border border-[var(--ng)] text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black rounded-sm transition"
                    >
                      +1 ATTENDED
                    </button>
                    <button
                      onClick={() => handleAttendanceBump(selectedSlot, 0, 1)}
                      className="font-orbitron text-[8px] px-2.5 py-1 border border-[var(--nr)] text-[var(--nr)] hover:bg-[var(--nr)] hover:text-black rounded-sm transition"
                    >
                      +1 SKIPPED
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[8px] text-slate-500">ATTENDANCE</div>
                  <div
                    className="font-orbitron text-2xl"
                    style={{
                      color:
                        bunkStats.pct >= 85
                          ? "var(--ng)"
                          : bunkStats.pct >= 75
                          ? "var(--no)"
                          : "var(--nr)",
                    }}
                  >
                    {bunkStats.pct}%
                  </div>
                </div>
              </div>

              <div className="mt-3 p-2.5 rounded border border-white/10 bg-white/[0.02] flex items-center gap-2 text-[10px]">
                {bunkStats.mustAttend > 0 ? (
                  <>
                    <AlertTriangle size={14} className="text-[var(--nr)] shrink-0" />
                    <span className="text-rose-300">
                      <strong>DETAIN_RISK:</strong> Attend the next{" "}
                      <strong>{bunkStats.mustAttend}</strong> consecutive class(es) to recover ≥75%.
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} className="text-[var(--ng)] shrink-0" />
                    <span className="text-emerald-300">
                      <strong>BUNK_BUDGET:</strong> Safe above 75%. You can skip up to{" "}
                      <strong>{bunkStats.canSkip}</strong> upcoming class(es) without dropping below 75%.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timetable Intel Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--np)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            TIMETABLE_INTEL
          </div>
          <div className="text-[10px] text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>SEMESTER</span>
              <span className="text-[var(--nb)]">{user?.semester || "SEM-4"}</span>
            </div>
            <div className="flex justify-between">
              <span>ACTIVE_SLOTS</span>
              <span className="text-[var(--ng)]">{timetable.length}</span>
            </div>
            <div className="flex justify-between">
              <span>UNIQUE_COURSES</span>
              <span className="text-[var(--np)]">{subjectList.length}</span>
            </div>
            <div className="flex justify-between">
              <span>LAB_BLOCKS</span>
              <span className="text-[var(--no)]">{timetable.filter((t) => t.is_lab).length}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="font-orbitron text-[9px] text-[var(--nk)] mb-2">
            TODAY'S_CLASSES // {todayCode}
          </div>
          {todaysClasses.length === 0 ? (
            <div className="text-[9.5px] text-slate-500">No classes scheduled today.</div>
          ) : (
            <div className="space-y-1.5 text-[10px]">
              {todaysClasses.map((c) => (
                <div
                  key={c.id || c.slot_idx}
                  onClick={() => setSelectedSlot(c)}
                  className="p-2 bg-[#0b0b14] border border-[var(--bd)] hover:border-[var(--nb)] rounded-sm cursor-pointer"
                >
                  <div className="text-[var(--nb)] font-orbitron text-[9px]">
                    {c.time_range} · {c.course_code}
                  </div>
                  <div className="text-slate-400 text-[9px]">{c.venue}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
