import React, { useEffect, useState } from "react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";
import { BOOKING_SLOTS, RES_ICONS } from "../data/seedData";

const CATEGORIES = [
  { id: "lab", label: "[LABS]" },
  { id: "lib", label: "[LIBRARY]" },
  { id: "audi", label: "[AUDI]" },
  { id: "sport", label: "[SPORTS]" },
];

export default function TermBookView() {
  const {
    user,
    resources,
    preselectedResId,
    setPreselectedResId,
    syncDashboard,
    applyNewXP,
  } = useApp();

  const [cat, setCat] = useState("lab");
  const [selectedRes, setSelectedRes] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split("T")[0]);
  const [purpose, setPurpose] = useState("");
  const [alert, setAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedResId && resources.length) {
      const match = resources.find((r) => r.id === preselectedResId);
      if (match) {
        setCat(match.cat);
        setSelectedRes(match);
      }
      setPreselectedResId(null);
    }
  }, [preselectedResId, resources, setPreselectedResId]);

  const filtered = resources.filter((r) => r.cat === cat);

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!selectedRes || !selectedSlot) {
      setAlert({ ok: false, msg: "✗ SELECT RESOURCE + SLOT FIRST" });
      return;
    }
    if (!user?.reg_no) return;
    setSubmitting(true);
    setAlert(null);
    try {
      const res = await api.createBooking({
        reg_no: user.reg_no,
        resource_id: selectedRes.id,
        slot: selectedSlot,
        date_str: dateStr,
        purpose: purpose.trim() || "GENERAL",
      });
      await syncDashboard(user.reg_no);
      applyNewXP(res.xp, "⚡ +15 XP — Slot reserved!", "var(--np)");
      const altText = res.alt_suggestion
        ? ` · ⚡ AI notes quieter option: ${res.alt_suggestion}`
        : "";
      setAlert({
        ok: true,
        msg: `✓ SLOT_LOCKED (${res.auth_code}): ${selectedRes.name} @ ${selectedSlot}${altText}`,
      });
      setSelectedSlot(null);
      setPurpose("");
    } catch (err) {
      setAlert({ ok: false, msg: `✗ ${err.message}` });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_290px] gap-5 view-animate">
      <div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setSelectedRes(null);
              }}
              className={`font-orbitron text-[9px] px-3 py-1.5 rounded-sm border transition ${
                cat === c.id
                  ? "text-[var(--nb)] border-[var(--nb)] shadow-[0_0_8px_rgba(0,243,255,0.25)]"
                  : "text-slate-500 border-transparent hover:text-slate-300"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const isSel = selectedRes?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRes(r)}
                className={`cyber-card p-3.5 cursor-pointer ${
                  isSel ? "!border-[var(--nk)] shadow-[0_0_14px_rgba(255,0,255,0.2)]" : ""
                }`}
              >
                <div className="text-[8.5px] text-[var(--nb)] tracking-wider mb-1">
                  {RES_ICONS[r.cat] || "[RES]"} {r.cat.toUpperCase()}
                </div>
                <div className="font-orbitron text-[11px] text-slate-100 mb-1.5">{r.name}</div>
                <div className="text-[9px] text-slate-400">
                  {r.loc} | CAP:{r.cap} | LOAD:{r.fill}%
                </div>
                <div className="h-[3px] bg-[#151522] mt-2.5 rounded overflow-hidden">
                  <div
                    className="h-full rounded"
                    style={{
                      width: `${r.fill}%`,
                      background: "linear-gradient(90deg, var(--np), var(--nk))",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Slot Config Panel */}
      <aside className="cyber-panel p-4 h-fit">
        <div className="font-orbitron text-[10px] text-[var(--nb)] tracking-[1.5px] pb-2 mb-3 border-b border-[var(--bd)]">
          SLOT_CONFIG
        </div>
        <div className="text-[8px] text-slate-500 tracking-wider mb-1">RESOURCE</div>
        <div className="font-orbitron text-[10.5px] text-[var(--nb)] mb-3">
          {selectedRes ? `${selectedRes.name} (${selectedRes.fill}% load)` : "— SELECT A RESOURCE —"}
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {BOOKING_SLOTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSelectedSlot(s)}
              className={`py-2 text-[10px] rounded-sm border transition font-mono ${
                selectedSlot === s
                  ? "bg-[var(--nb)] text-black border-[var(--nb)] font-bold shadow-[0_0_10px_rgba(0,243,255,0.4)]"
                  : "bg-[#0e0e18] border-[var(--bd)] text-slate-300 hover:border-[var(--nb)] hover:text-[var(--nb)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <form onSubmit={handleReserve} className="space-y-2.5">
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="cyber-input w-full"
          />
          <input
            type="text"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="ACCESS_PURPOSE..."
            className="cyber-input w-full"
          />

          {alert && (
            <div
              className={`p-2 border rounded-sm text-[9.5px] ${
                alert.ok
                  ? "text-[var(--ng)] border-[var(--ng)] bg-emerald-500/10"
                  : "text-[var(--nr)] border-[var(--nr)] bg-rose-500/10"
              }`}
            >
              {alert.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 border border-[var(--np)] text-[var(--np)] hover:bg-[var(--np)] hover:text-white font-orbitron text-[9px] font-bold tracking-[1.5px] rounded-sm transition disabled:opacity-50"
          >
            {submitting ? "LOCKING..." : "EXECUTE_RESERVATION"}
          </button>
        </form>
      </aside>
    </div>
  );
}
