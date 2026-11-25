import React, { useEffect, useRef, useState } from "react";
import { Lock, Send } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";

const QUICK_TOPICS = [
  { key: "attendance", label: "📊 Attendance Issue", msg: "My attendance needs review — am I safe from FAT detention?" },
  { key: "leave", label: "📋 Leave Request", msg: "I need leave approval for an upcoming family event." },
  { key: "placement", label: "🎯 Placement Guidance", msg: "I need guidance for the upcoming placement season." },
  { key: "grievance", label: "⚠️ Raise Grievance", msg: "I have a campus/academic grievance I want to discuss." },
  { key: "exam", label: "📝 FAT/Exam Query", msg: "I have a query about my upcoming FAT exam schedule." },
  { key: "cgpa", label: "📈 CGPA & Grades", msg: "How can I push my CGPA higher this semester?" },
];

export default function ProctorChatView() {
  const { user, applyNewXP, pushToast } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!user?.reg_no) return;
    api
      .getProctorChat(user.reg_no)
      .then((res) => setMessages(res.messages || []))
      .catch(() => {});
  }, [user?.reg_no]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const sendMessage = async (text, topic = null) => {
    if (!text.trim() || !user?.reg_no) return;
    setSending(true);
    try {
      const res = await api.sendProctorMsg({
        reg_no: user.reg_no,
        text: text.trim(),
        topic,
        is_proctor: false,
      });
      setMessages(res.messages || []);
      applyNewXP(res.xp, "⚡ +5 XP — Proctor consulted", "var(--np)");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input;
    setInput("");
    await sendMessage(msg);
  };

  const proctorName = user?.proctor_name || "Dr. Lokesh Malviya";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4">
        {/* Banner */}
        <div className="bg-purple-600/5 border border-purple-500/30 rounded p-3.5 mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/15 border-2 border-[var(--np)] flex items-center justify-center text-lg">
              👨‍🏫
            </div>
            <div>
              <div className="font-orbitron text-xs text-[var(--np)]">
                {proctorName.toUpperCase()}
              </div>
              <div className="text-[9px] text-slate-400">
                PROCTOR // DEPT. OF CSE // {user?.proctor_office || "AB1-312"} · EXT: 4127
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 font-orbitron text-[9px] text-[var(--ng)]">
            <span className="w-2 h-2 rounded-full bg-[var(--ng)] animate-pulse" />
            ONLINE
          </div>
        </div>

        <div className="bg-cyan-500/5 border border-dashed border-cyan-500/20 rounded-sm px-3 py-2 mb-3 text-[9.5px] text-cyan-200/70 flex items-center gap-2">
          <Lock size={12} className="shrink-0 text-[var(--nb)]" />
          SECURE_CHANNEL: Grounded in your live attendance & CGPA for {user?.name} ({user?.reg_no}).
        </div>

        {/* Messages */}
        <div className="bg-[#03030c] border border-[var(--bd)] rounded p-3.5 h-[320px] overflow-y-auto space-y-2.5 mb-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-[10px] font-orbitron tracking-wider">
              <div>🔐 SECURE_CHANNEL_READY</div>
              <div className="text-[8.5px] text-slate-600 mt-1">
                Type a question or select a quick topic below
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.is_proctor ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[82%] p-3 rounded border text-[11px] leading-relaxed ${
                    m.is_proctor
                      ? "bg-purple-500/10 border-purple-500/35 rounded-tl-none"
                      : "bg-cyan-500/10 border-cyan-500/35 rounded-tr-none"
                  }`}
                >
                  <div
                    className="font-orbitron text-[8px] mb-1"
                    style={{ color: m.is_proctor ? "var(--np)" : "var(--nb)" }}
                  >
                    {m.sender}
                  </div>
                  <div className="text-slate-200">{m.text}</div>
                  <div className="text-[8px] text-slate-500 text-right mt-1">{m.created_at}</div>
                </div>
              </div>
            ))
          )}
          {sending && (
            <div className="flex items-center gap-2 text-[9px] font-orbitron text-[var(--np)] p-2">
              {proctorName.toUpperCase()} <span className="typing-dot" /> <span className="typing-dot" />{" "}
              <span className="typing-dot" />
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Custom Message Composer */}
        <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your proctor anything (e.g. 'Can I skip PHY1003 tomorrow?')..."
            className="cyber-input flex-1 py-2.5"
          />
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-1.5 border border-[var(--nb)] text-[var(--nb)] hover:bg-[var(--nb)] hover:text-black font-orbitron text-[9px] px-4 rounded-sm transition disabled:opacity-50"
          >
            <Send size={12} /> SEND
          </button>
        </form>

        {/* Quick Topics */}
        <div className="bg-purple-600/5 border border-purple-500/20 rounded p-3">
          <div className="font-orbitron text-[8px] text-[var(--np)] mb-2 tracking-wider">
            QUICK_TOPICS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {QUICK_TOPICS.map((t) => (
              <button
                key={t.key}
                type="button"
                disabled={sending}
                onClick={() => sendMessage(t.msg, t.key)}
                className="text-left bg-cyan-500/5 border border-cyan-500/20 hover:border-[var(--nb)] hover:bg-cyan-500/10 text-[var(--nb)] font-orbitron text-[8px] px-2.5 py-2 rounded-sm transition"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[var(--np)] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            PROCTOR_INFO
          </div>
          <div className="text-[10px] text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>NAME</span>
              <span className="text-[var(--np)]">{proctorName}</span>
            </div>
            <div className="flex justify-between">
              <span>OFFICE</span>
              <span>{user?.proctor_office || "AB1-312"}</span>
            </div>
            <div className="flex justify-between">
              <span>EXT</span>
              <span>4127</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3">
          <div className="font-orbitron text-[8px] text-[var(--ny)] mb-1">STUDENT_CONTEXT</div>
          <div className="font-orbitron text-[10px] text-[var(--nb)]">{user?.name}</div>
          <div className="text-[9.5px] text-slate-400 mt-0.5">
            {user?.reg_no} · {user?.semester} · CGPA {user?.cgpa}
          </div>
        </div>
      </aside>
    </div>
  );
}
