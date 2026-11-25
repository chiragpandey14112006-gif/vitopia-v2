import uuid
from datetime import datetime
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from ai_engine import compute_bunk_budget, generate_neural_insight, generate_proctor_reply
from db import ensure_student_seed, get_conn, init_db, rows_to_dicts
from vtop_scraper import TIME_SLOTS, parse_uploaded_timetable, vtop_manager

init_db()

app = FastAPI(title="VIT-O-PIA v2.0 Campus OS API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class LoginRequest(BaseModel):
    name: str
    reg_no: str
    branch: str = "B.Tech CSE (AI & ML)"
    semester: str = "SEM-4"
    role: str = "student"


class VTOPLoginRequest(BaseModel):
    session_id: str
    username: str
    password: str
    captcha: str


class BookingRequest(BaseModel):
    reg_no: str
    resource_id: int
    slot: str
    date_str: str
    purpose: str = "GENERAL"


class TimetableSlotCreate(BaseModel):
    reg_no: str
    day: str
    slot_idx: int
    slot_code: str
    course_code: str
    course_name: str
    venue: str
    faculty: str = "VIT Faculty"
    credits: int = 3
    attended: int = 18
    total: int = 20
    is_lab: bool = False


class AttendanceUpdate(BaseModel):
    attended: int
    total: int


class TimetableImportRequest(BaseModel):
    reg_no: str
    content: str
    filename: str = "timetable.txt"


class VaultCreateRequest(BaseModel):
    title: str
    course: str
    type: str
    uploader: str
    description: str = ""


class VoteRequest(BaseModel):
    delta: int
    reg_no: Optional[str] = None


class RedditCreateRequest(BaseModel):
    author: str
    topic: str = "General"
    text: str


class ProctorMessageRequest(BaseModel):
    reg_no: str
    text: str
    topic: Optional[str] = None
    is_proctor: bool = False
    sender: Optional[str] = None


class CalendarEventCreate(BaseModel):
    reg_no: str
    date_str: str
    title: str
    category: str = "event"
    description: str = ""


class AdminLogAction(BaseModel):
    action: str


class XPAwardRequest(BaseModel):
    reg_no: str
    amount: int
    reason: str = ""


def _award_xp(conn, reg_no: str, delta: int) -> int:
    row = conn.execute("SELECT xp FROM users WHERE reg_no = ?", (reg_no,)).fetchone()
    if not row:
        return 0
    new_xp = max(0, row["xp"] + delta)
    conn.execute("UPDATE users SET xp = ? WHERE reg_no = ?", (new_xp, reg_no))
    return new_xp


@app.get("/api/health")
def health():
    return {"status": "online", "service": "vitopia-v2", "time": datetime.now().isoformat()}


@app.post("/api/auth/login")
def login(req: LoginRequest):
    if not req.name.strip() or not req.reg_no.strip():
        raise HTTPException(status_code=400, detail="Name and Registration Number are required.")
    user = ensure_student_seed(req.reg_no, req.name, req.branch, req.semester, req.role)
    return {"user": user}


@app.post("/api/vtop/init")
def vtop_init():
    try:
        return vtop_manager.init_session()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Unable to reach vtop.vitbhopal.ac.in: {exc}")


@app.post("/api/vtop/captcha/refresh")
def vtop_refresh(session_id: str):
    try:
        return vtop_manager.refresh_captcha(session_id)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"CAPTCHA refresh failed: {exc}")


