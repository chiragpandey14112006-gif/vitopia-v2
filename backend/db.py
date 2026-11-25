import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Any

DB_PATH = Path(__file__).parent / "vitopia.db"


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


DEFAULT_RESOURCES = [
    {"id": 1, "name": "CS Lab AB1-301", "cat": "lab", "loc": "AB1·F3", "base_fill": 30, "cap": 40},
    {"id": 2, "name": "CS Lab AB2-202", "cat": "lab", "loc": "AB2·F2", "base_fill": 65, "cap": 40},
    {"id": 3, "name": "ECE Lab AB3-101", "cat": "lab", "loc": "AB3·F1", "base_fill": 20, "cap": 35},
    {"id": 4, "name": "Mech Workshop", "cat": "lab", "loc": "AB4·GF", "base_fill": 80, "cap": 30},
    {"id": 5, "name": "Main Library", "cat": "lib", "loc": "AB1·GF", "base_fill": 40, "cap": 200},
    {"id": 6, "name": "Digital Library", "cat": "lib", "loc": "LB Block", "base_fill": 55, "cap": 80},
    {"id": 7, "name": "Audi 1", "cat": "audi", "loc": "AB1·GF", "base_fill": 10, "cap": 500},
    {"id": 8, "name": "Seminar Hall", "cat": "audi", "loc": "AB2·GF", "base_fill": 25, "cap": 120},
    {"id": 9, "name": "Basketball Court", "cat": "sport", "loc": "Sports", "base_fill": 60, "cap": 20},
    {"id": 10, "name": "Badminton Court", "cat": "sport", "loc": "Sports", "base_fill": 12, "cap": 8},
]

