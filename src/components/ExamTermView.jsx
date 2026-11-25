import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApp } from "../context/AppContext";

function computeGrade(score) {
  if (score >= 90) return { g: "S", pts: 10, cls: "border-[var(--ng)] text-[var(--ng)] bg-emerald-500/10" };
  if (score >= 80) return { g: "A", pts: 9, cls: "border-[var(--nb)] text-[var(--nb)] bg-cyan-500/10" };
  if (score >= 70) return { g: "B", pts: 8, cls: "border-[var(--np)] text-[var(--np)] bg-purple-500/10" };
  if (score >= 60) return { g: "C", pts: 7, cls: "border-[var(--no)] text-[var(--no)] bg-orange-500/10" };
  if (score >= 50) return { g: "D", pts: 6, cls: "border-[var(--ny)] text-[var(--ny)] bg-yellow-500/10" };
  return { g: "F", pts: 0, cls: "border-[var(--nr)] text-[var(--nr)] bg-rose-500/10" };
}

export default function ExamTermView() {
  const { user, marks, exams } = useApp();
  const [tab, setTab] = useState("sched");
  const [simEndsem, setSimEndsem] = useState({});

  const enrichedMarks = useMemo(() => {
    return marks.map((m) => {
      const midWt = (m.midsem_raw / (m.midsem_max || 50)) * 30;
      const effectiveEnd =
        m.endsem_raw !== null && m.endsem_raw !== undefined
          ? m.endsem_raw
          : simEndsem[m.course_code] ?? 76;
      const endWt =
        m.endsem_raw !== null && m.endsem_raw !== undefined
          ? (m.endsem_raw / (m.endsem_max || 100)) * 50
          : null;
      const actualTotal = Math.round((m.internal + midWt + (endWt || 0)) * 10) / 10;
      const projectedTotal =
        Math.round((m.internal + midWt + (effectiveEnd / (m.endsem_max || 100)) * 50) * 10) / 10;
      return {
        ...m,
        midWt: Math.round(midWt * 10) / 10,
        endWt: endWt !== null ? Math.round(endWt * 10) / 10 : null,
        actualTotal,
        projectedTotal,
        effectiveEnd,
        gradeObj: computeGrade(endWt !== null ? actualTotal : projectedTotal),
      };
    });
  }, [marks, simEndsem]);

  const projectedSgpa = useMemo(() => {
    if (!enrichedMarks.length) return user?.cgpa ?? 8.74;
    const totalCreds = enrichedMarks.reduce((acc, m) => acc + (m.credits || 4), 0);
    const weighted = enrichedMarks.reduce((acc, m) => acc + m.gradeObj.pts * (m.credits || 4), 0);
    return Math.round((weighted / Math.max(1, totalCreds)) * 100) / 100;
  }, [enrichedMarks, user]);

  const projectedCgpa = useMemo(() => {
    const prevAvg = 8.7; // Sem 1-3 average (8.5, 8.7, 8.9)
    return Math.round(((prevAvg * 3 + projectedSgpa) / 4) * 100) / 100;
  }, [projectedSgpa]);

  const cgpaTrend = useMemo(
    () => [
      { sem: "SEM_1", cgpa: 8.5 },
      { sem: "SEM_2", cgpa: 8.7 },
      { sem: "SEM_3", cgpa: 8.9 },
      { sem: "SEM_4 (PROJ)", cgpa: projectedCgpa },
    ],
    [projectedCgpa]
  );

  const chartColors = ["#00f3ff", "#bc13fe", "#ff0040", "#00ff88", "#ff00ff", "#ff6600"];
  const upcomingCount = exams.filter((e) => e.status !== "COMPLETED").length;
  const completedCount = exams.filter((e) => e.status === "COMPLETED").length;
  const nextExam = exams.find((e) => e.status !== "COMPLETED");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4">
        <div className="flex flex-wrap gap-2 pb-3 mb-4 border-b border-[var(--bd)]">
          {[
            ["sched", "[SCHEDULE]"],
            ["marks", "[MARKS]"],
            ["analysis", "[ANALYSIS & GPA SIM]"],
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`font-orbitron text-[9px] px-3 py-1.5 rounded-sm border transition ${
                tab === id
                  ? "text-[var(--nr)] border-[var(--nr)] shadow-[0_0_8px_rgba(255,0,64,0.2)]"
                  : "text-slate-500 border-transparent hover:text-[var(--nb)] hover:border-[var(--nb)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* SCHEDULE TAB */}
        {tab === "sched" && (
          <div className="view-animate">
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="bg-[#0b0b14] border border-[var(--bd)] p-3 text-center rounded">
                <div className="font-orbitron text-2xl text-[var(--nr)]">
                  {String(upcomingCount).padStart(2, "0")}
                </div>
                <div className="text-[8px] text-slate-500 mt-1">UPCOMING_EXAMS</div>
              </div>
              <div className="bg-[#0b0b14] border border-[var(--bd)] p-3 text-center rounded">
                <div className="font-orbitron text-2xl text-[var(--ng)]">01</div>
                <div className="text-[8px] text-slate-500 mt-1">SESSION_ACTIVE</div>
              </div>
              <div className="bg-[#0b0b14] border border-[var(--bd)] p-3 text-center rounded">
                <div className="font-orbitron text-2xl text-[var(--nb)]">
                  {String(completedCount).padStart(2, "0")}
                </div>
                <div className="text-[8px] text-slate-500 mt-1">COMPLETED</div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10px]">
                <thead>
                  <tr className="bg-rose-500/10 text-[var(--nr)] font-orbitron text-[8px]">
                    <th className="p-2.5 border border-[var(--bd)] text-left">COURSE</th>
                    <th className="p-2.5 border border-[var(--bd)] text-left">SUBJECT</th>
                    <th className="p-2.5 border border-[var(--bd)] text-left">TYPE</th>
                    <th className="p-2.5 border border-[var(--bd)] text-left">DATE</th>
                    <th className="p-2.5 border border-[var(--bd)] text-left">TIME</th>
                    <th className="p-2.5 border border-[var(--bd)] text-left">VENUE</th>
                    <th className="p-2.5 border border-[var(--bd)] text-left">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((ex, i) => (
                    <tr key={ex.id || i} className="hover:bg-cyan-500/[0.03]">
                      <td className="p-2.5 border border-[var(--bd)] font-orbitron text-[var(--nb)]">
                        {ex.course_code}
                      </td>
                      <td className="p-2.5 border border-[var(--bd)] text-slate-200">{ex.subject}</td>
                      <td className="p-2.5 border border-[var(--bd)] text-slate-400">{ex.exam_type}</td>
                      <td className="p-2.5 border border-[var(--bd)]">{ex.exam_date}</td>
                      <td className="p-2.5 border border-[var(--bd)] text-slate-400">{ex.time_slot}</td>
                      <td className="p-2.5 border border-[var(--bd)]">{ex.venue}</td>
                      <td className="p-2.5 border border-[var(--bd)]">
                        <span
                          className={`px-2 py-0.5 rounded-sm font-orbitron text-[8px] border ${
                            ex.status === "COMPLETED"
                              ? "border-[var(--nb)] text-[var(--nb)] bg-cyan-500/10"
                              : "border-[var(--no)] text-[var(--no)] bg-orange-500/10"
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MARKS TAB */}
        {tab === "marks" && (
          <div className="view-animate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {enrichedMarks.map((m) => (
                <div
                  key={m.course_code}
                  className="bg-[#0b0b14] border border-[var(--bd)] hover:border-rose-500/35 rounded p-4 relative transition"
                >
                  <div
                    className={`absolute top-3.5 right-3.5 w-9 h-9 rounded-full border-2 flex items-center justify-center font-orbitron text-xs font-bold ${m.gradeObj.cls}`}
                  >
                    {m.gradeObj.g}
                  </div>
                  <div className="font-orbitron text-[9px] text-[var(--nb)] mb-1">
                    {m.course_code} · {m.credits} CR
                  </div>
                  <div className="font-orbitron text-xs text-slate-200 mb-3 pr-11">
                    {m.course_name}
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-black/40 border border-[var(--bd)] p-2 rounded-sm">
                      <div className="text-[7px] text-slate-500 mb-1">INTERNAL</div>
                      <div className="font-orbitron text-base text-[var(--nb)]">{m.internal}</div>
                      <div className="text-[8px] text-slate-500">/{m.internal_max}</div>
                    </div>
                    <div className="bg-black/40 border border-[var(--bd)] p-2 rounded-sm">
                      <div className="text-[7px] text-slate-500 mb-1">MIDSEM (/30)</div>
                      <div className="font-orbitron text-base text-[var(--np)]">{m.midWt}</div>
                      <div className="text-[8px] text-slate-500">{m.midsem_raw}/50</div>
                    </div>
                    <div className="bg-black/40 border border-[var(--bd)] p-2 rounded-sm">
                      <div className="text-[7px] text-slate-500 mb-1">ENDSEM (/50)</div>
                      <div className="font-orbitron text-base text-[var(--nr)]">
                        {m.endWt !== null ? m.endWt : "--"}
                      </div>
                      <div className="text-[8px] text-slate-500">
                        {m.endsem_raw !== null ? `${m.endsem_raw}/100` : "Pending"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2.5 border-t border-emerald-500/30 bg-emerald-500/5 flex justify-between items-center rounded-sm">
                    <span className="font-orbitron text-[9px] text-[var(--ng)]">
                      {m.endWt !== null ? "FINAL_TOTAL" : "CURRENT_SCORE"}
                    </span>
                    <span className="font-orbitron text-lg text-[var(--ng)]">
                      {m.actualTotal}
                      <span className="text-[10px] text-slate-500">/100</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYSIS & GPA SIMULATOR TAB */}
        {tab === "analysis" && (
          <div className="space-y-4 view-animate">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-rose-500/10 to-purple-500/10 border border-rose-500/30 rounded p-4 text-center">
                <div className="text-[8.5px] text-slate-400 tracking-wider">PROJECTED_SEM_SGPA</div>
                <div className="font-orbitron text-4xl text-[var(--nb)] mt-1">{projectedSgpa}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded p-4 text-center">
                <div className="text-[8.5px] text-slate-400 tracking-wider">PROJECTED_CGPA</div>
                <div className="font-orbitron text-4xl text-[var(--ng)] mt-1">{projectedCgpa}</div>
              </div>
            </div>

            {/* Interactive What-If Sliders */}
            <div className="bg-[#0b0b14] border border-[var(--bd)] rounded p-4">
              <div className="font-orbitron text-[10px] text-[var(--nb)] mb-3">
                // WHAT-IF_ENDSEM_SIMULATOR (DRAG PENDING SCORES TO PREDICT GPA)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {enrichedMarks
                  .filter((m) => m.endsem_raw === null)
                  .map((m) => (
                    <div key={m.course_code} className="p-2.5 border border-[var(--bd)] rounded-sm">
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="font-orbitron text-[var(--nb)]">{m.course_code}</span>
                        <span className="font-orbitron text-[var(--ng)]">
                          FAT: {m.effectiveEnd}/100 → {m.projectedTotal} ({m.gradeObj.g})
                        </span>
                      </div>
                      <input
                        type="range"
                        min={30}
                        max={100}
                        value={m.effectiveEnd}
                        onChange={(e) =>
                          setSimEndsem((prev) => ({
                            ...prev,
                            [m.course_code]: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-[#00f3ff]"
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#0b0b14] border border-[var(--bd)] rounded p-4">
                <div className="font-orbitron text-[9px] text-[var(--nb)] mb-3">
                  // PROJECTED_SUBJECT_SCORES
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={enrichedMarks} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={10} />
                      <YAxis dataKey="course_code" type="category" stroke="#94a3b8" fontSize={10} width={68} />
                      <Tooltip
                        contentStyle={{ background: "#060612", border: "1px solid #00f3ff", fontSize: 11 }}
                      />
                      <Bar dataKey="projectedTotal" radius={[0, 3, 3, 0]}>
                        {enrichedMarks.map((_, idx) => (
                          <Cell key={idx} fill={chartColors[idx % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-[#0b0b14] border border-[var(--bd)] rounded p-4">
                <div className="font-orbitron text-[9px] text-[var(--np)] mb-3">
                  // CGPA_PROGRESSION
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cgpaTrend} margin={{ left: -12, right: 12, top: 8 }}>
                      <defs>
                        <linearGradient id="cgpaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="sem" stroke="#64748b" fontSize={10} />
                      <YAxis domain={[7.5, 10]} stroke="#64748b" fontSize={10} />
                      <Tooltip
                        contentStyle={{ background: "#060612", border: "1px solid #bc13fe", fontSize: 11 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="cgpa"
                        stroke="#00f3ff"
                        strokeWidth={2}
                        fill="url(#cgpaFill)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Exam Intel Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--nr)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            EXAM_INTEL
          </div>
          {nextExam ? (
            <div className="text-[10px] text-slate-400 space-y-2">
              <div className="flex justify-between">
                <span>NEXT_EXAM</span>
                <span className="text-[var(--no)] font-orbitron">{nextExam.exam_date}</span>
              </div>
              <div className="flex justify-between">
                <span>SUBJECT</span>
                <span className="text-[var(--nb)]">{nextExam.course_code}</span>
              </div>
              <div className="flex justify-between">
                <span>VENUE</span>
                <span>{nextExam.venue}</span>
              </div>
              <div className="flex justify-between">
                <span>TIME</span>
                <span>{nextExam.time_slot}</span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-slate-500">All exams completed.</div>
          )}
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="text-[8px] text-[var(--ng)] tracking-wider mb-1">BEST_SUBJECT</div>
          <div className="text-[10px] text-slate-300">Data Structures (CSE2003)</div>
          <div className="font-orbitron text-lg text-[var(--ng)]">99/100 · GRADE S</div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="text-[8px] text-[var(--nr)] tracking-wider mb-1">NEEDS_FOCUS</div>
          <div className="text-[10px] text-slate-300">Probability & Stats (MAT2001)</div>
          <div className="font-orbitron text-lg text-[var(--no)]">49/100 (Pre-FAT)</div>
        </div>
      </aside>
    </div>
  );
}
