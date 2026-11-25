import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../api/client";
import { getLevel } from "../data/seedData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem("vitopia_booted"));
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("vitopia_v2_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [activeView, setActiveView] = useState("home");
  const [resources, setResources] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [allBookingsCount, setAllBookingsCount] = useState(0);
  const [timetable, setTimetable] = useState([]);
  const [marks, setMarks] = useState([]);
  const [exams, setExams] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [aiInsight, setAiInsight] = useState(null);
  const [highlightedDate, setHighlightedDate] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [apiStatus, setApiStatus] = useState("connecting");
  const [preselectedResId, setPreselectedResId] = useState(null);

  const pushToast = useCallback((msg, color = "var(--ng)") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, color }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const syncDashboard = useCallback(async (regNo) => {
    if (!regNo) return;
    try {
      const data = await api.getDashboard(regNo);
      setUser(data.user);
      localStorage.setItem("vitopia_v2_user", JSON.stringify(data.user));
      setResources(data.resources || []);
      setBookings(data.bookings || []);
      setAllBookingsCount(data.all_bookings_count || 0);
      setTimetable(data.timetable || []);
      setMarks(data.marks || []);
      setExams(data.exams || []);
      setCalendarEvents(data.calendar_events || []);
      setAiInsight(data.ai_insight || null);
      setApiStatus("online");
    } catch {
      setApiStatus("offline");
    }
  }, []);

  useEffect(() => {
    if (user?.reg_no) {
      // Ensure backend has seeded user row on reload
      api
        .loginLocal({
          name: user.name,
          reg_no: user.reg_no,
          branch: user.branch || "B.Tech CSE (AI & ML)",
          semester: user.semester || "SEM-4",
          role: user.role || "student",
        })
        .then(() => syncDashboard(user.reg_no))
        .catch(() => setApiStatus("offline"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const finishSplash = useCallback(() => {
    sessionStorage.setItem("vitopia_booted", "1");
    setShowSplash(false);
  }, []);

  const loginUser = useCallback(
    async (userData) => {
      setUser(userData);
      localStorage.setItem("vitopia_v2_user", JSON.stringify(userData));
      await syncDashboard(userData.reg_no);

      // Daily login XP check
      const todayKey = `vitopia_daily_${userData.reg_no}_${new Date().toDateString()}`;
      if (!localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, "1");
        const hr = new Date().getHours();
        const bonus = hr < 9 ? 25 : 10;
        const msg = hr < 9 ? "🌅 +25 XP — EARLY_BIRD login bonus!" : "⚡ +10 XP — Daily session bonus!";
        try {
          const res = await api.awardXP({ reg_no: userData.reg_no, amount: bonus, reason: "daily_login" });
          setUser((u) => {
            const next = u ? { ...u, xp: res.xp } : u;
            if (next) localStorage.setItem("vitopia_v2_user", JSON.stringify(next));
            return next;
          });
          pushToast(msg, hr < 9 ? "var(--ny)" : "var(--ng)");
        } catch {
          // ignore
        }
      }
    },
    [pushToast, syncDashboard]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("vitopia_v2_user");
    setUser(null);
    setActiveView("home");
  }, []);

  const applyNewXP = useCallback(
    (newXp, toastMsg, color = "var(--ng)") => {
      if (typeof newXp !== "number") return;
      setUser((prev) => {
        if (!prev) return prev;
        const oldLvl = getLevel(prev.xp || 0);
        const newLvl = getLevel(newXp);
        if (newLvl > oldLvl) {
          pushToast(`🎉 LEVEL UP! Reached LVL ${newLvl}`, "var(--ny)");
        } else if (toastMsg) {
          pushToast(toastMsg, color);
        }
        const updated = { ...prev, xp: newXp };
        localStorage.setItem("vitopia_v2_user", JSON.stringify(updated));
        return updated;
      });
    },
    [pushToast]
  );

  const navigateToCalDate = useCallback((dateStr) => {
    setHighlightedDate(dateStr);
    setActiveView("cal");
  }, []);

  const jumpToBookResource = useCallback((resId = null) => {
    setPreselectedResId(resId);
    setActiveView("book");
  }, []);

  return (
    <AppContext.Provider
      value={{
        showSplash,
        finishSplash,
        user,
        setUser,
        loginUser,
        logout,
        activeView,
        setActiveView,
        resources,
        setResources,
        bookings,
        setBookings,
        allBookingsCount,
        timetable,
        setTimetable,
        marks,
        exams,
        calendarEvents,
        setCalendarEvents,
        aiInsight,
        setAiInsight,
        highlightedDate,
        setHighlightedDate,
        navigateToCalDate,
        preselectedResId,
        setPreselectedResId,
        jumpToBookResource,
        syncDashboard,
        applyNewXP,
        pushToast,
        apiStatus,
      }}
    >
      {children}
      {/* Toast stack */}
      <div className="fixed bottom-16 right-4 z-[99999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{ borderColor: t.color, color: t.color }}
            className="bg-[#0a0a18]/95 border font-orbitron text-[10px] px-4 py-2.5 rounded shadow-[0_4px_20px_rgba(0,0,0,0.75)] tracking-wider view-animate"
          >
            {t.msg}
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