DEFAULT_TIMETABLE = [
    # MON
    {"day": "MON", "slot_idx": 1, "time_range": "10:05–11:35", "slot_code": "B11", "course_code": "CSA2001", "course_name": "Data Structures & Algorithms", "venue": "AB02-230", "faculty": "Dr. Rajesh Verma", "credits": 4, "attended": 24, "total": 26, "color_key": "csa", "is_lab": 0, "col_span": 1},
    {"day": "MON", "slot_idx": 3, "time_range": "13:15–14:45", "slot_code": "G11", "course_code": "PHY1003", "course_name": "Engineering Physics", "venue": "AB-507", "faculty": "Dr. Ananya Sharma", "credits": 4, "attended": 20, "total": 27, "color_key": "phy", "is_lab": 0, "col_span": 1},
    {"day": "MON", "slot_idx": 4, "time_range": "14:50–16:20", "slot_code": "E12", "course_code": "CHY1006", "course_name": "Engineering Chemistry", "venue": "AB-302", "faculty": "Dr. Neeraj Tiwari", "credits": 3, "attended": 18, "total": 23, "color_key": "chy", "is_lab": 0, "col_span": 1},
    {"day": "MON", "slot_idx": 6, "time_range": "18:00–19:30", "slot_code": "F21", "course_code": "SST1003", "course_name": "Social Science & Technology", "venue": "AB-418", "faculty": "Prof. Kavita Rao", "credits": 2, "attended": 19, "total": 20, "color_key": "sst", "is_lab": 0, "col_span": 1},
    # TUE
    {"day": "TUE", "slot_idx": 6, "time_range": "18:00–19:30", "slot_code": "F22", "course_code": "CSE0001", "course_name": "C Programming", "venue": "CR-018", "faculty": "Prof. Amit Kulkarni", "credits": 3, "attended": 22, "total": 25, "color_key": "cse", "is_lab": 0, "col_span": 1},
    # WED
    {"day": "WED", "slot_idx": 1, "time_range": "10:05–11:35", "slot_code": "B12", "course_code": "CSA2001", "course_name": "Data Structures & Algorithms", "venue": "AB02-230", "faculty": "Dr. Rajesh Verma", "credits": 4, "attended": 24, "total": 26, "color_key": "csa", "is_lab": 0, "col_span": 1},
    {"day": "WED", "slot_idx": 3, "time_range": "13:15–14:45", "slot_code": "G12", "course_code": "PHY1003", "course_name": "Engineering Physics", "venue": "AB-507", "faculty": "Dr. Ananya Sharma", "credits": 4, "attended": 20, "total": 27, "color_key": "phy", "is_lab": 0, "col_span": 1},
    {"day": "WED", "slot_idx": 4, "time_range": "14:50–16:20", "slot_code": "E13", "course_code": "UHV0002", "course_name": "Universal Human Values", "venue": "CR-018", "faculty": "Dr. Meena Joshi", "credits": 2, "attended": 16, "total": 16, "color_key": "uhv", "is_lab": 0, "col_span": 1},
    {"day": "WED", "slot_idx": 6, "time_range": "18:00–19:30", "slot_code": "F23", "course_code": "ENG2005", "course_name": "Technical English", "venue": "AB-419", "faculty": "Prof. Ritu Nair", "credits": 2, "attended": 21, "total": 23, "color_key": "eng", "is_lab": 0, "col_span": 1},
    # THU
    {"day": "THU", "slot_idx": 1, "time_range": "10:05–13:10", "slot_code": "L11+L12", "course_code": "CHY1006L", "course_name": "Chemistry Lab (3hr)", "venue": "CHEM-LAB-101", "faculty": "Dr. Neeraj Tiwari", "credits": 1, "attended": 12, "total": 12, "color_key": "lab", "is_lab": 1, "col_span": 2},
    {"day": "THU", "slot_idx": 4, "time_range": "14:50–16:20", "slot_code": "B13", "course_code": "CSA2001", "course_name": "Data Structures & Algorithms", "venue": "AB02-230", "faculty": "Dr. Rajesh Verma", "credits": 4, "attended": 24, "total": 26, "color_key": "csa", "is_lab": 0, "col_span": 1},
    {"day": "THU", "slot_idx": 6, "time_range": "18:00–19:30", "slot_code": "F24", "course_code": "UHV0002", "course_name": "Universal Human Values", "venue": "CR-019", "faculty": "Dr. Meena Joshi", "credits": 2, "attended": 16, "total": 16, "color_key": "uhv", "is_lab": 0, "col_span": 1},
    # FRI
    {"day": "FRI", "slot_idx": 1, "time_range": "10:05–11:35", "slot_code": "B14", "course_code": "CSA2001", "course_name": "Data Structures & Algorithms", "venue": "AB02-230", "faculty": "Dr. Rajesh Verma", "credits": 4, "attended": 24, "total": 26, "color_key": "csa", "is_lab": 0, "col_span": 1},
    {"day": "FRI", "slot_idx": 3, "time_range": "13:15–14:45", "slot_code": "G13", "course_code": "PHY1003", "course_name": "Engineering Physics", "venue": "AB-507", "faculty": "Dr. Ananya Sharma", "credits": 4, "attended": 20, "total": 27, "color_key": "phy", "is_lab": 0, "col_span": 1},
    {"day": "FRI", "slot_idx": 5, "time_range": "16:25–17:55", "slot_code": "E22", "course_code": "UHV0002", "course_name": "Universal Human Values", "venue": "CR-018", "faculty": "Dr. Meena Joshi", "credits": 2, "attended": 16, "total": 16, "color_key": "uhv", "is_lab": 0, "col_span": 1},
]

