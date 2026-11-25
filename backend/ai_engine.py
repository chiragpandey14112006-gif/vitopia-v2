import math
import os
from datetime import datetime
from typing import Any, Optional

import requests


def compute_bunk_budget(attended: int, total: int, target_pct: float = 75.0) -> dict[str, Any]:
    if total <= 0:
        return {"pct": 100.0, "status": "SAFE", "can_skip": 0, "must_attend": 0}
    pct = round((attended / total) * 100, 1)
    target = target_pct / 100.0
    if pct >= target_pct:
        can_skip = max(0, math.floor(attended / target - total))
        status = "SAFE" if pct >= 80 else "BORDERLINE"
        return {"pct": pct, "status": status, "can_skip": can_skip, "must_attend": 0}
    must_attend = max(1, math.ceil((target * total - attended) / (1.0 - target)))
    return {"pct": pct, "status": "DETAIN_RISK", "can_skip": 0, "must_attend": must_attend}


def predict_crowding(hour: int, weekday: int, active_bookings: int, has_upcoming_exam: bool) -> dict[str, Any]:
    hour_factor = {
        7: 0.2, 8: 0.35, 9: 0.55, 10: 0.82, 11: 0.88, 12: 0.45,
        13: 0.55, 14: 0.84, 15: 0.90, 16: 0.94, 17: 0.72, 18: 0.50,
        19: 0.36, 20: 0.25, 21: 0.18,
    }
    day_factor = {0: 0.9, 1: 0.92, 2: 0.95, 3: 0.88, 4: 0.82, 5: 0.45, 6: 0.3}
    hf = hour_factor.get(hour, 0.28)
    df = day_factor.get(weekday, 0.7)
    exam_boost = 0.20 if has_upcoming_exam else 0.0
    booking_boost = min(0.15, active_bookings * 0.03)
    level = min(1.0, round(hf * df + exam_boost + booking_boost, 2))

    if level > 0.85:
        demand, color = "CRITICAL", "var(--nr)"
    elif level > 0.65:
        demand, color = "HIGH", "var(--nk)"
    elif level > 0.40:
        demand, color = "MODERATE", "var(--no)"
    else:
        demand, color = "LOW", "var(--ng)"

    next_hf = hour_factor.get((hour + 2) % 24, 0.25)
    next_level = min(1.0, next_hf * df + exam_boost)
    if next_level > level + 0.05:
        trend = "↑ RISING"
    elif next_level < level - 0.05:
        trend = "↓ EASING"
    else:
        trend = "→ STABLE"

    return {"level": level, "pct": int(level * 100), "demand": demand, "color": color, "trend": trend}


def _call_anthropic_if_configured(system_prompt: str, user_prompt: str, max_tokens: int = 220) -> Optional[str]:
    api_key = os.environ.get("ANTHROPIC_API_KEY", "").strip()
    if not api_key:
        return None
    try:
        res = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": max_tokens,
                "system": system_prompt,
                "messages": [{"role": "user", "content": user_prompt}],
            },
            timeout=10,
        )
        if res.ok:
            data = res.json()
            text = "".join(b.get("text", "") for b in data.get("content", []))
            return text.strip() or None
    except Exception:
        return None
    return None