@app.post("/api/vtop/login")
def vtop_login(req: VTOPLoginRequest):
    try:
        res = vtop_manager.login_and_scrape(req.session_id, req.username, req.password, req.captcha)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"VTOP handshake error: {exc}")

    if not res.get("ok"):
        return res

    reg_no = res["reg_no"]
    profile = res["profile"]
    user = ensure_student_seed(
        reg_no,
        profile.get("name", reg_no),
        profile.get("branch", "B.Tech CSE"),
        profile.get("semester", "CURRENT"),
        "student",
    )

    conn = get_conn()
    conn.execute(
        "UPDATE users SET vtop_synced = 1, proctor_name = ?, proctor_office = ? WHERE reg_no = ?",
        (profile.get("proctor_name", "Dr. Lokesh Malviya"), profile.get("proctor_office", "AB1-312"), reg_no),
    )

    if res.get("timetable"):
        conn.execute("DELETE FROM timetable_slots WHERE reg_no = ?", (reg_no,))
        for slot in res["timetable"]:
            conn.execute(
                """
                INSERT INTO timetable_slots
                (reg_no, day, slot_idx, time_range, slot_code, course_code, course_name, venue, faculty, credits, attended, total, color_key, is_lab, col_span)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reg_no, slot["day"], slot["slot_idx"], slot["time_range"], slot["slot_code"],
                    slot["course_code"], slot["course_name"], slot["venue"], slot["faculty"],
                    slot["credits"], slot["attended"], slot["total"], slot["color_key"],
                    slot["is_lab"], slot["col_span"],
                ),
            )

    if res.get("exams"):
        conn.execute("DELETE FROM exam_schedule WHERE reg_no = ?", (reg_no,))
        for ex in res["exams"]:
            conn.execute(
                "INSERT INTO exam_schedule (reg_no, course_code, subject, exam_type, exam_date, time_slot, venue, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                (reg_no, ex["course_code"], ex["subject"], ex["exam_type"], ex["exam_date"], ex["time_slot"], ex["venue"], ex["status"]),
            )

    conn.commit()
    updated_user = dict(conn.execute("SELECT * FROM users WHERE reg_no = ?", (reg_no,)).fetchone())
    conn.close()
    return {"ok": True, "user": updated_user, "scraped_counts": {
        "timetable": len(res.get("timetable", [])),
        "attendance": len(res.get("attendance", [])),
        "exams": len(res.get("exams", [])),
    }}


@app.get("/api/dashboard/{reg_no}")
def get_dashboard(reg_no: str):
    reg_no = reg_no.upper()
    conn = get_conn()
    user_row = conn.execute("SELECT * FROM users WHERE reg_no = ?", (reg_no,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="User session not found")
    user = dict(user_row)

    resources = rows_to_dicts(conn.execute("SELECT * FROM resources ORDER BY id").fetchall())
    all_bks = rows_to_dicts(conn.execute("SELECT * FROM bookings").fetchall())
    user_bks = [b for b in all_bks if b["reg_no"] == reg_no]

    # Compute live fill from active bookings
    counts_by_res: dict[int, int] = {}
    for b in all_bks:
        counts_by_res[b["resource_id"]] = counts_by_res.get(b["resource_id"], 0) + 1
    for r in resources:
        added = counts_by_res.get(r["id"], 0) * 5
        r["live_fill"] = min(100, r["base_fill"] + added)
        r["fill"] = r["live_fill"]

    timetable = rows_to_dicts(conn.execute("SELECT * FROM timetable_slots WHERE reg_no = ? ORDER BY day, slot_idx", (reg_no,)).fetchall())
    for t in timetable:
        t["bunk_info"] = compute_bunk_budget(t["attended"], t["total"])

    marks = rows_to_dicts(conn.execute("SELECT * FROM marks WHERE reg_no = ?", (reg_no,)).fetchall())
    exams = rows_to_dicts(conn.execute("SELECT * FROM exam_schedule WHERE reg_no = ? ORDER BY exam_date", (reg_no,)).fetchall())
    cal_events = rows_to_dicts(conn.execute("SELECT * FROM calendar_events WHERE reg_no = ? ORDER BY date_str", (reg_no,)).fetchall())
    insight = generate_neural_insight(user, resources, timetable, exams, len(all_bks))

    conn.close()
    return {
        "user": user,
        "resources": resources,
        "bookings": user_bks,
        "all_bookings_count": len(all_bks),
        "timetable": timetable,
        "marks": marks,
        "exams": exams,
        "calendar_events": cal_events,
        "ai_insight": insight,
    }


@app.post("/api/ai/insight/{reg_no}")
def refresh_insight(reg_no: str):
    data = get_dashboard(reg_no)
    return data["ai_insight"]


@app.post("/api/bookings")
def create_booking(req: BookingRequest):
    reg_no = req.reg_no.strip().upper()
    conn = get_conn()
    res_row = conn.execute("SELECT * FROM resources WHERE id = ?", (req.resource_id,)).fetchone()
    if not res_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Resource not found")

    user_bks = conn.execute("SELECT * FROM bookings WHERE reg_no = ?", (reg_no,)).fetchall()
    if len(user_bks) >= 3:
        conn.close()
        raise HTTPException(status_code=400, detail="MAX 3 CONCURRENT RESERVATIONS REACHED")

    conflict = conn.execute(
        "SELECT * FROM bookings WHERE resource_id = ? AND slot = ? AND date_str = ?",
        (req.resource_id, req.slot, req.date_str),
    ).fetchone()
    if conflict:
        alt = conn.execute(
            "SELECT * FROM resources WHERE cat = ? AND id != ? ORDER BY base_fill ASC LIMIT 1",
            (res_row["cat"], req.resource_id),
        ).fetchone()
        conn.execute(
            "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
            (datetime.now().strftime("%H:%M"), f"Conflict blocked: {res_row['name']} @ {req.slot} ({reg_no})", "warn"),
        )
        conn.commit()
        conn.close()
        alt_hint = f" Try {alt['name']} ({alt['base_fill']}% load)." if alt else ""
        raise HTTPException(status_code=409, detail=f"SLOT_CONFLICT: {res_row['name']} @ {req.slot} already booked.{alt_hint}")

    auth_code = uuid.uuid4().hex[:6].upper()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    conn.execute(
        """
        INSERT INTO bookings (auth_code, reg_no, resource_id, resource_name, cat, slot, date_str, purpose, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (auth_code, reg_no, req.resource_id, res_row["name"], res_row["cat"], req.slot, req.date_str, req.purpose or "GENERAL", now_str),
    )
    new_xp = _award_xp(conn, reg_no, 15)
    conn.execute(
        "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
        (datetime.now().strftime("%H:%M"), f"Booking {auth_code}: {res_row['name']} @ {req.slot} by {reg_no}", "ok"),
    )

    alt_suggestion = None
    if res_row["base_fill"] >= 65:
        alt = conn.execute(
            "SELECT * FROM resources WHERE cat = ? AND id != ? AND base_fill < 50 ORDER BY base_fill ASC LIMIT 1",
            (res_row["cat"], req.resource_id),
        ).fetchone()
        if alt:
            alt_suggestion = f"{alt['name']} ({alt['base_fill']}% load)"

    conn.commit()
    bookings = rows_to_dicts(conn.execute("SELECT * FROM bookings WHERE reg_no = ? ORDER BY id DESC", (reg_no,)).fetchall())
    conn.close()
    return {"ok": True, "auth_code": auth_code, "xp": new_xp, "alt_suggestion": alt_suggestion, "bookings": bookings}


@app.delete("/api/bookings/{booking_id}")
def delete_booking(booking_id: int, reg_no: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM bookings WHERE id = ?", (booking_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Booking not found")
    conn.execute("DELETE FROM bookings WHERE id = ?", (booking_id,))
    conn.execute(
        "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
        (datetime.now().strftime("%H:%M"), f"Terminated booking {row['auth_code']} ({row['resource_name']})", "info"),
    )
    conn.commit()
    bookings = rows_to_dicts(conn.execute("SELECT * FROM bookings WHERE reg_no = ? ORDER BY id DESC", (reg_no.upper(),)).fetchall())
    conn.close()
    return {"ok": True, "bookings": bookings}


@app.post("/api/timetable/slot")
def add_timetable_slot(req: TimetableSlotCreate):
    reg_no = req.reg_no.strip().upper()
    day = req.day.strip().upper()[:3]
    if day not in {"MON", "TUE", "WED", "THU", "FRI"}:
        raise HTTPException(status_code=400, detail="Day must be MON–FRI")
    if req.slot_idx < 0 or req.slot_idx >= len(TIME_SLOTS):
        raise HTTPException(status_code=400, detail="Invalid slot index")

    palette = ["csa", "phy", "chy", "sst", "cse", "uhv", "eng"]
    color_key = "lab" if req.is_lab else palette[sum(ord(c) for c in req.course_code) % len(palette)]
    conn = get_conn()
    conn.execute("DELETE FROM timetable_slots WHERE reg_no = ? AND day = ? AND slot_idx = ?", (reg_no, day, req.slot_idx))
    conn.execute(
        """
        INSERT INTO timetable_slots
        (reg_no, day, slot_idx, time_range, slot_code, course_code, course_name, venue, faculty, credits, attended, total, color_key, is_lab, col_span)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            reg_no, day, req.slot_idx, TIME_SLOTS[req.slot_idx], req.slot_code.upper(),
            req.course_code.upper(), req.course_name, req.venue, req.faculty, req.credits,
            req.attended, req.total, color_key, 1 if req.is_lab else 0, 1,
        ),
    )
    new_xp = _award_xp(conn, reg_no, 10)
    conn.commit()
    rows = rows_to_dicts(conn.execute("SELECT * FROM timetable_slots WHERE reg_no = ? ORDER BY day, slot_idx", (reg_no,)).fetchall())
    for t in rows:
        t["bunk_info"] = compute_bunk_budget(t["attended"], t["total"])
    conn.close()
    return {"ok": True, "xp": new_xp, "timetable": rows}


@app.patch("/api/timetable/attendance/{reg_no}/{course_code}")
def update_attendance(reg_no: str, course_code: str, req: AttendanceUpdate):
    reg_no = reg_no.upper()
    course_code = course_code.upper()
    conn = get_conn()
    conn.execute(
        "UPDATE timetable_slots SET attended = ?, total = ? WHERE reg_no = ? AND course_code = ?",
        (max(0, req.attended), max(1, req.total), reg_no, course_code),
    )
    conn.commit()
    rows = rows_to_dicts(conn.execute("SELECT * FROM timetable_slots WHERE reg_no = ? ORDER BY day, slot_idx", (reg_no,)).fetchall())
    for t in rows:
        t["bunk_info"] = compute_bunk_budget(t["attended"], t["total"])
    conn.close()
    return {"ok": True, "timetable": rows}


@app.post("/api/timetable/import")
def import_timetable(req: TimetableImportRequest):
    reg_no = req.reg_no.strip().upper()
    slots = parse_uploaded_timetable(req.content, req.filename)
    if not slots:
        raise HTTPException(
            status_code=400,
            detail="Could not parse timetable slots. Use VTOP HTML, JSON, or lines formatted as: MON | 10:05-11:35 | CSA2001 | AB02-230",
        )
    conn = get_conn()
    conn.execute("DELETE FROM timetable_slots WHERE reg_no = ?", (reg_no,))
    for slot in slots:
        conn.execute(
            """
            INSERT INTO timetable_slots
            (reg_no, day, slot_idx, time_range, slot_code, course_code, course_name, venue, faculty, credits, attended, total, color_key, is_lab, col_span)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                reg_no, slot["day"], slot["slot_idx"], slot["time_range"], slot["slot_code"],
                slot["course_code"], slot["course_name"], slot["venue"], slot["faculty"],
                slot["credits"], slot["attended"], slot["total"], slot["color_key"],
                slot["is_lab"], slot["col_span"],
            ),
        )
    new_xp = _award_xp(conn, reg_no, 25)
    conn.commit()
    rows = rows_to_dicts(conn.execute("SELECT * FROM timetable_slots WHERE reg_no = ? ORDER BY day, slot_idx", (reg_no,)).fetchall())
    for t in rows:
        t["bunk_info"] = compute_bunk_budget(t["attended"], t["total"])
    conn.close()
    return {"ok": True, "count": len(slots), "xp": new_xp, "timetable": rows}


