import React, { useEffect, useMemo, useState } from "react";
import { Download, Search, Upload } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";

const TYPE_STYLES = {
  Notes: { color: "var(--nb)", icon: "📝" },
  "Formula Sheet": { color: "var(--np)", icon: "📐" },
  "Python Script": { color: "var(--ng)", icon: "🐍" },
  "Past Paper": { color: "var(--no)", icon: "📄" },
  "Lab Report": { color: "var(--nr)", icon: "🔬" },
  Cheatsheet: { color: "var(--ny)", icon: "⚡" },
};

const COURSES = ["all", "CSE2003", "MAT2001", "PHY1003", "CHY1006", "CSE2004", "CSE3004"];

export default function VaultView() {
  const { user, applyNewXP, pushToast } = useApp();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [votedIds, setVotedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vitopia_v2_vault_voted") || "[]");
    } catch {
      return [];
    }
  });
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({
    title: "",
    course: "",
    type: "Notes",
    description: "",
  });

  useEffect(() => {
    api.listVault().then((res) => setItems(res.items || [])).catch(() => {});
  }, []);

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      const courseMatch = filter === "all" || item.course === filter;
      const q = query.trim().toLowerCase();
      const textMatch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.course.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q);
      return courseMatch && textMatch;
    });
  }, [items, filter, query]);

  const handleVote = async (id, delta) => {
    if (delta > 0 && votedIds.includes(id)) {
      pushToast("Already upvoted this resource!", "var(--ny)");
      return;
    }
    try {
      const res = await api.voteVault(id, { delta, reg_no: user?.reg_no });
      setItems(res.items || []);
      if (delta > 0) {
        const next = [...votedIds, id];
        setVotedIds(next);
        localStorage.setItem("vitopia_v2_vault_voted", JSON.stringify(next));
      }
      applyNewXP(res.xp, "⬡ +5 XP — Vault vote recorded!", "var(--ng)");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.course) {
      pushToast("✗ Title and Course are required", "var(--nr)");
      return;
    }
    const uploaderTag = `${(user?.name || "Student").split(" ")[0]}_${user?.reg_no || "VIT"}`;
    try {
      const res = await api.createVault({
        title: form.title.trim(),
        course: form.course,
        type: form.type,
        uploader: uploaderTag,
        description: form.description.trim(),
      });
      setItems(res.items || []);
      setForm({ title: "", course: "", type: "Notes", description: "" });
      setShowUpload(false);
      applyNewXP(res.xp, "⬡ +50 XP — Resource uploaded to Vault!", "var(--ng)");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    }
  };

  const handleDownload = (item) => {
    const content = `# ${item.title}\nCourse: ${item.course}\nType: ${item.type}\nUploader: ${item.uploader}\nDate: ${item.created_at}\n\n${item.description || "VIT-O-PIA Peer Study Vault Pack."}\n`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${item.course}_${item.title.replace(/[^a-z0-9]/gi, "_").slice(0, 32)}.md`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast(`📥 Downloaded ${item.course} study pack`, "var(--nb)");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4 border-emerald-400/20">
        <div className="font-orbitron text-xs text-[var(--ng)] pb-2.5 mb-4 border-b border-emerald-500/20 flex flex-wrap items-center gap-2">
          <span className="text-lg">⬡</span>
          DATA_VAULT // PEER-TO-PEER STUDY RESOURCES
          <span className="ml-auto text-[8px] text-emerald-400/50 tracking-wider">
            PERSISTED · STUDENT_POWERED
          </span>
        </div>

        {/* Filter + Search */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex flex-wrap gap-1 flex-1">
            {COURSES.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`font-orbitron text-[8.5px] px-2.5 py-1 rounded-sm border transition ${
                  filter === c
                    ? "text-[var(--ng)] border-[var(--ng)] shadow-[0_0_8px_rgba(0,255,136,0.25)]"
                    : "text-slate-500 border-transparent hover:text-slate-300"
                }`}
              >
                {c === "all" ? "ALL" : c}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-48">
            <Search size={12} className="absolute left-2.5 top-2.5 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes..."
              className="cyber-input w-full pl-7 text-[10px]"
            />
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {visibleItems.map((item) => {
            const st = TYPE_STYLES[item.type] || { color: "var(--nb)", icon: "📁" };
            const hasVoted = votedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="bg-[#0b0b14] border border-[var(--bd)] hover:border-emerald-400/45 rounded p-3.5 transition flex flex-col justify-between"
              >
                <div>
                  <div className="font-orbitron text-[8.5px] mb-1" style={{ color: st.color }}>
                    {st.icon} {item.type} · {item.course}
                  </div>
                  <div className="text-xs text-slate-100 font-medium mb-1">{item.title}</div>
                  {item.description && (
                    <div className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                      {item.description}
                    </div>
                  )}
                  <div className="text-[8.5px] text-slate-500 mb-3">
                    by {item.uploader} · {item.created_at}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => handleVote(item.id, 1)}
                    className={`border px-2 py-0.5 rounded-sm font-orbitron text-[8.5px] transition ${
                      hasVoted
                        ? "border-[var(--ng)] text-[var(--ng)]"
                        : "border-[var(--bd)] text-slate-400 hover:border-[var(--ng)] hover:text-[var(--ng)]"
                    }`}
                  >
                    ▲
                  </button>
                  <span className="font-orbitron text-xs text-[var(--ng)]">{item.votes}</span>
                  <button
                    onClick={() => handleVote(item.id, -1)}
                    className="border border-[var(--bd)] text-slate-400 hover:border-[var(--nr)] hover:text-[var(--nr)] px-2 py-0.5 rounded-sm font-orbitron text-[8.5px] transition"
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleDownload(item)}
                    className="ml-auto flex items-center gap-1 border border-[var(--bd)] hover:border-[var(--nb)] text-slate-300 hover:text-[var(--nb)] font-orbitron text-[8px] px-2.5 py-1 rounded-sm transition"
                  >
                    <Download size={10} /> GET
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload Trigger */}
        <button
          onClick={() => setShowUpload((v) => !v)}
          className="w-full mt-4 border border-dashed border-emerald-400/40 hover:border-[var(--ng)] bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06] rounded p-4 text-center transition"
        >
          <Upload size={18} className="mx-auto mb-1 text-[var(--ng)]" />
          <div className="font-orbitron text-[10px] text-[var(--ng)]">
            UPLOAD_RESOURCE TO VAULT (+50 XP)
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">
            Notes · Formulas · Scripts · Past papers · Lab reports
          </div>
        </button>

        {showUpload && (
          <form
            onSubmit={handleUpload}
            className="mt-3 p-4 bg-emerald-500/[0.04] border border-emerald-400/30 rounded space-y-2.5 view-animate"
          >
            <div className="font-orbitron text-[9px] text-[var(--ng)]">// UPLOAD_TO_VAULT</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Resource title..."
                className="cyber-input"
              />
              <select
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                className="cyber-input"
              >
                <option value="">Select course...</option>
                <option value="CSE2003">CSE2003 – Data Structures</option>
                <option value="MAT2001">MAT2001 – Probability & Stats</option>
                <option value="PHY1003">PHY1003 – Engineering Physics</option>
                <option value="CHY1006">CHY1006 – Engineering Chemistry</option>
                <option value="CSE2004">CSE2004 – Operating Systems</option>
                <option value="CSE3004">CSE3004 – Web Technology</option>
              </select>
            </div>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="cyber-input w-full"
            >
              {Object.entries(TYPE_STYLES).map(([t, s]) => (
                <option key={t} value={t}>
                  {s.icon} {t}
                </option>
              ))}
            </select>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Summary / key topics covered..."
              className="cyber-input w-full"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2 border border-[var(--ng)] text-[var(--ng)] hover:bg-[var(--ng)] hover:text-black font-orbitron text-[9px] rounded-sm transition"
              >
                ⬆ COMMIT_TO_VAULT
              </button>
              <button
                type="button"
                onClick={() => setShowUpload(false)}
                className="px-4 py-2 border border-[var(--bd)] text-slate-400 font-orbitron text-[9px] rounded-sm"
              >
                CANCEL
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Vault Stats Sidebar */}
      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--ng)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            VAULT_STATS
          </div>
          <div className="text-[10px] text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>TOTAL_FILES</span>
              <span className="text-[var(--ng)] font-orbitron">{items.length}</span>
            </div>
            <div className="flex justify-between">
              <span>CONTRIBUTORS</span>
              <span className="text-[var(--nb)]">23+</span>
            </div>
            <div className="flex justify-between">
              <span>TOP_COURSE</span>
              <span className="text-[var(--np)]">MAT2001</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3 text-[9.5px] text-slate-400 space-y-1">
          <div className="font-orbitron text-[8px] text-[var(--ny)] mb-1">VAULT_RULES</div>
          <div>① Academic content only</div>
          <div>② Label course correctly</div>
          <div>③ No active exam leaks</div>
          <div>④ Upvote verified notes</div>
        </div>
      </aside>
    </div>
  );
}