DEFAULT_MARKS = [
    {"course_code": "CSE3001", "course_name": "Database Management Systems", "credits": 4, "internal": 34.0, "internal_max": 40, "midsem_raw": 42.0, "midsem_max": 50, "endsem_raw": None, "endsem_max": 100},
    {"course_code": "CSE3002", "course_name": "Computer Networks", "credits": 4, "internal": 38.0, "internal_max": 40, "midsem_raw": 45.0, "midsem_max": 50, "endsem_raw": None, "endsem_max": 100},
    {"course_code": "MAT2001", "course_name": "Probability & Statistics", "credits": 4, "internal": 28.0, "internal_max": 40, "midsem_raw": 35.0, "midsem_max": 50, "endsem_raw": None, "endsem_max": 100},
    {"course_code": "CSE2003", "course_name": "Data Structures", "credits": 4, "internal": 36.0, "internal_max": 40, "midsem_raw": 40.0, "midsem_max": 50, "endsem_raw": 78.0, "endsem_max": 100},
    {"course_code": "CSE2004", "course_name": "Operating Systems", "credits": 4, "internal": 32.0, "internal_max": 40, "midsem_raw": 38.0, "midsem_max": 50, "endsem_raw": None, "endsem_max": 100},
    {"course_code": "CSE3004", "course_name": "Web Technology", "credits": 3, "internal": 40.0, "internal_max": 40, "midsem_raw": 47.0, "midsem_max": 50, "endsem_raw": None, "endsem_max": 100},
]

DEFAULT_EXAMS = [
    {"course_code": "CSE3001", "subject": "Database Mgmt Systems", "exam_type": "ENDSEM", "exam_date": "2026-04-15", "time_slot": "09:00–12:00", "venue": "AB1-301", "status": "COMPLETED"},
    {"course_code": "CSE3002", "subject": "Computer Networks", "exam_type": "ENDSEM", "exam_date": "2026-04-18", "time_slot": "09:00–12:00", "venue": "AB1-302", "status": "COMPLETED"},
    {"course_code": "MAT2001", "subject": "Probability & Statistics", "exam_type": "ENDSEM", "exam_date": "2026-04-22", "time_slot": "14:00–17:00", "venue": "AB2-201", "status": "COMPLETED"},
    {"course_code": "CSE3003", "subject": "Software Engineering", "exam_type": "ENDSEM", "exam_date": "2026-11-28", "time_slot": "09:00–12:00", "venue": "AB1-301", "status": "UPCOMING"},
    {"course_code": "CSE3004", "subject": "Web Technology", "exam_type": "ENDSEM", "exam_date": "2026-12-01", "time_slot": "09:00–12:00", "venue": "AB2-202", "status": "UPCOMING"},
    {"course_code": "HUM1002", "subject": "Technical Communication", "exam_type": "ENDSEM", "exam_date": "2026-12-03", "time_slot": "14:00–17:00", "venue": "AB1-205", "status": "UPCOMING"},
]

DEFAULT_VAULT = [
    {"title": "DSA Complete Notes - Trees & Graphs", "course": "CSE2003", "type": "Notes", "uploader": "Arjun_25CSE", "votes": 47, "description": "Comprehensive traversal, AVL rotation, Dijkstra, Kruskal & DP on trees summary for FAT.", "created_at": "2026-11-10"},
    {"title": "MAT2001 Formula Sheet - Probability", "course": "MAT2001", "type": "Formula Sheet", "uploader": "Priya_25ECE", "votes": 38, "description": "Bayes theorem, Poisson, Normal, Chi-square & t-distribution critical values.", "created_at": "2026-11-12"},
    {"title": "Python Scripts - Computational Chemistry Lab", "course": "CHY1006", "type": "Python Script", "uploader": "Rohan_25AI", "votes": 29, "description": "Titration curve plotter & Beer-Lambert regression analyzer in Python.", "created_at": "2026-11-14"},
    {"title": "OS Process Scheduling Cheatsheet", "course": "CSE2004", "type": "Cheatsheet", "uploader": "Simran_25CSE", "votes": 24, "description": "FCFS, SJF, Round Robin Gantt shortcuts & Banker's deadlock detection walkthrough.", "created_at": "2026-11-15"},
    {"title": "Engineering Physics - Wave Optics Summary", "course": "PHY1003", "type": "Notes", "uploader": "Dev_25MECH", "votes": 19, "description": "Michelson interferometer, Newton rings, Fraunhofer diffraction derivations.", "created_at": "2026-11-18"},
    {"title": "Web Tech - JavaScript ES6+ Quick Reference", "course": "CSE3004", "type": "Cheatsheet", "uploader": "Anika_25CSE", "votes": 33, "description": "Async/await, Promises, React hooks lifecycle, and REST patterns.", "created_at": "2026-11-20"},
    {"title": "MAT2001 Mid-Sem Previous Paper 2025", "course": "MAT2001", "type": "Past Paper", "uploader": "Kiran_25ECE", "votes": 52, "description": "Solved Fall 2025 question paper with step-by-step probability proofs.", "created_at": "2026-11-21"},
]

