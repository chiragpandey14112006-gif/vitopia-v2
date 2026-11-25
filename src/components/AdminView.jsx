import React, { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Trash2 } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";

const HOURLY_DATA = [
  { block: "8-10", pct: 30 },
  { block: "10-12", pct: 55 },
  { block: "12-2", pct: 45 },
  { block: "2-4", pct: 94 },
  { block: "4-6", pct: 70 },
  { block: "6-8", pct: 35 },
];

export default function AdminView() {
  const { user, pushToast } = useApp();
  const [overview, setOverview] = useState({ bookings: [], resources: [], logs: [], posts: [], registered_users: 1 });
  const [proctorReply, setProctorReply] = useState("");
  const [proctorMsgs, setProctorMsgs] = useState([]);

  const refresh = async () => {
    try {
      const [ov, chat] = await Promise.all([
        api.adminOverview(),
        user?.reg_no ? api.getProctorChat(user.reg_no) : Promise.resolve({ messages: [] }),
      ]);
      setOverview(ov);
      setProctorMsgs(chat.messages || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    refresh();
  }, [user?.reg_no]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAction = async (action) => {
    try {
      const res = await api.adminAction(action);
      setOverview((prev) => ({ ...prev, logs: res.logs || [] }));
      if (action === "EXPORT") {
        const blob = new Blob([JSON.stringify(overview, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `vitopia_admin_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      pushToast(`✓ Admin action ${action} executed`, "var(--no)");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    }
  };

  const handleDeletePost = async (id) => {
    await api.deleteReddit(id);
    await refresh();
    pushToast(`🗑 Deleted post #${id}`, "var(--nr)");
  };

  const handlePurgePosts = async () => {
    if (!window.confirm("DELETE ALL COMMUNITY COMMENTS?")) return;
    await api.purgeReddit();
    await refresh();
    pushToast("🗑 All community posts purged", "var(--nr)");
  };

  const handleProctorReply = async (msg) => {
    const text = (msg ?? proctorReply).trim();
    if (!text || !user?.reg_no) return;
    const res = await api.sendProctorMsg({
      reg_no: user.reg_no,
      text,
      is_proctor: true,
      sender: `${(user.proctor_name || "DR. LOKESH MALVIYA").toUpperCase()} (PROCTOR)`,
    });
    setProctorMsgs(res.messages || []);
    if (!msg) setProctorReply("");
    pushToast("✓ Proctor reply pushed to student channel", "var(--np)");
  };

  const resourceChartData = overview.resources.slice(0, 6).map((r) => ({
    name: r.name.replace("Court", "").slice(0, 12),
    load: r.base_fill,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4 space-y-5">
        <div className="font-orbitron text-xs text-[var(--no)] pb-2.5 border-b border-orange-500/25">
          [ADMIN_ANALYTICS] // CAMPUS_MANAGEMENT_TERMINAL
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--no)] p-3 text-center rounded">
            <div className="text-[8px] text-slate-500 mb-1">ACTIVE_BOOKINGS</div>
            <div className="font-orbitron text-2xl text-[var(--no)]">{overview.bookings.length}</div>
          </div>
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--nb)] p-3 text-center rounded">
            <div className="text-[8px] text-slate-500 mb-1">REGISTERED_NODES</div>
            <div className="font-orbitron text-2xl text-[var(--nb)]">{overview.registered_users}</div>
          </div>
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--nr)] p-3 text-center rounded">
            <div className="text-[8px] text-slate-500 mb-1">PEAK_OCCUPANCY</div>
            <div className="font-orbitron text-2xl text-[var(--nr)]">94%</div>
          </div>
          <div className="bg-[#0b0b14] border border-[var(--bd)] border-b-2 border-b-[var(--ng)] p-3 text-center rounded">
            <div className="text-[8px] text-slate-500 mb-1">SYSTEM_UPTIME</div>
            <div className="font-orbitron text-2xl text-[var(--ng)]">99.8%</div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0b0b14] border border-[var(--bd)] rounded p-3.5">
            <div className="font-orbitron text-[9px] text-slate-400 mb-2">
              RESOURCE_LOAD_PERCENTAGE
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resourceChartData}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ background: "#060612", border: "1px solid #ff6600", fontSize: 10 }} />
                  <Bar dataKey="load" fill="#00f3ff" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0b0b14] border border-[var(--bd)] rounded p-3.5">
            <div className="font-orbitron text-[9px] text-slate-400 mb-2">
              HOURLY_CAMPUS_DEMAND
            </div>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY_DATA}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="block" stroke="#64748b" fontSize={9} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={9} />
                  <Tooltip contentStyle={{ background: "#060612", border: "1px solid #00ff88", fontSize: 10 }} />
                  <Bar dataKey="pct" fill="#ff6600" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Reddit Moderation */}
        <div className="bg-[#0b0b14] border border-orange-600/30 rounded p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <span className="font-orbitron text-[10px] text-[#ff4500]">
              🤖 REDDIT_MODERATION // r/vitbhopal ({overview.posts.length})
            </span>
            <button
              onClick={handlePurgePosts}
              className="font-orbitron text-[8px] px-3 py-1 border border-[var(--nr)] text-[var(--nr)] hover:bg-[var(--nr)] hover:text-black rounded-sm transition"
            >
              🗑 PURGE_ALL
            </button>
          </div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {overview.posts.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 p-2 bg-[#060610] border border-[var(--bd)] rounded-sm text-[10px]"
              >
                <div className="truncate">
                  <span className="text-[#ff4500] font-orbitron mr-2">{p.author}</span>
                  <span className="text-slate-300">{p.text}</span>
                </div>
                <button
                  onClick={() => handleDeletePost(p.id)}
                  className="text-[var(--nr)] hover:bg-rose-500/20 p-1 rounded shrink-0"
                  title="Delete post"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Proctor Reply Terminal */}
        <div className="bg-[#0b0b14] border border-purple-500/35 rounded p-4">
          <div className="font-orbitron text-[10px] text-[var(--np)] mb-2.5">
            PROCTOR_REPLY_TERMINAL // {user?.proctor_name?.toUpperCase() || "DR. LOKESH MALVIYA"}
          </div>
          <div className="bg-[#03030c] border border-[var(--bd)] rounded p-2.5 max-h-40 overflow-y-auto space-y-1.5 mb-2.5 text-[10px]">
            {proctorMsgs.slice(-6).map((m) => (
              <div
                key={m.id}
                className="border-l-2 pl-2"
                style={{ borderColor: m.is_proctor ? "var(--np)" : "var(--nb)" }}
              >
                <span
                  className="font-orbitron text-[8px] mr-1.5"
                  style={{ color: m.is_proctor ? "var(--np)" : "var(--nb)" }}
                >
                  {m.sender}:
                </span>
                <span className="text-slate-300">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mb-2">
            <input
              value={proctorReply}
              onChange={(e) => setProctorReply(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProctorReply()}
              placeholder="Send direct reply as Proctor..."
              className="cyber-input flex-1"
            />
            <button
              onClick={() => handleProctorReply()}
              className="border border-[var(--np)] text-[var(--np)] hover:bg-[var(--np)] hover:text-white font-orbitron text-[8.5px] px-3 py-1.5 rounded-sm transition"
            >
              SEND_REPLY
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[9px]">
            {[
              ["Quick: Acknowledged", "Noted. I am reviewing your request and will update your file shortly."],
              ["Quick: Office Visit", "Please visit AB1-312 tomorrow between 10 AM and 12 PM."],
              ["Quick: Attendance", "Maintain above 75% attendance across all courses before FAT."],
            ].map(([lbl, msg]) => (
              <button
                key={lbl}
                onClick={() => handleProctorReply(msg)}
                className="text-left px-2 py-1.5 border border-[var(--bd)] hover:border-[var(--np)] text-slate-400 hover:text-[var(--np)] rounded-sm transition"
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Controls Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--no)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            ADMIN_CONTROLS
          </div>
          <div className="space-y-1.5">
            <button
              onClick={() => handleAction("FORCE_RELEASE")}
              className="w-full py-2 border border-[var(--np)] text-[var(--np)] hover:bg-[var(--np)] hover:text-white font-orbitron text-[8.5px] rounded-sm transition"
            >
              FORCE_RELEASE_SLOT
            </button>
            <button
              onClick={() => handleAction("BROADCAST")}
              className="w-full py-2 border border-[var(--nr)] text-[var(--nr)] hover:bg-[var(--nr)] hover:text-white font-orbitron text-[8.5px] rounded-sm transition"
            >
              BROADCAST_ALERT
            </button>
            <button
              onClick={() => handleAction("EXPORT")}
              className="w-full py-2 border border-[var(--nb)] text-[var(--nb)] hover:bg-[var(--nb)] hover:text-black font-orbitron text-[8.5px] rounded-sm transition"
            >
              EXPORT_JSON_REPORT
            </button>
            <button
              onClick={refresh}
              className="w-full py-2 border border-[var(--ng)] text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black font-orbitron text-[8.5px] rounded-sm transition"
            >
              REFRESH_DATA
            </button>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="font-orbitron text-[9px] text-[var(--nb)] mb-2">LIVE_FEED</div>
          <div className="space-y-1.5 text-[9.5px] max-h-60 overflow-y-auto">
            {overview.logs.map((l) => (
              <div
                key={l.id}
                style={{
                  color:
                    l.level === "err"
                      ? "var(--nr)"
                      : l.level === "warn"
                      ? "var(--no)"
                      : "var(--ng)",
                }}
              >
                &gt; {l.event_time} {l.message}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
