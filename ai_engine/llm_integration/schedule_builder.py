from typing import List, Dict, Any, Optional


def build_smart_role_schedule(
    role: str,
    user_info: Optional[Dict[str, Any]] = None,
    telemetry: Optional[Dict[str, Any]] = None,
    active_logged_sleep: Optional[float] = None,
    active_study_subject: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Builds a circadian-calibrated daily routine tailored to the user's role persona,
    adapting dynamically to recent sleep deficits and focus subjects.
    """
    r = (role or "professional").lower()
    t = telemetry or {}
    u = user_info or {}

    logged_sleep = active_logged_sleep if active_logged_sleep is not None else float(t.get("avg_sleep", 7.5))
    has_sleep_deficit = logged_sleep < 6.2

    subject_name = active_study_subject or (t.get("recent_subjects") and t["recent_subjects"][0]) or "Core Academic Focus"
    focus_area = active_study_subject or u.get("focus_area") or (t.get("recent_subjects") and t["recent_subjects"][0]) or "Deep Work"

    if r == "student":
        if has_sleep_deficit:
            return [
                {"title": f"Morning Focus Sprint: {subject_name}", "start": "09:00", "minutes": 75, "category": "Study", "impact": "+1.2 Alertness Sprint"},
                {"title": "Deep Problem Solving & Assignment", "start": "11:00", "minutes": 60, "category": "Study", "impact": "+1.0 Retention"},
                {"title": "Circadian Recharge & 20-Min Power Nap", "start": "14:00", "minutes": 30, "category": "Health", "impact": "+1.5 Vitality & Fatigue Protection"},
                {"title": f"Light Review & Spaced Repetition ({subject_name})", "start": "16:30", "minutes": 45, "category": "Study", "impact": "+0.8 Retention"},
                {"title": "Early Wind-Down & Sleep Debt Reset", "start": "21:30", "minutes": 30, "category": "Health", "impact": "+1.8 Sleep Recovery"},
            ]
        else:
            return [
                {"title": f"Core Academic Focus: {subject_name}", "start": "09:00", "minutes": 90, "category": "Study", "impact": "+1.5 Cognitive Output"},
                {"title": "Deep Problem Solving & Assignment Sprint", "start": "11:30", "minutes": 75, "category": "Study", "impact": "+1.2 Retention"},
                {"title": "Cardio & Physical Recovery", "start": "17:00", "minutes": 45, "category": "Health", "impact": "+0.9 Vitality"},
                {"title": f"Spaced Repetition & Daily Synthesis ({subject_name})", "start": "20:30", "minutes": 30, "category": "Study", "impact": "+0.7 Long-Term Retention"},
            ]
    elif r == "entrepreneur":
        if has_sleep_deficit:
            return [
                {"title": "High-Priority Architecture & Core Strategy", "start": "08:30", "minutes": 90, "category": "Work", "impact": "+1.5 Focus & Leverage"},
                {"title": "Client & Team Execution Sync", "start": "11:00", "minutes": 45, "category": "Work", "impact": "+1.0 Velocity"},
                {"title": "Mid-Day Restorative Recharge Block", "start": "14:00", "minutes": 30, "category": "Health", "impact": "+1.4 Fatigue Protection"},
                {"title": "Product Growth & Capital Runway Review", "start": "15:30", "minutes": 60, "category": "Work", "impact": "+1.1 Capital Control"},
                {"title": "Decompression & Sleep Debt Recovery", "start": "21:30", "minutes": 30, "category": "Health", "impact": "+1.6 Sleep Recovery"},
            ]
        else:
            return [
                {"title": "Deep Work: Architecture & Core Strategy", "start": "08:30", "minutes": 120, "category": "Work", "impact": "+1.8 Focus & Leverage"},
                {"title": "High-Impact Client & Team Execution Sync", "start": "11:00", "minutes": 60, "category": "Work", "impact": "+1.0 Velocity"},
                {"title": "Product Growth & Capital Runway Review", "start": "14:30", "minutes": 90, "category": "Work", "impact": "+1.3 Capital Control"},
                {"title": "Physical Vitality & Decompression", "start": "17:30", "minutes": 45, "category": "Health", "impact": "+0.9 Vitality Stability"},
            ]
    elif r == "freelancer":
        if has_sleep_deficit:
            return [
                {"title": "Client Deliverable Deep Sprint", "start": "09:00", "minutes": 75, "category": "Work", "impact": "+1.3 Billable Output"},
                {"title": "Pipeline Comms & Client Inbound", "start": "11:00", "minutes": 30, "category": "Work", "impact": "+0.9 Cash Flow"},
                {"title": "Circadian Power Nap & Walking Recharge", "start": "14:00", "minutes": 30, "category": "Health", "impact": "+1.4 Vitality Reset"},
                {"title": f"Skill Mastery: {focus_area}", "start": "15:30", "minutes": 45, "category": "Study", "impact": "+0.9 Skill Growth"},
                {"title": "Early Sleep Recovery & Invoice Sync", "start": "21:30", "minutes": 30, "category": "Money", "impact": "+1.5 Rest & Stability"},
            ]
        else:
            return [
                {"title": "Client Deliverable Deep Sprint", "start": "09:00", "minutes": 90, "category": "Work", "impact": "+1.5 Billable Output"},
                {"title": "Pipeline Comms & Client Inbound", "start": "11:30", "minutes": 45, "category": "Work", "impact": "+0.9 Cash Flow"},
                {"title": f"Skill Mastery: {focus_area}", "start": "15:00", "minutes": 60, "category": "Study", "impact": "+1.1 Rate Leverage"},
                {"title": "Daily Invoice & Runway Reconciliation", "start": "17:30", "minutes": 25, "category": "Money", "impact": "+0.7 Financial Buffer"},
            ]
    else:
        if has_sleep_deficit:
            return [
                {"title": "High-Priority Deep Work Sprint", "start": "09:00", "minutes": 75, "category": "Work", "impact": "+1.3 Focus & Output"},
                {"title": "Cross-Functional Project Execution", "start": "11:00", "minutes": 45, "category": "Work", "impact": "+0.9 Velocity"},
                {"title": "20-Min Restorative Energy Recharge", "start": "14:00", "minutes": 30, "category": "Health", "impact": "+1.4 Fatigue Protection"},
                {"title": f"Technical Skill Upgrading: {focus_area}", "start": "15:30", "minutes": 45, "category": "Study", "impact": "+0.8 Career Growth"},
                {"title": "Early Wind-Down & Sleep Debt Reset", "start": "21:30", "minutes": 30, "category": "Health", "impact": "+1.6 Rest & Vitality"},
            ]
        else:
            return [
                {"title": "High-Priority Deep Work Sprint", "start": "09:00", "minutes": 90, "category": "Work", "impact": "+1.4 Focus & Output"},
                {"title": "Cross-Functional Project Execution", "start": "11:30", "minutes": 60, "category": "Work", "impact": "+1.0 Velocity"},
                {"title": f"Technical Skill Upgrading: {focus_area}", "start": "15:30", "minutes": 45, "category": "Study", "impact": "+0.8 Career Growth"},
                {"title": "Physical Vitality & Decompression", "start": "18:00", "minutes": 45, "category": "Health", "impact": "+1.0 Vitality"},
            ]