def generate_neural_insight(
    user: dict[str, Any],
    resources: list[dict[str, Any]],
    timetable: list[dict[str, Any]],
    exams: list[dict[str, Any]],
    bookings_count: int,
) -> dict[str, Any]:
    now = datetime.now()
    hour = now.hour
    weekday = now.weekday()  # 0=Mon..6=Sun

    upcoming_exams = [e for e in exams if e.get("status") != "COMPLETED"]
    crowd = predict_crowding(hour, weekday, bookings_count, bool(upcoming_exams))

    labs_sorted = sorted(
        [r for r in resources if r["cat"] in ("lab", "lib")],
        key=lambda r: r.get("live_fill", r.get("base_fill", 50)),
    )
    opt_lab = labs_sorted[0]["name"] if labs_sorted else "CS Lab AB1-301"
    opt_fill = labs_sorted[0].get("live_fill", labs_sorted[0].get("base_fill", 30)) if labs_sorted else 30

    # Find lowest attendance course
    unique_courses: dict[str, dict[str, Any]] = {}
    for s in timetable:
        code = s["course_code"]
        if code not in unique_courses and s.get("total", 0) > 0:
            unique_courses[code] = {
                "code": code,
                "name": s["course_name"],
                **compute_bunk_budget(s["attended"], s["total"]),
            }
    low_courses = sorted(unique_courses.values(), key=lambda c: c["pct"])
    risky = low_courses[0] if low_courses else None

    next_exam = upcoming_exams[0] if upcoming_exams else None

    sys_prompt = (
        "You are VITOPIA's cyberpunk neural campus assistant for VIT Bhopal University. "
        "Respond in 1-2 crisp, practical sentences using [BRACKETS] for locations/courses."
    )
    user_prompt = (
        f"Student {user['name']} ({user['reg_no']}), CGPA {user['cgpa']}. "
        f"Demand {crowd['demand']} ({crowd['pct']}%), trend {crowd['trend']}. "
        f"Quietest space: [{opt_lab}] at {opt_fill}% load. "
        f"Lowest attendance: {risky['code'] if risky else 'N/A'} at {risky['pct'] if risky else 100}%. "
        f"Next exam: {next_exam['course_code'] if next_exam else 'None'} on {next_exam['exam_date'] if next_exam else 'N/A'}."
    )

    ai_text = _call_anthropic_if_configured(sys_prompt, user_prompt, max_tokens=130)
    if not ai_text:
        parts = []
        if risky and risky["pct"] < 78:
            parts.append(
                f"ATTENDANCE ALERT: [{risky['code']}] is at {risky['pct']}% — attend the next {max(1, risky['must_attend'])} session(s) to stay safely above 75%."
            )
        if next_exam:
            parts.append(
                f"Next exam [{next_exam['course_code']}] ({next_exam['subject']}) in [{next_exam['venue']}]; quietest prep zone right now is [{opt_lab}] ({opt_fill}% load)."
            )
        else:
            parts.append(
                f"Campus load is {crowd['demand']} ({crowd['pct']}%) and {crowd['trend']}. Optimal study node: [{opt_lab}] at {opt_fill}% occupancy."
            )
        ai_text = " ".join(parts[:2])

    return {
        "text": ai_text,
        "demand": crowd["demand"],
        "demand_color": crowd["color"],
        "demand_pct": crowd["pct"],
        "optimal_lab": opt_lab,
        "optimal_fill": opt_fill,
        "trend": crowd["trend"],
        "lowest_course": risky,
    }