DEFAULT_REDDIT = [
    {"author": "u/Arjun_25CSE", "topic": "FAT Exam tips 2026", "text": "Pro-tip for FAT week: Digital Library in LB Block stays quietest between 10 AM and 1 PM before the afternoon rush hits AB2!", "upvotes": 24, "created_at": "2026-11-24 18:10"},
    {"author": "u/Priya_25ECE", "topic": "Placement season Q&A", "text": "Anyone else preparing for the campus placement mock aptitude drive? Check the MAT2001 & DSA notes in the Data Vault.", "upvotes": 19, "created_at": "2026-11-25 09:40"},
    {"author": "u/Rohan_25AI", "topic": "Hostel food review", "text": "Special Block masala dosa at 8 AM today was genuinely S-tier. Shuttle A was right on time at Boys Hostel too.", "upvotes": 31, "created_at": "2026-11-25 11:15"},
]

DEFAULT_CAL_EVENTS = [
    {"date_str": "2026-11-14", "title": "CHILDREN_TECH_DAY", "category": "event", "description": "Robotics & AI showcase at Open Auditorium."},
    {"date_str": "2026-11-20", "title": "WINTER_FEST_BRIEF", "category": "event", "description": "Cultural club registrations close at AB2."},
    {"date_str": "2026-11-25", "title": "LAST_INST_REVIEW", "category": "inst", "description": "Final attendance freeze & lab sign-off reminder."},
    {"date_str": "2026-11-28", "title": "CSE3003 // FAT_EXAM", "category": "fat", "description": "Software Engineering Endsem — AB1-301 (09:00–12:00)"},
    {"date_str": "2026-12-01", "title": "CSE3004 // FAT_EXAM", "category": "fat", "description": "Web Technology Endsem — AB2-202 (09:00–12:00)"},
    {"date_str": "2026-12-03", "title": "HUM1002 // FAT_EXAM", "category": "fat", "description": "Technical Communication Endsem — AB1-205 (14:00–17:00)"},
    {"date_str": "2026-12-08", "title": "PLACEMENT_DRIVE // TCS_Ninja", "category": "event", "description": "Aptitude + Technical interview pre-placement briefing at Audi 1."},
    {"date_str": "2026-12-12", "title": "TECHNEX_2026 // Tech Fest", "category": "event", "description": "Annual technical symposium across AB1 & Lab Complex."},
    {"date_str": "2026-12-18", "title": "HACKVERSE // 24hr Hackathon", "category": "event", "description": "24-hour AI & Cybersecurity build sprint in AB1."},
    {"date_str": "2026-12-22", "title": "SPORTS_WEEK // Inter-College", "category": "event", "description": "Cricket, Badminton & Basketball tournaments at Sports Complex."},
    {"date_str": "2026-12-25", "title": "CHRISTMAS_HOLIDAY", "category": "holiday", "description": "Public Holiday — Campus academic blocks closed."},
    {"date_str": "2026-12-30", "title": "CULTURAL_NIGHT // Annual Fest", "category": "event", "description": "VITopia Cultural Night at Open Auditorium."},
]


