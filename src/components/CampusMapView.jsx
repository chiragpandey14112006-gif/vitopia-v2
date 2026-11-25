import React, { useRef, useState } from "react";
import { ExternalLink, MapPin } from "lucide-react";
import { useApp } from "../context/AppContext";
import { LOCDATA } from "../data/seedData";

export default function CampusMapView() {
  const { jumpToBookResource } = useApp();
  const [selectedLoc, setSelectedLoc] = useState("ab1");
  const [tilt, setTilt] = useState({ rx: 22, ry: 0, rz: -0.8 });
  const sceneRef = useRef(null);

  const loc = LOCDATA[selectedLoc];

  const handleMouseMove = (e) => {
    if (!sceneRef.current) return;
    const rect = sceneRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: 24 - y * 12, ry: x * 8, rz: -0.8 + x * 1.2 });
  };

  const resetTilt = () => setTilt({ rx: 22, ry: 0, rz: -0.8 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4">
        <div className="font-orbitron text-[10px] text-[var(--nb)] tracking-[1.5px] mb-3 flex flex-wrap items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--ng)] shadow-[0_0_8px_var(--ng)] animate-pulse" />
          CAMPUS_NAVIGATOR // VIT_BHOPAL_UNIVERSITY
          <span className="ml-auto text-[8px] text-slate-500">
            HOVER_TO_TILT · CLICK_BUILDING_TO_INSPECT
          </span>
        </div>

        {/* Quick Location Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {Object.entries(LOCDATA).map(([key, item]) => (
            <button
              key={key}
              onClick={() => setSelectedLoc(key)}
              className={`font-orbitron text-[8px] px-2 py-1 rounded-sm border transition ${
                selectedLoc === key
                  ? "border-[var(--nb)] bg-cyan-500/15 text-[var(--nb)]"
                  : "border-[var(--bd)] text-slate-500 hover:text-slate-300"
              }`}
            >
              {item.n.split(" ")[0]}
            </button>
          ))}
        </div>

        {/* 3D Map Scene */}
        <div
          ref={sceneRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={resetTilt}
          className="map3d-scene mb-3"
        >
          <div
            className="map3d-board"
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) rotateZ(${tilt.rz}deg)`,
            }}
          >
            <div className="relative w-full overflow-hidden border border-cyan-400/20 rounded bg-[#03060f] shadow-[0_0_40px_rgba(0,243,255,0.08)]">
              <div className="map-scanline" />
              <span className="absolute top-1.5 left-1.5 w-3.5 h-3.5 border-t-2 border-l-2 border-[var(--nb)] z-10 pointer-events-none" />
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 border-t-2 border-r-2 border-[var(--nb)] z-10 pointer-events-none" />
              <span className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 border-b-2 border-l-2 border-[var(--nb)] z-10 pointer-events-none" />
              <span className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 border-b-2 border-r-2 border-[var(--nb)] z-10 pointer-events-none" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 font-orbitron text-[8px] text-cyan-400/60 tracking-[2px] z-10 pointer-events-none whitespace-nowrap">
                ◈ VIT BHOPAL UNIVERSITY — CAMPUS_GRID_v2.0 ◈
              </div>
              <div className="absolute bottom-2 right-3 font-mono text-[8px] text-cyan-400/40 z-10 pointer-events-none">
                23.2599°N · 77.4126°E
              </div>

              <svg viewBox="0 0 760 440" className="block w-full relative z-[2]">
                <defs>
                  <filter id="neon-glow">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="road-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="rgba(0,243,255,0)" />
                    <stop offset="50%" stopColor="rgba(0,243,255,0.28)" />
                    <stop offset="100%" stopColor="rgba(0,243,255,0)" />
                  </linearGradient>
                  <pattern id="micro-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M20 0L0 0 0 20" fill="none" stroke="rgba(0,243,255,0.05)" strokeWidth="0.5" />
                  </pattern>
                </defs>

                <rect width="760" height="440" fill="#03060f" />
                <rect width="760" height="440" fill="url(#micro-grid)" />
                <rect x="18" y="18" width="724" height="404" fill="none" stroke="rgba(0,243,255,0.14)" strokeWidth="1.5" strokeDasharray="8,4" rx="3" />

                {/* Roads */}
                <rect x="18" y="195" width="724" height="14" fill="rgba(0,243,255,0.04)" rx="2" />
                <line x1="18" y1="202" x2="742" y2="202" stroke="url(#road-grad)" strokeWidth="1" />
                <rect x="350" y="18" width="14" height="404" fill="rgba(0,243,255,0.04)" rx="2" />
                <line x1="357" y1="18" x2="357" y2="422" stroke="rgba(0,243,255,0.12)" strokeWidth="1" strokeDasharray="6,3" />
                <rect x="18" y="100" width="340" height="8" fill="rgba(0,243,255,0.03)" />
                <rect x="364" y="300" width="378" height="8" fill="rgba(0,243,255,0.03)" />

                {/* LAB COMPLEX */}
                <g onClick={() => setSelectedLoc("lab")} className="cursor-pointer" opacity={selectedLoc === "lab" ? 1 : 0.85}>
                  <rect x="38" y="38" width="90" height="58" rx="3" fill="rgba(0,243,255,0.08)" stroke="#00f3ff" strokeWidth={selectedLoc === "lab" ? 2.5 : 1.5} filter="url(#neon-glow)" />
                  <rect x="48" y="48" width="20" height="12" rx="1" fill="rgba(0,243,255,0.16)" />
                  <rect x="74" y="48" width="20" height="12" rx="1" fill="rgba(0,243,255,0.16)" />
                  <rect x="100" y="48" width="18" height="12" rx="1" fill="rgba(0,243,255,0.16)" />
                  <rect x="48" y="66" width="64" height="20" rx="1" fill="rgba(0,243,255,0.1)" />
                  <text x="83" y="112" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#00f3ff">LAB COMPLEX</text>
                  <circle cx="83" cy="67" r="3" fill="#00f3ff" />
                  <circle cx="83" cy="67" r="3" fill="none" stroke="#00f3ff" strokeWidth="1">
                    <animate attributeName="r" from="3" to="18" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" from="0.7" to="0" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                </g>

                {/* MAIN BUILDING */}
                <g onClick={() => setSelectedLoc("ab1")} className="cursor-pointer" opacity={selectedLoc === "ab1" ? 1 : 0.85}>
                  <rect x="155" y="32" width="110" height="72" rx="3" fill="rgba(0,243,255,0.09)" stroke="#00f3ff" strokeWidth={selectedLoc === "ab1" ? 3 : 2} filter="url(#neon-glow)" />
                  <rect x="168" y="74" width="28" height="10" rx="1" fill="rgba(0,243,255,0.2)" />
                  <text x="182" y="82" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="6" fill="#00f3ff">VIT</text>
                  <text x="210" y="64" textAnchor="middle" fontSize="10" fill="#ffff00">★</text>
                  <text x="210" y="120" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#00f3ff">MAIN BUILDING</text>
                </g>

                {/* MAYURI FOOD */}
                <g onClick={() => setSelectedLoc("food")} className="cursor-pointer" opacity={selectedLoc === "food" ? 1 : 0.85}>
                  <rect x="138" y="114" width="46" height="30" rx="2" fill="rgba(255,102,0,0.1)" stroke="#ff6600" strokeWidth={selectedLoc === "food" ? 2.2 : 1.2} />
                  <text x="161" y="158" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="6.5" fill="#ff6600">MAYURI</text>
                  <circle cx="161" cy="129" r="2.5" fill="#ff6600" />
                </g>

                {/* GIRLS HOSTEL */}
                <g onClick={() => setSelectedLoc("hostel")} className="cursor-pointer" opacity={selectedLoc === "hostel" ? 1 : 0.85}>
                  <rect x="260" y="185" width="130" height="90" rx="3" fill="rgba(188,19,254,0.08)" stroke="#bc13fe" strokeWidth={selectedLoc === "hostel" ? 2.5 : 1.5} filter="url(#neon-glow)" />
                  <text x="325" y="294" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#bc13fe">GIRLS HOSTEL</text>
                  <circle cx="325" cy="230" r="3" fill="#bc13fe" />
                </g>

                {/* BOYS HOSTEL */}
                <g onClick={() => setSelectedLoc("bhostel")} className="cursor-pointer" opacity={selectedLoc === "bhostel" ? 1 : 0.85}>
                  <rect x="480" y="200" width="100" height="70" rx="3" fill="rgba(0,243,255,0.06)" stroke="#00f3ff" strokeWidth={selectedLoc === "bhostel" ? 2.5 : 1.5} />
                  <text x="530" y="286" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#00f3ff">BOYS HOSTEL</text>
                  <circle cx="530" cy="235" r="2.5" fill="#00f3ff" />
                </g>

                {/* OPEN AUDITORIUM */}
                <g onClick={() => setSelectedLoc("audi")} className="cursor-pointer" opacity={selectedLoc === "audi" ? 1 : 0.85}>
                  <ellipse cx="100" cy="330" rx="68" ry="48" fill="rgba(255,0,255,0.06)" stroke="#ff00ff" strokeWidth={selectedLoc === "audi" ? 2.5 : 1.5} />
                  <ellipse cx="100" cy="330" rx="45" ry="30" fill="none" stroke="rgba(255,0,255,0.35)" strokeDasharray="4,3" />
                  <rect x="89" y="322" width="22" height="16" rx="2" fill="rgba(255,0,255,0.2)" stroke="#ff00ff" />
                  <text x="100" y="395" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#ff00ff">OPEN AUDITORIUM</text>
                </g>

                {/* ACADEMIC BLOCK 2 */}
                <g onClick={() => setSelectedLoc("ab2")} className="cursor-pointer" opacity={selectedLoc === "ab2" ? 1 : 0.85}>
                  <rect x="375" y="310" width="120" height="76" rx="3" fill="rgba(0,255,136,0.07)" stroke="#00ff88" strokeWidth={selectedLoc === "ab2" ? 2.5 : 1.5} filter="url(#neon-glow)" />
                  <text x="435" y="405" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#00ff88">ACADEMIC BLOCK 2</text>
                  <circle cx="435" cy="348" r="3" fill="#00ff88" />
                </g>

                {/* SPECIAL BLOCK */}
                <g onClick={() => setSelectedLoc("mess")} className="cursor-pointer" opacity={selectedLoc === "mess" ? 1 : 0.85}>
                  <rect x="510" y="312" width="80" height="62" rx="3" fill="rgba(255,0,64,0.07)" stroke="#ff0040" strokeWidth={selectedLoc === "mess" ? 2.5 : 1.5} />
                  <ellipse cx="550" cy="332" rx="14" ry="11" fill="rgba(255,0,64,0.16)" stroke="#ff0040" />
                  <text x="550" y="392" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#ff0040">SPECIAL BLOCK</text>
                </g>

                {/* SPORTS COMPLEX */}
                <g onClick={() => setSelectedLoc("sports")} className="cursor-pointer" opacity={selectedLoc === "sports" ? 1 : 0.85}>
                  <ellipse cx="655" cy="320" rx="60" ry="46" fill="rgba(255,255,0,0.03)" stroke="#ffff00" strokeWidth={selectedLoc === "sports" ? 2.5 : 1.2} />
                  <ellipse cx="655" cy="320" rx="36" ry="26" fill="none" stroke="rgba(255,255,0,0.3)" strokeDasharray="3,3" />
                  <text x="655" y="400" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="7" fill="#ffff00">SPORTS COMPLEX</text>
                </g>

                {/* MAIN GATE */}
                <g onClick={() => setSelectedLoc("gate")} className="cursor-pointer">
                  <polygon points="210,18 224,36 196,36" fill="rgba(255,102,0,0.2)" stroke="#ff6600" strokeWidth="1.5" />
                  <text x="210" y="50" textAnchor="middle" fontFamily="Orbitron,monospace" fontSize="6.5" fill="#ff6600">MAIN GATE</text>
                </g>

                {/* Animated Shuttle A */}
                <g>
                  <rect width="14" height="9" rx="2" fill="#00ff88" filter="url(#neon-glow)">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="203,18; 75,60; 75,197; 90,320; 200,197; 325,197; 420,340; 542,336; 642,312; 522,228; 420,197; 203,18"
                      dur="60s"
                      repeatCount="indefinite"
                    />
                  </rect>
                </g>

                {/* Animated Shuttle B */}
                <g>
                  <rect width="12" height="8" rx="2" fill="#bc13fe" filter="url(#neon-glow)">
                    <animateTransform
                      attributeName="transform"
                      type="translate"
                      values="318,224; 350,197; 542,336; 420,340; 200,197; 150,120; 200,60; 318,224"
                      dur="45s"
                      repeatCount="indefinite"
                    />
                  </rect>
                </g>
              </svg>
            </div>
          </div>
        </div>

        {/* Location Info Box */}
        {loc && (
          <div className="bg-black/90 border border-[var(--nb)] rounded p-4 view-animate">
            <div className="flex flex-wrap justify-between items-start gap-3">
              <div className="flex-1 min-w-[200px]">
                <div className="font-orbitron text-xs text-[var(--nk)] mb-1 flex items-center gap-1.5">
                  <MapPin size={13} /> // {loc.n}
                </div>
                <div className="text-[11px] text-slate-300 leading-relaxed">{loc.d}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] text-slate-500 tracking-wider">COORDINATES</div>
                <div className="font-orbitron text-[10px] text-[var(--nb)]">{loc.coords}</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 items-center">
              <button
                onClick={() => jumpToBookResource()}
                className="font-orbitron text-[8.5px] px-3 py-1.5 border border-[var(--nb)] text-[var(--nb)] hover:bg-[var(--nb)] hover:text-black rounded-sm transition"
              >
                [BOOK_RESOURCE]
              </button>
              <a
                href={loc.nav}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-orbitron text-[8.5px] px-3 py-1.5 border border-[var(--ng)] text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black rounded-sm transition"
              >
                ▶ NAVIGATE <ExternalLink size={10} />
              </a>
              <span className="ml-auto font-orbitron text-[8px] text-slate-500">[{loc.tag}]</span>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mt-3 text-[9px] text-slate-400">
          {[
            ["var(--nb)", "ACADEMIC"],
            ["var(--np)", "RESIDENTIAL"],
            ["var(--ng)", "ADMIN"],
            ["var(--no)", "TRANSPORT"],
            ["var(--nk)", "EVENTS"],
            ["var(--nr)", "DINING"],
            ["var(--ny)", "SPORTS"],
          ].map(([col, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <i className="w-2 h-2 rounded-full inline-block" style={{ background: col }} />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Location Intel Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4 text-[10px]">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--nb)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            LOCATION_INTEL
          </div>
          <div className="space-y-2 text-slate-400">
            <div>
              <div className="text-[8px] text-[var(--nb)]">GPS_COORDINATES</div>
              <div>23.2599° N, 77.4126° E</div>
            </div>
            <div>
              <div className="text-[8px] text-[var(--nb)]">CAMPUS_AREA</div>
              <div>200+ Acres · Sehore, MP</div>
            </div>
            <div>
              <div className="text-[8px] text-[var(--nb)]">MAPPED_NODES</div>
              <div>{Object.keys(LOCDATA).length} Active Zones</div>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="text-[8px] text-[var(--ng)] tracking-wider mb-2">LIVE_SHUTTLE_TRACKING</div>
          <div className="flex items-center gap-2 text-[9.5px] text-[var(--ng)] mb-1">
            <span className="w-2 h-2 rounded-full bg-[var(--ng)] animate-pulse" />
            🚌 SHUTTLE_A — OUTER LOOP
          </div>
          <div className="flex items-center gap-2 text-[9.5px] text-[var(--np)]">
            <span className="w-2 h-2 rounded-full bg-[var(--np)] animate-pulse" />
            🚐 SHUTTLE_B — HOSTEL/AB2
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="text-[8px] text-[var(--no)] tracking-wider mb-1">SELECTED_LOCATION</div>
          <div className="font-orbitron text-[11px] text-[var(--nb)]">{loc?.n}</div>
        </div>
      </aside>
    </div>
  );
}