def generate_proctor_reply(
    user: dict[str, Any],
    timetable: list[dict[str, Any]],
    marks: list[dict[str, Any]],
    exams: list[dict[str, Any]],
    student_msg: str,
    topic: Optional[str] = None,
) -> str:
    unique_courses: dict[str, dict[str, Any]] = {}
    for s in timetable:
        if s["course_code"] not in unique_courses and s.get("total", 0) > 0:
            unique_courses[s["course_code"]] = {
                "code": s["course_code"],
                "name": s["course_name"],
                **compute_bunk_budget(s["attended"], s["total"]),
            }
    lowest = min(unique_courses.values(), key=lambda c: c["pct"]) if unique_courses else None
    avg_att = round(sum(c["pct"] for c in unique_courses.values()) / len(unique_courses), 1) if unique_courses else 87.0
    upcoming = [e for e in exams if e.get("status") != "COMPLETED"]
    next_ex = upcoming[0] if upcoming else None
    weakest_mark = min(marks, key=lambda m: (m["internal"] / m["internal_max"])) if marks else None

    sys_prompt = (
        f"You are Dr. Lokesh Malviya, faculty proctor (AB1-312, Ext 4127) at VIT Bhopal University. "
        f"Student: {user['name']} ({user['reg_no']}), {user['branch']}, {user['semester']}, CGPA {user['cgpa']}, avg attendance {avg_att}%. "
        f"Lowest attendance course: {lowest['code'] if lowest else 'None'} ({lowest['pct'] if lowest else 100}%). "
        f"Next exam: {next_ex['course_code'] if next_ex else 'None'}. Reply warmly and concisely in 2-3 sentences."
    )
    ai_reply = _call_anthropic_if_configured(sys_prompt, student_msg, max_tokens=180)
    if ai_reply:
        return ai_reply

    low_msg = student_msg.lower()
    t = topic or (
        "attendance" if any(k in low_msg for k in ["attend", "75", "bunk", "detain", "phy"]) else
        "leave" if any(k in low_msg for k in ["leave", "absent", "sick", "family", "medical"]) else
        "placement" if any(k in low_msg for k in ["place", "tcs", "intern", "job", "resume"]) else
        "exam" if any(k in low_msg for k in ["exam", "fat", "hall", "schedule", "paper"]) else
        "cgpa" if any(k in low_msg for k in ["cgpa", "gpa", "mark", "grade", "score"]) else
        "grievance" if any(k in low_msg for k in ["griev", "issue", "complaint", "hostel", "wifi"]) else
        "general"
    )

    first_name = user["name"].split()[0]
    if t == "attendance" and lowest:
        if lowest["must_attend"] > 0:
            return (
                f"{first_name}, your overall attendance is {avg_att}%, which is solid, but {lowest['code']} ({lowest['name']}) is at {lowest['pct']}%. "
                f"You need to attend the next {lowest['must_attend']} consecutive session(s) without fail to cross 75% before FAT detention freeze. Drop by AB1-312 (10 AM–12 PM) if you had any medical absence."
            )
        return (
            f"Good news {first_name} — your average attendance is {avg_att}% and your lowest course {lowest['code']} is at {lowest['pct']}% (safe buffer of {lowest['can_skip']} class(es)). Keep attending labs regularly so you stay well clear of the 75% threshold."
        )
    if t == "leave":
        return (
            f"Please submit your leave request on VTOP under Student Services at least 48 hours ahead, {first_name}, and attach supporting documents. Since your overall attendance is {avg_att}%, I can review and forward it as long as no course drops below 75%."
        )
    if t == "placement":
        return (
            f"With your CGPA of {user['cgpa']} in {user['branch']}, you clear most tier-1 placement cutoffs, {first_name}. Focus on DSA, DBMS/OS fundamentals, and pick up the mock aptitude sheets in the Data Vault before the TCS Ninja pre-placement briefing."
        )
    if t == "exam" and next_ex:
        return (
            f"Your next scheduled exam is {next_ex['course_code']} ({next_ex['subject']}) on {next_ex['exam_date']} at {next_ex['time_slot']} in {next_ex['venue']}. Download your hall ticket from VTOP, bring your student ID, and use the GPA Simulator in EXAM_TERM to plan your target Endsem score."
        )
    if t == "cgpa":
        weak_str = f" Especially prioritize {weakest_mark['course_code']} ({weakest_mark['course_name']})" if weakest_mark else ""
        return (
            f"Your current CGPA is {user['cgpa']}/10.0, {first_name}. Since FAT accounts for 50% weightage, strong Endsem scores can easily push you above 8.9.{weak_str}. Let me know if you want a 1-on-1 study plan in AB1-312."
        )
    if t == "grievance":
        return (
            f"I take your concern seriously, {first_name}. Please share the exact details (building, course, or date) here or meet me confidentially at AB1-312 (Ext: 4127) during office hours so I can escalate it immediately."
        )
    return (
        f"Thanks for messaging, {first_name} ({user['reg_no']}). I've logged your note on your proctor channel — your profile currently shows {avg_att}% avg attendance and {user['cgpa']} CGPA. Reply with specifics or visit AB1-312 anytime between 10 AM and 12 PM."
    )
