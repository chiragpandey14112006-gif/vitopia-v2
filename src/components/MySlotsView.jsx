import React, { useState } from "react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { RES_ICONS } from "../data/seedData";

export default function MySlotsView() {
  const { user, bookings, syncDashboard, pushToast } = useApp();
  const [sysLog, setSysLog] = useState("> System nominal. Persisted in SQLite.");

  const handleTerminate = async (b) => {
    if (!user?.reg_no) return;
    try {
      await api.deleteBooking(b.id, user.reg_no);
      await syncDashboard(user.reg_no);
      setSysLog(`> Terminated ${b.auth_code} (${b.resource_name}) @ ${new Date().toLocaleTimeString()}`);
      pushToast(`✓ Slot ${b.auth_code} released`, "var(--nk)");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div>
        <div className="font-orbitron text-[10px] text-slate-500 tracking-[2px] mb-3">
          // ACTIVE_RESERVATIONS
        </div>

        {bookings.length === 0 ? (
          <div className="cyber-panel p-8 text-center text-slate-500 font-orbitron text-[11px] tracking-[2px]">
            // NO_ACTIVE_RESERVATIONS
          </div>
        ) : (
          <div className="space-y-2.5">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-[#0b0b14] border border-[var(--bd)] hover:border-cyan-400/35 rounded p-4 flex flex-wrap justify-between items-center gap-3 transition"
              >
                <div>
                  <div className="font-orbitron text-xs text-[var(--nb)] mb-1">
                    {RES_ICONS[b.cat] || "[RES]"} {b.resource_name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    TIME: {b.slot} | DATE: {b.date_str} | PURPOSE: {b.purpose}
                  </div>
                  <div className="text-[9px] text-slate-600 mt-1 font-mono">
                    AUTH_TOKEN: {b.auth_code}
                  </div>
                </div>
                <button
                  onClick={() => handleTerminate(b)}
                  className="border border-[var(--nk)] text-[var(--nk)] hover:bg-[var(--nk)] hover:text-black font-orbitron text-[8.5px] px-3 py-1.5 rounded-sm tracking-wider transition"
                >
                  TERMINATE
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--np)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            SYSTEM_LOG
          </div>
          <div className="text-[10px] text-slate-500 space-y-1.5">
            <div>&gt; Auto-released after 15 mins no-show.</div>
            <div>&gt; Max 3 concurrent reservations.</div>
            <div>&gt; Conflict lock enforced server-side.</div>
            <div className="text-[var(--ng)] pt-2">{sysLog}</div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3 text-[10px] text-slate-400 space-y-1.5">
          <div className="flex justify-between">
            <span>BOOKED</span>
            <span className="font-orbitron text-[var(--nb)]">{bookings.length}</span>
          </div>
          <div className="flex justify-between">
            <span>REMAINING</span>
            <span className="font-orbitron text-[var(--ng)]">
              {Math.max(0, 3 - bookings.length)}
            </span>
          </div>
        </div>
      </aside>
    </div>
  );
}
