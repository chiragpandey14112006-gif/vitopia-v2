import React, { useEffect, useState } from "react";
import { ArrowBigUp, ExternalLink, Send } from "lucide-react";
import { api } from "../api/client";
import { useApp } from "../context/AppContext";

const TOPICS = [
  "All",
  "FAT Exam tips 2026",
  "Placement season Q&A",
  "Hostel food review",
  "WiFi speed issues",
];

export default function RedditView() {
  const { user, applyNewXP, pushToast } = useApp();
  const [posts, setPosts] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [postTopic, setPostTopic] = useState("FAT Exam tips 2026");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.listReddit().then((res) => setPosts(res.posts || [])).catch(() => {});
  }, []);

  const authorHandle = `u/${(user?.name || "Student").replace(/\s+/g, "_")}_${user?.reg_no || "VIT"}`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.createReddit({
        author: authorHandle,
        topic: postTopic,
        text: text.trim(),
      });
      setPosts(res.posts || []);
      setText("");
      applyNewXP(res.xp, "🤖 +10 XP — Posted to r/vitbhopal wall!", "#ff4500");
    } catch (err) {
      pushToast(`✗ ${err.message}`, "var(--nr)");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (id) => {
    try {
      const res = await api.upvoteReddit(id);
      setPosts(res.posts || []);
    } catch {
      // ignore
    }
  };

  const visiblePosts =
    selectedTopic === "All" ? posts : posts.filter((p) => p.topic === selectedTopic);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-5 view-animate">
      <div className="cyber-panel p-4">
        <div className="font-orbitron text-xs text-[#ff4500] pb-2.5 mb-4 border-b border-orange-600/30 flex items-center gap-2">
          <span className="text-lg">🤖</span> [REDDIT_COMMUNITY_TERMINAL] // r/vitbhopal
        </div>

        {/* External Reddit Banner */}
        <div className="bg-orange-600/5 border border-orange-600/35 rounded p-4 mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-orbitron text-xs text-[#ff4500] mb-1">r/vitbhopal</div>
            <div className="text-[10px] text-slate-300">Official VIT Bhopal student community on Reddit</div>
            <div className="text-[9px] text-slate-500 mt-0.5">
              Discussions • Memes • Placements • Campus Life
            </div>
          </div>
          <a
            href="https://www.reddit.com/r/vitbhopal/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border-2 border-[#ff4500] bg-orange-600/15 text-[#ff4500] hover:bg-[#ff4500] hover:text-white font-orbitron text-[9.5px] px-4 py-2 rounded-sm transition"
          >
            🚀 OPEN_REDDIT <ExternalLink size={12} />
          </a>
        </div>

        {/* Topic Filter Pills */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`font-orbitron text-[8px] px-2.5 py-1 rounded-sm border transition ${
                selectedTopic === t
                  ? "border-[#ff4500] text-[#ff4500] bg-orange-600/10"
                  : "border-[var(--bd)] text-slate-500 hover:text-slate-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Feed */}
        <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1 mb-4">
          {visiblePosts.length === 0 ? (
            <div className="text-center text-slate-500 text-[10px] py-8 border border-dashed border-[var(--bd)] rounded">
              // NO_POSTS_IN_TOPIC — START_THREAD_BELOW
            </div>
          ) : (
            visiblePosts.map((p, idx) => (
              <div
                key={p.id}
                className={`p-3 rounded-sm border border-l-2 border-l-[#ff4500] bg-orange-600/[0.03] ${
                  idx === 0 ? "border-orange-600/45" : "border-[var(--bd)]"
                }`}
              >
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-orbitron text-[#ff4500]">{p.author}</span>
                    <span className="text-[8px] px-1.5 py-0.5 bg-white/5 border border-white/10 rounded-sm text-slate-300">
                      {p.topic}
                    </span>
                  </div>
                  <span className="text-slate-500 font-mono">{p.created_at}</span>
                </div>
                <div className="text-[11px] text-slate-200 leading-relaxed mb-2">{p.text}</div>
                <button
                  onClick={() => handleUpvote(p.id)}
                  className="inline-flex items-center gap-1 text-[9px] font-orbitron text-slate-400 hover:text-[#ff4500] border border-[var(--bd)] hover:border-[#ff4500] px-2 py-0.5 rounded-sm transition"
                >
                  <ArrowBigUp size={12} /> {p.upvotes}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Composer */}
        <form
          onSubmit={handleSubmit}
          className="p-3.5 bg-orange-600/[0.04] border border-orange-600/25 rounded space-y-2.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-orbitron text-[9px] text-[#ff4500]">// POST_A_COMMENT</span>
            <select
              value={postTopic}
              onChange={(e) => setPostTopic(e.target.value)}
              className="cyber-input text-[9.5px] py-1"
            >
              {TOPICS.filter((t) => t !== "All").map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <textarea
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Share something with the VIT Bhopal community..."
            className="cyber-input w-full"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9px] text-slate-500">
              Posting as <span className="text-[var(--nb)]">{authorHandle}</span>
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 border border-[#ff4500] text-[#ff4500] hover:bg-[#ff4500] hover:text-white font-orbitron text-[9px] px-4 py-1.5 rounded-sm transition"
            >
              <Send size={11} /> POST_COMMENT (+10 XP)
            </button>
          </div>
        </form>
      </div>

      <aside className="cyber-panel p-3.5 h-fit space-y-4">
        <div>
          <div className="font-orbitron text-[10px] text-[#ff4500] tracking-[1.5px] pb-2 mb-2.5 border-b border-[var(--bd)]">
            REDDIT_INTEL
          </div>
          <div className="text-[10px] text-slate-400 space-y-2">
            <div className="flex justify-between">
              <span>SUBREDDIT</span>
              <span className="text-[#ff4500]">r/vitbhopal</span>
            </div>
            <div className="flex justify-between">
              <span>MEMBERS</span>
              <span className="text-[var(--ng)]">12.4K</span>
            </div>
            <div className="flex justify-between">
              <span>WALL_POSTS</span>
              <span className="text-[var(--nb)]">{posts.length}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--bd)] pt-3 text-[9.5px] text-slate-400 space-y-1">
          <div className="font-orbitron text-[8px] text-[var(--ny)] mb-1">COMMUNITY_RULES</div>
          <div>① Be respectful</div>
          <div>② No spam</div>
          <div>③ VIT Bhopal relevant</div>
          <div>④ Protect personal info</div>
        </div>
      </aside>
    </div>
  );
}
