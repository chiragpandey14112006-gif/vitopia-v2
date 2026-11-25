const API_BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const msg = data?.detail || data?.error || `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  loginLocal: (payload) =>
    request("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
  vtopInit: () => request("/vtop/init", { method: "POST" }),
  vtopRefreshCaptcha: (sessionId) =>
    request(`/vtop/captcha/refresh?session_id=${encodeURIComponent(sessionId)}`, {
      method: "POST",
    }),
  vtopLogin: (payload) =>
    request("/vtop/login", { method: "POST", body: JSON.stringify(payload) }),
  getDashboard: (regNo) => request(`/dashboard/${encodeURIComponent(regNo)}`),
  refreshInsight: (regNo) =>
    request(`/ai/insight/${encodeURIComponent(regNo)}`, { method: "POST" }),
  createBooking: (payload) =>
    request("/bookings", { method: "POST", body: JSON.stringify(payload) }),
  deleteBooking: (id, regNo) =>
    request(`/bookings/${id}?reg_no=${encodeURIComponent(regNo)}`, {
      method: "DELETE",
    }),
  addTimetableSlot: (payload) =>
    request("/timetable/slot", { method: "POST", body: JSON.stringify(payload) }),
  updateAttendance: (regNo, courseCode, payload) =>
    request(
      `/timetable/attendance/${encodeURIComponent(regNo)}/${encodeURIComponent(courseCode)}`,
      { method: "PATCH", body: JSON.stringify(payload) }
    ),
  importTimetable: (payload) =>
    request("/timetable/import", { method: "POST", body: JSON.stringify(payload) }),
  addCalendarEvent: (payload) =>
    request("/calendar/events", { method: "POST", body: JSON.stringify(payload) }),
  listVault: () => request("/vault"),
  createVault: (payload) =>
    request("/vault", { method: "POST", body: JSON.stringify(payload) }),
  voteVault: (id, payload) =>
    request(`/vault/${id}/vote`, { method: "POST", body: JSON.stringify(payload) }),
  listReddit: () => request("/reddit"),
  createReddit: (payload) =>
    request("/reddit", { method: "POST", body: JSON.stringify(payload) }),
  upvoteReddit: (id) =>
    request(`/reddit/${id}/upvote`, { method: "POST" }),
  deleteReddit: (id) =>
    request(`/reddit/${id}`, { method: "DELETE" }),
  purgeReddit: () => request("/reddit", { method: "DELETE" }),
  getProctorChat: (regNo) =>
    request(`/proctor/${encodeURIComponent(regNo)}`),
  sendProctorMsg: (payload) =>
    request("/proctor", { method: "POST", body: JSON.stringify(payload) }),
  awardXP: (payload) =>
    request("/xp/award", { method: "POST", body: JSON.stringify(payload) }),
  adminOverview: () => request("/admin/overview"),
  adminAction: (action) =>
    request("/admin/action", { method: "POST", body: JSON.stringify({ action }) }),
};