@app.post("/api/calendar/events")
def add_calendar_event(req: CalendarEventCreate):
    reg_no = req.reg_no.strip().upper()
    conn = get_conn()
    conn.execute(
        "INSERT INTO calendar_events (reg_no, date_str, title, category, description) VALUES (?, ?, ?, ?, ?)",
        (reg_no, req.date_str, req.title.strip(), req.category, req.description.strip()),
    )
    new_xp = _award_xp(conn, reg_no, 5)
    conn.commit()
    events = rows_to_dicts(conn.execute("SELECT * FROM calendar_events WHERE reg_no = ? ORDER BY date_str", (reg_no,)).fetchall())
    conn.close()
    return {"ok": True, "xp": new_xp, "calendar_events": events}


@app.get("/api/vault")
def list_vault():
    conn = get_conn()
    items = rows_to_dicts(conn.execute("SELECT * FROM vault_items ORDER BY votes DESC, id DESC").fetchall())
    conn.close()
    return {"items": items}


@app.post("/api/vault")
def create_vault(req: VaultCreateRequest):
    if not req.title.strip() or not req.course.strip():
        raise HTTPException(status_code=400, detail="Title and course are required")
    conn = get_conn()
    today = datetime.now().strftime("%Y-%m-%d")
    conn.execute(
        "INSERT INTO vault_items (title, course, type, uploader, description, votes, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)",
        (req.title.strip(), req.course.strip().upper(), req.type, req.uploader, req.description.strip(), today),
    )
    reg_no = req.uploader.split("_")[-1].upper() if "_" in req.uploader else ""
    new_xp = _award_xp(conn, reg_no, 50) if reg_no else 0
    conn.commit()
    items = rows_to_dicts(conn.execute("SELECT * FROM vault_items ORDER BY votes DESC, id DESC").fetchall())
    conn.close()
    return {"ok": True, "xp": new_xp, "items": items}


