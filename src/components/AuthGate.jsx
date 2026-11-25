import React, { useEffect, useState } from "react";
import { RefreshCw, ShieldCheck, Terminal, Wifi } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";

export default function AuthGate() {
  const { loginUser, pushToast } = useApp();
  const [mode, setMode] = useState("local"); // 'local' | 'vtop'

  // Local auth state
  const [name, setName] = useState("Mishika Mishra");
  const [regNo, setRegNo] = useState("25BAI10044");
  const [branch, setBranch] = useState("B.Tech CSE (AI & ML)");
  const [semester, setSemester] = useState("SEM-4");
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Live VTOP state
  const [vtopSessionId, setVtopSessionId] = useState("");
  const [captchaImg, setCaptchaImg] = useState("");
  const [vtopUser, setVtopUser] = useState("");
  const [vtopPass, setVtopPass] = useState("");
  const [vtopCaptcha, setVtopCaptcha] = useState("");
  const [vtopLoading, setVtopLoading] = useState(false);
  const [vtopInitLoading, setVtopInitLoading] = useState(false);

  const initVtop = async () => {
    setVtopInitLoading(true);
    setErr("");
    try {
      const res = await api.vtopInit();
      setVtopSessionId(res.session_id);
      setCaptchaImg(res.captcha_image || "");
      setVtopCaptcha("");
    } catch (e) {
      setErr(e.message || "Could not connect to VTOP Bhopal");
    } finally {
      setVtopInitLoading(false);
    }
  };

  useEffect(() => {
    if (mode === "vtop" && !vtopSessionId) {
      initVtop();
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefreshCaptcha = async () => {
    if (!vtopSessionId) {
      await initVtop();
      return;
    }
    setVtopInitLoading(true);
    setErr("");
    try {
      const res = await api.vtopRefreshCaptcha(vtopSessionId);
      setVtopSessionId(res.session_id);
      setCaptchaImg(res.captcha_image || "");
      setVtopCaptcha("");
    } catch (e) {
      setErr(e.message);
    } finally {
      setVtopInitLoading(false);
    }
  };

  const handleLocalSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !regNo.trim()) {
      setErr("Please enter both your full name and registration number.");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await api.loginLocal({
        name: name.trim(),
        reg_no: regNo.trim(),
        branch,
        semester,
        role,
      });
      await loginUser(res.user);
      pushToast(`⚡ SESSION ACTIVE // ${res.user.reg_no}`, "var(--nb)");
    } catch (e) {
      setErr(e.message || "Login failed. Make sure backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleVtopSubmit = async (e) => {
    e.preventDefault();
    if (!vtopUser.trim() || !vtopPass || !vtopCaptcha.trim()) {
      setErr("Enter your VTOP username, password, and the CAPTCHA shown above.");
      return;
    }
    setVtopLoading(true);
    setErr("");
    try {
      const res = await api.vtopLogin({
        session_id: vtopSessionId,
        username: vtopUser.trim(),
        password: vtopPass,
        captcha: vtopCaptcha.trim(),
      });
      if (!res.ok) {
        setErr(res.error || "VTOP authentication failed.");
        if (res.captcha_image) setCaptchaImg(res.captcha_image);
        setVtopCaptcha("");
        return;
      }
      await loginUser(res.user);
      pushToast(
        `✓ VTOP SYNCED (${res.scraped_counts?.timetable || 0} slots, ${res.scraped_counts?.exams || 0} exams)`,
        "var(--ng)"
      );
    } catch (e) {
      setErr(e.message || "VTOP handshake failed.");
    } finally {
      setVtopLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <div className="w-full max-w-[460px] relative">
        <div className="text-center mb-6">
          <div className="logo-3d text-4xl sm:text-5xl tracking-[6px] inline-block">
            VITOPIA
          </div>
          <div className="text-[9px] text-cyan-400/50 tracking-[3px] mt-2">
            CAMPUS_OS v2.0 // AUTH_REQUIRED
          </div>
        </div>

        <div className="bg-[#08081a]/95 border border-cyan-400/25 rounded p-6 sm:p-8 relative overflow-hidden shadow-[0_0_60px_rgba(0,243,255,0.08),0_0_120px_rgba(188,19,254,0.06)]">
          {/* Corner brackets */}
          <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[var(--nb)]" />
          <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[var(--nb)]" />
          <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[var(--nb)]" />
          <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[var(--nb)]" />
          <div
            className="absolute left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(0,243,255,0.4), transparent)",
              animation: "credScan 3.2s linear infinite",
            }}
          />

          <div className="font-orbitron text-[10px] text-[var(--nb)] tracking-[2px] text-center mb-5 drop-shadow-[0_0_8px_var(--nb)]">
            // STUDENT_IDENTITY_VERIFICATION
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              type="button"
              onClick={() => {
                setMode("local");
                setErr("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-sm font-orbitron text-[9px] tracking-wider border transition ${
                mode === "local"
                  ? "border-[var(--nb)] bg-cyan-400/10 text-[var(--nb)] shadow-[0_0_12px_rgba(0,243,255,0.2)]"
                  : "border-[var(--bd)] text-slate-500 hover:text-slate-300"
              }`}
            >
              <Terminal size={12} />
              CAMPUS_WORKSPACE
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("vtop");
                setErr("");
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-sm font-orbitron text-[9px] tracking-wider border transition ${
                mode === "vtop"
                  ? "border-[var(--ng)] bg-emerald-400/10 text-[var(--ng)] shadow-[0_0_12px_rgba(0,255,136,0.2)]"
                  : "border-[var(--bd)] text-slate-500 hover:text-slate-300"
              }`}
            >
              <Wifi size={12} />
              LIVE_VTOP_SYNC
            </button>
          </div>

          {err && (
            <div className="mb-4 p-2.5 border border-[var(--nr)] bg-rose-500/10 text-[var(--nr)] text-[10px] rounded-sm font-mono">
              ✗ {err}
            </div>
          )}

          {mode === "local" ? (
            <form onSubmit={handleLocalSubmit} className="space-y-3.5">
              <div>
                <label className="font-orbitron text-[8px] text-cyan-400/60 tracking-[1.5px] block mb-1">
                  STUDENT_NAME
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="cyber-input w-full py-2.5 px-3 font-orbitron text-xs tracking-wider"
                  placeholder="Enter full name..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-orbitron text-[8px] text-cyan-400/60 tracking-[1.5px] block mb-1">
                    REGISTRATION_NUMBER
                  </label>
                  <input
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                    className="cyber-input w-full py-2.5 px-3 font-orbitron text-xs tracking-wider text-[var(--np)] border-purple-500/30"
                    placeholder="25BCY10044"
                  />
                </div>
                <div>
                  <label className="font-orbitron text-[8px] text-cyan-400/60 tracking-[1.5px] block mb-1">
                    ACCESS_ROLE
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="cyber-input w-full py-2.5 px-3 text-xs"
                  >
                    <option value="student">STUDENT</option>
                    <option value="admin">ADMIN / PROCTOR</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-orbitron text-[8px] text-cyan-400/60 tracking-[1.5px] block mb-1">
                    BRANCH
                  </label>
                  <input
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="cyber-input w-full py-2 px-3 text-[11px]"
                  />
                </div>
                <div>
                  <label className="font-orbitron text-[8px] text-cyan-400/60 tracking-[1.5px] block mb-1">
                    SEMESTER
                  </label>
                  <select
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="cyber-input w-full py-2 px-3 text-[11px]"
                  >
                    {["SEM-1", "SEM-2", "SEM-3", "SEM-4", "SEM-5", "SEM-6", "SEM-7", "SEM-8"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 bg-gradient-to-r from-cyan-500/15 to-purple-500/15 border border-cyan-400/60 hover:border-cyan-300 text-white font-orbitron text-[10px] font-bold tracking-[3px] rounded-sm transition hover:shadow-[0_0_24px_rgba(0,243,255,0.35)] disabled:opacity-50"
              >
                {loading ? "INITIALIZING..." : "⚡ INITIATE_SESSION →"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVtopSubmit} className="space-y-3.5">
              <div className="p-2.5 border border-emerald-500/25 bg-emerald-500/5 rounded-sm text-[10px] text-emerald-300/80 flex items-start gap-2">
                <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[var(--ng)]" />
                <span>
                  Direct handshake with <strong>vtop.vitbhopal.ac.in</strong>. Credentials are sent only for live session scraping and never stored on disk.
                </span>
              </div>

              <div>
                <label className="font-orbitron text-[8px] text-emerald-400/70 tracking-[1.5px] block mb-1">
                  VTOP_USERNAME
                </label>
                <input
                  value={vtopUser}
                  onChange={(e) => setVtopUser(e.target.value)}
                  className="cyber-input w-full py-2.5 px-3 font-orbitron text-xs tracking-wider"
                  placeholder="e.g. 25BCY10044"
                />
              </div>

              <div>
                <label className="font-orbitron text-[8px] text-emerald-400/70 tracking-[1.5px] block mb-1">
                  VTOP_PASSWORD
                </label>
                <input
                  type="password"
                  value={vtopPass}
                  onChange={(e) => setVtopPass(e.target.value)}
                  className="cyber-input w-full py-2.5 px-3 text-xs tracking-wider"
                  placeholder="Enter VTOP password..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-orbitron text-[8px] text-emerald-400/70 tracking-[1.5px]">
                    VTOP_CAPTCHA (SOLVE_BELOW)
                  </label>
                  <button
                    type="button"
                    onClick={handleRefreshCaptcha}
                    disabled={vtopInitLoading}
                    className="flex items-center gap-1 text-[9px] text-[var(--nb)] hover:underline font-orbitron"
                  >
                    <RefreshCw size={10} className={vtopInitLoading ? "animate-spin" : ""} />
                    REFRESH
                  </button>
                </div>

                <div className="bg-white/95 rounded-sm p-2 flex items-center justify-center min-h-[54px] mb-2 border border-cyan-400/40">
                  {vtopInitLoading ? (
                    <span className="text-[10px] text-slate-700 font-orbitron">FETCHING_CAPTCHA...</span>
                  ) : captchaImg ? (
                    <img src={captchaImg} alt="VTOP Captcha" className="max-h-12 object-contain" />
                  ) : (
                    <span className="text-[10px] text-rose-600 font-orbitron">CAPTCHA_UNAVAILABLE</span>
                  )}
                </div>

                <input
                  value={vtopCaptcha}
                  onChange={(e) => setVtopCaptcha(e.target.value)}
                  className="cyber-input w-full py-2.5 px-3 font-orbitron text-xs tracking-[3px]"
                  placeholder="Type CAPTCHA text..."
                />
              </div>

              <button
                type="submit"
                disabled={vtopLoading || !vtopSessionId}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-[var(--ng)] text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black font-orbitron text-[10px] font-bold tracking-[2.5px] rounded-sm transition disabled:opacity-50"
              >
                {vtopLoading ? "SYNCING_VTOP_DATA..." : "⚡ CONNECT_&_SCRAPE_VTOP →"}
              </button>
            </form>
          )}

          <div className="text-center mt-4 font-orbitron text-[8px] text-slate-600 tracking-[1.5px]">
            // ALL_SESSIONS_ENCRYPTED · VIT_BHOPAL_NODE
          </div>
        </div>
      </div>
    </div>
  );
}
