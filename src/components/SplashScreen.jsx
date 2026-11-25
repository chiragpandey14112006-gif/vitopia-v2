import React, { useEffect } from "react";

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      id="splash"
      className="fixed inset-0 bg-[#03030e] z-[99999] flex flex-col items-center justify-center px-4"
    >
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div
          className="absolute w-[200px] h-[200px] rounded-full border border-cyan-400/20"
          style={{ animation: "ringExpand 2.5s ease-out infinite" }}
        />
        <div
          className="absolute w-[310px] h-[310px] rounded-full border border-purple-500/15"
          style={{ animation: "ringExpand 2.5s ease-out infinite 0.6s" }}
        />
        <div
          className="absolute w-[440px] h-[440px] rounded-full border border-cyan-400/10"
          style={{ animation: "ringExpand 2.5s ease-out infinite 1.2s" }}
        />
      </div>

      <div className="relative text-center mb-6">
        <div className="logo-3d text-5xl sm:text-7xl tracking-[8px] select-none">
          VITOPIA
        </div>
        <div
          className="font-orbitron text-[11px] tracking-[6px] text-cyan-400/70 mt-3"
          style={{ animation: "pulse 2s infinite" }}
        >
          CAMPUS OPERATING SYSTEM
        </div>
        <div className="text-[9px] text-purple-400/60 tracking-[4px] mt-1">
          VIT BHOPAL UNIVERSITY // v2.0
        </div>
      </div>

      <div
        className="w-72 h-[2px] my-3"
        style={{
          background: "linear-gradient(90deg, transparent, var(--nb), transparent)",
          animation: "scanLine 1.8s ease-in-out infinite",
        }}
      />

      <div className="w-60 h-[3px] bg-[#0a0a18] border border-[var(--bd)] rounded-sm overflow-hidden mt-3">
        <div
          className="h-full"
          style={{
            background: "linear-gradient(90deg, var(--nb), var(--np), var(--nk))",
            animation: "splashLoad 2.0s ease forwards",
          }}
        />
      </div>

      <div
        className="text-[9px] text-cyan-400/40 tracking-[2px] mt-3 font-orbitron"
        style={{ animation: "pulse 1s infinite" }}
      >
        INITIALIZING_SYSTEM...
      </div>

      <button
        onClick={onComplete}
        className="mt-8 border border-cyan-400/30 text-cyan-400/70 hover:text-cyan-300 hover:border-cyan-400 font-orbitron text-[9px] px-4 py-1.5 rounded-sm tracking-[2px] transition"
      >
        SKIP_BOOT →
      </button>
    </div>
  );
}