@app.post("/api/vault/{item_id}/vote")
def vote_vault(item_id: int, req: VoteRequest):
    conn = get_conn()
    row = conn.execute("SELECT * FROM vault_items WHERE id = ?", (item_id,)).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Vault item not found")
    delta = 1 if req.delta > 0 else -1
    conn.execute("UPDATE vault_items SET votes = votes + ? WHERE id = ?", (delta, item_id))
    new_xp = _award_xp(conn, req.reg_no.upper(), 5) if req.reg_no else None
    conn.commit()
    items = rows_to_dicts(conn.execute("SELECT * FROM vault_items ORDER BY votes DESC, id DESC").fetchall())
    conn.close()
    return {"ok": True, "xp": new_xp, "items": items}


@app.get("/api/reddit")
def list_reddit():
    conn = get_conn()
    posts = rows_to_dicts(conn.execute("SELECT * FROM reddit_posts ORDER BY id DESC LIMIT 30").fetchall())
    conn.close()
    return {"posts": posts}


@app.post("/api/reddit")
def create_reddit(req: RedditCreateRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Comment cannot be empty")
    conn = get_conn()
    now = datetime.now().strftime("%Y-%m-%d %H:%M")
    conn.execute(
        "INSERT INTO reddit_posts (author, topic, text, upvotes, created_at) VALUES (?, ?, ?, 1, ?)",
        (req.author, req.topic, req.text.strip(), now),
    )
    reg_no = req.author.split("_")[-1].upper() if "_" in req.author else ""
    new_xp = _award_xp(conn, reg_no, 10) if reg_no else 0
    conn.commit()
    posts = rows_to_dicts(conn.execute("SELECT * FROM reddit_posts ORDER BY id DESC LIMIT 30").fetchall())
    conn.close()
    return {"ok": True, "xp": new_xp, "posts": posts}


@app.post("/api/reddit/{post_id}/upvote")
def upvote_reddit(post_id: int):
    conn = get_conn()
    conn.execute("UPDATE reddit_posts SET upvotes = upvotes + 1 WHERE id = ?", (post_id,))
    conn.commit()
    posts = rows_to_dicts(conn.execute("SELECT * FROM reddit_posts ORDER BY id DESC LIMIT 30").fetchall())
    conn.close()
    return {"ok": True, "posts": posts}


@app.delete("/api/reddit/{post_id}")
def delete_reddit_post(post_id: int):
    conn = get_conn()
    conn.execute("DELETE FROM reddit_posts WHERE id = ?", (post_id,))
    conn.execute(
        "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
        (datetime.now().strftime("%H:%M"), f"Reddit post #{post_id} removed by Admin", "err"),
    )
    conn.commit()
    posts = rows_to_dicts(conn.execute("SELECT * FROM reddit_posts ORDER BY id DESC LIMIT 30").fetchall())
    conn.close()
    return {"ok": True, "posts": posts}


@app.delete("/api/reddit")
def purge_reddit():
    conn = get_conn()
    conn.execute("DELETE FROM reddit_posts")
    conn.execute(
        "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
        (datetime.now().strftime("%H:%M"), "All community comments purged by Admin", "err"),
    )
    conn.commit()
    conn.close()
    return {"ok": True, "posts": []}


@app.get("/api/proctor/{reg_no}")
def get_proctor_chat(reg_no: str):
    conn = get_conn()
    msgs = rows_to_dicts(conn.execute("SELECT * FROM proctor_messages WHERE reg_no = ? ORDER BY id ASC", (reg_no.upper(),)).fetchall())
    conn.close()
    return {"messages": msgs}


@app.post("/api/proctor")
def send_proctor_message(req: ProctorMessageRequest):
    reg_no = req.reg_no.strip().upper()
    conn = get_conn()
    user_row = conn.execute("SELECT * FROM users WHERE reg_no = ?", (reg_no,)).fetchone()
    if not user_row:
        conn.close()
        raise HTTPException(status_code=404, detail="Student not found")
    user = dict(user_row)
    now = datetime.now().strftime("%H:%M")

    if req.is_proctor:
        sender = req.sender or f"{user['proctor_name'].upper()} (PROCTOR)"
        conn.execute(
            "INSERT INTO proctor_messages (reg_no, sender, text, is_proctor, created_at) VALUES (?, ?, ?, 1, ?)",
            (reg_no, sender, req.text.strip(), now),
        )
        conn.commit()
        msgs = rows_to_dicts(conn.execute("SELECT * FROM proctor_messages WHERE reg_no = ? ORDER BY id ASC", (reg_no,)).fetchall())
        conn.close()
        return {"ok": True, "messages": msgs}

    # Student message + AI Proctor response
    conn.execute(
        "INSERT INTO proctor_messages (reg_no, sender, text, is_proctor, created_at) VALUES (?, ?, ?, 0, ?)",
        (reg_no, user["name"].upper(), req.text.strip(), now),
    )
    timetable = rows_to_dicts(conn.execute("SELECT * FROM timetable_slots WHERE reg_no = ?", (reg_no,)).fetchall())
    marks = rows_to_dicts(conn.execute("SELECT * FROM marks WHERE reg_no = ?", (reg_no,)).fetchall())
    exams = rows_to_dicts(conn.execute("SELECT * FROM exam_schedule WHERE reg_no = ?", (reg_no,)).fetchall())
    reply_text = generate_proctor_reply(user, timetable, marks, exams, req.text.strip(), req.topic)
    conn.execute(
        "INSERT INTO proctor_messages (reg_no, sender, text, is_proctor, created_at) VALUES (?, ?, ?, 1, ?)",
        (reg_no, user["proctor_name"].upper(), reply_text, now),
    )
    new_xp = _award_xp(conn, reg_no, 5)
    conn.commit()
    msgs = rows_to_dicts(conn.execute("SELECT * FROM proctor_messages WHERE reg_no = ? ORDER BY id ASC", (reg_no,)).fetchall())
    conn.close()
    return {"ok": True, "xp": new_xp, "messages": msgs}


@app.get("/api/admin/overview")
def admin_overview():
    conn = get_conn()
    bookings = rows_to_dicts(conn.execute("SELECT * FROM bookings ORDER BY id DESC").fetchall())
    resources = rows_to_dicts(conn.execute("SELECT * FROM resources").fetchall())
    logs = rows_to_dicts(conn.execute("SELECT * FROM admin_logs ORDER BY id DESC LIMIT 20").fetchall())
    posts = rows_to_dicts(conn.execute("SELECT * FROM reddit_posts ORDER BY id DESC LIMIT 20").fetchall())
    users_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    return {
        "bookings": bookings,
        "resources": resources,
        "logs": logs,
        "posts": posts,
        "registered_users": users_count,
    }


@app.post("/api/xp/award")
def award_xp_endpoint(req: XPAwardRequest):
    conn = get_conn()
    new_xp = _award_xp(conn, req.reg_no.strip().upper(), req.amount)
    conn.commit()
    conn.close()
    return {"ok": True, "xp": new_xp}


@app.post("/api/admin/action")
def admin_action(req: AdminLogAction):
    conn = get_conn()
    msg_map = {
        "FORCE_RELEASE": "FORCE_RELEASE_SLOT executed — idle slots reclaimed",
        "BROADCAST": "BROADCAST_ALERT pushed to all active campus nodes",
        "EXPORT": "SYSTEM_SNAPSHOT exported by Admin terminal",
    }
    msg = msg_map.get(req.action, f"{req.action} executed")
    conn.execute(
        "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
        (datetime.now().strftime("%H:%M"), msg, "ok"),
    )
    conn.commit()
    logs = rows_to_dicts(conn.execute("SELECT * FROM admin_logs ORDER BY id DESC LIMIT 20").fetchall())
    conn.close()
    return {"ok": True, "logs": logs}