def init_db() -> None:
    conn = get_conn()
    cur = conn.cursor()
    cur.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            reg_no TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            branch TEXT DEFAULT 'B.Tech CSE (AI & ML)',
            semester TEXT DEFAULT 'SEM-4',
            proctor_name TEXT DEFAULT 'Dr. Lokesh Malviya',
            proctor_office TEXT DEFAULT 'AB1-312',
            cgpa REAL DEFAULT 8.74,
            xp INTEGER DEFAULT 1240,
            role TEXT DEFAULT 'student',
            vtop_synced INTEGER DEFAULT 0,
            last_login TEXT
        );

        CREATE TABLE IF NOT EXISTS resources (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            cat TEXT NOT NULL,
            loc TEXT NOT NULL,
            base_fill INTEGER NOT NULL,
            cap INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            auth_code TEXT NOT NULL,
            reg_no TEXT NOT NULL,
            resource_id INTEGER NOT NULL,
            resource_name TEXT NOT NULL,
            cat TEXT NOT NULL,
            slot TEXT NOT NULL,
            date_str TEXT NOT NULL,
            purpose TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS timetable_slots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reg_no TEXT NOT NULL,
            day TEXT NOT NULL,
            slot_idx INTEGER NOT NULL,
            time_range TEXT NOT NULL,
            slot_code TEXT NOT NULL,
            course_code TEXT NOT NULL,
            course_name TEXT NOT NULL,
            venue TEXT NOT NULL,
            faculty TEXT DEFAULT 'VIT Faculty',
            credits INTEGER DEFAULT 3,
            attended INTEGER DEFAULT 20,
            total INTEGER DEFAULT 24,
            color_key TEXT DEFAULT 'csa',
            is_lab INTEGER DEFAULT 0,
            col_span INTEGER DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS marks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reg_no TEXT NOT NULL,
            course_code TEXT NOT NULL,
            course_name TEXT NOT NULL,
            credits INTEGER DEFAULT 4,
            internal REAL DEFAULT 0,
            internal_max REAL DEFAULT 40,
            midsem_raw REAL DEFAULT 0,
            midsem_max REAL DEFAULT 50,
            endsem_raw REAL,
            endsem_max REAL DEFAULT 100
        );

        CREATE TABLE IF NOT EXISTS exam_schedule (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reg_no TEXT NOT NULL,
            course_code TEXT NOT NULL,
            subject TEXT NOT NULL,
            exam_type TEXT DEFAULT 'ENDSEM',
            exam_date TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            venue TEXT NOT NULL,
            status TEXT DEFAULT 'UPCOMING'
        );

        CREATE TABLE IF NOT EXISTS vault_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            course TEXT NOT NULL,
            type TEXT NOT NULL,
            uploader TEXT NOT NULL,
            description TEXT DEFAULT '',
            votes INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reddit_posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            author TEXT NOT NULL,
            topic TEXT DEFAULT 'General',
            text TEXT NOT NULL,
            upvotes INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS proctor_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reg_no TEXT NOT NULL,
            sender TEXT NOT NULL,
            text TEXT NOT NULL,
            is_proctor INTEGER DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reg_no TEXT NOT NULL,
            date_str TEXT NOT NULL,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            description TEXT DEFAULT ''
        );

        CREATE TABLE IF NOT EXISTS admin_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_time TEXT NOT NULL,
            message TEXT NOT NULL,
            level TEXT DEFAULT 'info'
        );
        """
    )

    if cur.execute("SELECT COUNT(*) FROM resources").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO resources (id, name, cat, loc, base_fill, cap) VALUES (:id, :name, :cat, :loc, :base_fill, :cap)",
            DEFAULT_RESOURCES,
        )

    if cur.execute("SELECT COUNT(*) FROM vault_items").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO vault_items (title, course, type, uploader, description, votes, created_at) VALUES (:title, :course, :type, :uploader, :description, :votes, :created_at)",
            DEFAULT_VAULT,
        )

    if cur.execute("SELECT COUNT(*) FROM reddit_posts").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO reddit_posts (author, topic, text, upvotes, created_at) VALUES (:author, :topic, :text, :upvotes, :created_at)",
            DEFAULT_REDDIT,
        )

    if cur.execute("SELECT COUNT(*) FROM admin_logs").fetchone()[0] == 0:
        cur.executemany(
            "INSERT INTO admin_logs (event_time, message, level) VALUES (?, ?, ?)",
            [
                ("09:14", "Conflict resolved AB1-301", "ok"),
                ("10:32", "Override denied Audi_1", "warn"),
                ("13:05", "Waitlist activated Main Library", "warn"),
                ("14:18", "Auto-release executed AB2-202", "info"),
                ("15:45", "Pending review Seminar Hall", "err"),
            ],
        )

    conn.commit()
    conn.close()


def ensure_student_seed(reg_no: str, name: str, branch: str = "B.Tech CSE (AI & ML)", semester: str = "SEM-4", role: str = "student") -> dict[str, Any]:
    reg_no = reg_no.strip().upper()
    conn = get_conn()
    cur = conn.cursor()
    row = cur.execute("SELECT * FROM users WHERE reg_no = ?", (reg_no,)).fetchone()
    now_iso = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    if row is None:
        cur.execute(
            "INSERT INTO users (reg_no, name, branch, semester, role, last_login) VALUES (?, ?, ?, ?, ?, ?)",
            (reg_no, name.strip(), branch, semester, role, now_iso),
        )
    else:
        cur.execute(
            "UPDATE users SET name = ?, branch = ?, semester = ?, role = ?, last_login = ? WHERE reg_no = ?",
            (name.strip(), branch, semester, role, now_iso, reg_no),
        )

    if cur.execute("SELECT COUNT(*) FROM timetable_slots WHERE reg_no = ?", (reg_no,)).fetchone()[0] == 0:
        for slot in DEFAULT_TIMETABLE:
            cur.execute(
                """
                INSERT INTO timetable_slots
                (reg_no, day, slot_idx, time_range, slot_code, course_code, course_name, venue, faculty, credits, attended, total, color_key, is_lab, col_span)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reg_no,
                    slot["day"],
                    slot["slot_idx"],
                    slot["time_range"],
                    slot["slot_code"],
                    slot["course_code"],
                    slot["course_name"],
                    slot["venue"],
                    slot["faculty"],
                    slot["credits"],
                    slot["attended"],
                    slot["total"],
                    slot["color_key"],
                    slot["is_lab"],
                    slot["col_span"],
                ),
            )

    if cur.execute("SELECT COUNT(*) FROM marks WHERE reg_no = ?", (reg_no,)).fetchone()[0] == 0:
        for m in DEFAULT_MARKS:
            cur.execute(
                """
                INSERT INTO marks
                (reg_no, course_code, course_name, credits, internal, internal_max, midsem_raw, midsem_max, endsem_raw, endsem_max)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reg_no,
                    m["course_code"],
                    m["course_name"],
                    m["credits"],
                    m["internal"],
                    m["internal_max"],
                    m["midsem_raw"],
                    m["midsem_max"],
                    m["endsem_raw"],
                    m["endsem_max"],
                ),
            )

    if cur.execute("SELECT COUNT(*) FROM exam_schedule WHERE reg_no = ?", (reg_no,)).fetchone()[0] == 0:
        for ex in DEFAULT_EXAMS:
            cur.execute(
                """
                INSERT INTO exam_schedule (reg_no, course_code, subject, exam_type, exam_date, time_slot, venue, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    reg_no,
                    ex["course_code"],
                    ex["subject"],
                    ex["exam_type"],
                    ex["exam_date"],
                    ex["time_slot"],
                    ex["venue"],
                    ex["status"],
                ),
            )

    if cur.execute("SELECT COUNT(*) FROM calendar_events WHERE reg_no = ?", (reg_no,)).fetchone()[0] == 0:
        for ev in DEFAULT_CAL_EVENTS:
            cur.execute(
                "INSERT INTO calendar_events (reg_no, date_str, title, category, description) VALUES (?, ?, ?, ?, ?)",
                (reg_no, ev["date_str"], ev["title"], ev["category"], ev["description"]),
            )

    conn.commit()
    user = dict(cur.execute("SELECT * FROM users WHERE reg_no = ?", (reg_no,)).fetchone())
    conn.close()
    return user


def rows_to_dicts(rows: list[sqlite3.Row]) -> list[dict[str, Any]]:
    return [dict(r) for r in rows]
