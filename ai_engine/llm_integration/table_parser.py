import re
from typing import List, Dict, Any, Optional

DEFAULT_TIME_SLOTS = ["07:30", "09:00", "11:30", "14:00", "15:30", "17:30", "19:30", "21:00"]


def infer_task_category(title: str, text: str = "") -> str:
    """Infer appropriate task category from title and supporting text."""
    t_lower = (title or "").lower()
    
    # Check title keywords first
    if any(k in t_lower for k in [
        "workout", "gym", "exercise", "strength", "cardio", "hiit", "squat", "bench",
        "yoga", "stretch", "foam roll", "sleep", "nap", "walk", "vitality", "mobility",
        "recovery", "health", "diet", "protein", "water", "nutrition", "fitness", "run", "bike",
        "cold-shower", "breathwork", "shower"
    ]):
        return "Health"
    elif any(k in t_lower for k in [
        "study", "exam", "reading", "read", "lecture", "homework", "math", "course",
        "assignment", "revision", "flashcards", "spaced repetition", "quiz", "class",
        "academic", "physics", "chemistry", "biology", "history", "algorithm", "learning"
    ]):
        return "Study"
    elif any(k in t_lower for k in [
        "budget", "finance", "money", "invest", "tax", "crypto", "stock", "portfolio",
        "expense", "savings", "invoice", "runway", "cash flow"
    ]):
        return "Money"
    elif any(k in t_lower for k in [
        "routine", "meditation", "journal", "cleanup", "wind-down", "morning routine", "evening routine",
        "curfew", "bedtime", "prep"
    ]):
        return "Routine"
    elif any(k in t_lower for k in [
        "work", "sprint", "client", "code", "architecture", "sync", "meeting", "review",
        "strategy", "deliverable", "project", "deploy", "design", "deep work", "refactor",
        "outreach", "networking", "email"
    ]):
        return "Work"

    # If title was ambiguous, check supporting text
    combined = f"{t_lower} {text}".lower()
    if any(k in combined for k in [
        "workout", "gym", "exercise", "strength", "cardio", "hiit", "squat", "bench",
        "yoga", "stretch", "foam roll", "sleep", "nap", "walk", "vitality", "mobility",
        "recovery", "health", "diet", "protein", "water", "nutrition", "fitness", "run", "bike",
        "cold-shower", "breathwork"
    ]):
        return "Health"
    elif any(k in combined for k in [
        "study", "exam", "reading", "read", "lecture", "homework", "math", "course",
        "assignment", "revision", "flashcards", "spaced repetition", "quiz", "class",
        "academic", "physics", "chemistry", "biology", "history", "algorithm", "learning"
    ]):
        return "Study"
    elif any(k in combined for k in [
        "budget", "finance", "money", "invest", "tax", "crypto", "stock", "portfolio",
        "expense", "savings", "invoice", "runway", "cash flow"
    ]):
        return "Money"
    elif any(k in combined for k in [
        "routine", "meditation", "journal", "cleanup", "wind-down", "morning routine", "evening routine"
    ]):
        return "Routine"

    return "Work"


def _clean_markdown_text(val: str) -> str:
    """Clean bold, italic, inline code and extra whitespace from markdown table cells."""
    if not val:
        return ""
    cleaned = re.sub(r"[*_`~]", "", val)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _extract_duration_minutes(val: str, default: int = 45) -> int:
    """Extract duration in minutes from strings like '45 mins', '1.5h', '30 min', '60'."""
    if not val:
        return default
    v_clean = _clean_markdown_text(val).lower()
    
    # Hours e.g. 1.5h, 2 hours
    hr_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h\b)", v_clean)
    if hr_match:
        return int(float(hr_match.group(1)) * 60)
    
    # Minutes e.g. 45 min, 30 mins
    min_match = re.search(r"(\d+)\s*(?:minutes?|mins?|m\b)", v_clean)
    if min_match:
        return int(min_match.group(1))
    
    # Raw digits
    num_match = re.search(r"(\d+)", v_clean)
    if num_match:
        return int(num_match.group(1))
    
    return default


def _parse_time_to_minutes(time_str: str) -> Optional[int]:
    """Convert time string e.g. '06:30', '7:00 PM', '14:00', '9am' to minutes from midnight."""
    if not time_str:
        return None
    clean = _clean_markdown_text(time_str).upper().replace(" ", "")
    is_pm = "PM" in clean
    is_am = "AM" in clean
    clean = clean.replace("AM", "").replace("PM", "")
    
    parts = clean.split(":")
    try:
        if len(parts) == 2:
            hh, mm = int(parts[0]), int(parts[1])
        elif len(parts) == 1 and parts[0].isdigit():
            hh, mm = int(parts[0]), 0
        else:
            return None
        
        if is_pm and hh < 12:
            hh += 12
        elif is_am and hh == 12:
            hh = 0
            
        return hh * 60 + mm
    except Exception:
        return None


def _calculate_duration_from_range(start_str: str, end_str: str, default: int = 45) -> int:
    """Calculate duration in minutes between two timestamp strings."""
    m1 = _parse_time_to_minutes(start_str)
    m2 = _parse_time_to_minutes(end_str)
    if m1 is not None and m2 is not None:
        if m2 > m1:
            diff = m2 - m1
            if 5 <= diff <= 600:
                return diff
        elif m2 < m1:
            # Spans midnight
            diff = (1440 - m1) + m2
            if 5 <= diff <= 600:
                return diff
    return default


def _extract_time_slot(val: str, fallback_idx: int) -> str:
    """Extract standard HH:MM time slot from cell string or fallback to default schedule."""
    if val:
        v_clean = _clean_markdown_text(val)
        time_m = re.search(r"(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))", v_clean, flags=re.IGNORECASE)
        if time_m:
            raw_t = time_m.group(1).upper().replace(" ", "")
            # Convert e.g. 9AM or 9:00AM to 24h or clean HH:MM
            if "AM" in raw_t or "PM" in raw_t:
                try:
                    is_pm = "PM" in raw_t
                    pure_t = raw_t.replace("AM", "").replace("PM", "")
                    if ":" in pure_t:
                        hh, mm = pure_t.split(":")
                    else:
                        hh, mm = pure_t, "00"
                    hh_num = int(hh)
                    if is_pm and hh_num < 12:
                        hh_num += 12
                    elif not is_pm and hh_num == 12:
                        hh_num = 0
                    return f"{hh_num:02d}:{mm}"
                except Exception:
                    pass
            elif ":" in raw_t:
                parts = raw_t.split(":")
                try:
                    return f"{int(parts[0]):02d}:{int(parts[1]):02d}"
                except Exception:
                    pass

    return DEFAULT_TIME_SLOTS[fallback_idx % len(DEFAULT_TIME_SLOTS)]


def parse_schedule_tasks_from_text(text: str, default_category: str = "Work") -> List[Dict[str, Any]]:
    """
    Parses Markdown tables, timestamp lines, or bulleted lists in assistant responses
    into structured task dictionaries for the Daily Planner.
    """
    if not text:
        return []

    # Strategy 1: Markdown table rows
    tasks = parse_markdown_table_rows(text, default_category)
    if tasks:
        return tasks

    # Strategy 2: Timestamp-prefixed lines (e.g. 06:30 – 07:00 – Cold-shower + 5-min breathwork)
    tasks = parse_timestamp_lines(text, default_category)
    if tasks:
        return tasks

    # Strategy 3: Duration-labeled task items (e.g. Micro-Workout Blitz (15 min) – 3 rounds...)
    tasks = parse_duration_labeled_items(text, default_category)
    if tasks:
        return tasks

    # Strategy 4: Standard bullet or numbered list
    return parse_bullet_tasks(text, default_category)


def parse_markdown_table_rows(text: str, default_category: str = "Work") -> List[Dict[str, Any]]:
    """
    Extracts structured tasks from any Markdown table found in the text.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    table_lines = [line for line in lines if line.startswith("|") and line.endswith("|")]
    
    if len(table_lines) < 3:
        return []

    # First table line is header
    header_raw = table_lines[0].strip("|").split("|")
    headers = [_clean_markdown_text(h).lower() for h in header_raw]
    
    # Identify column indices
    time_idx = -1
    title_idx = -1
    duration_idx = -1
    category_idx = -1
    impact_idx = -1
    detail_idx = -1

    for idx, h in enumerate(headers):
        if any(k in h for k in ["time", "start", "slot", "hour", "when"]):
            time_idx = idx
        elif any(k in h for k in ["task", "focus", "block", "activity", "session", "title", "name", "exercise"]):
            if title_idx == -1:
                title_idx = idx
            elif duration_idx == -1 and any(k in h for k in ["min", "duration", "length", "session"]):
                duration_idx = idx
            elif detail_idx == -1:
                detail_idx = idx
        elif any(k in h for k in ["duration", "minutes", "min", "session (min)", "length"]):
            duration_idx = idx
        elif any(k in h for k in ["category", "type", "domain"]):
            category_idx = idx
        elif any(k in h for k in ["impact", "predicted impact", "outcome", "benefit", "recovery", "core move", "notes"]):
            if impact_idx == -1:
                impact_idx = idx
            elif detail_idx == -1:
                detail_idx = idx

    # If title wasn't uniquely identified, use second column (or first if 1 col)
    if title_idx == -1:
        title_idx = 1 if len(headers) > 1 else 0

    extracted_tasks = []
    task_idx = 0

    for line in table_lines[1:]:
        # Skip separator row e.g. |---|---|
        if re.match(r"^\|(?:\s*:?-+:?\s*\|)+$", line):
            continue

        cells = [_clean_markdown_text(c) for c in line.strip("|").split("|")]
        if len(cells) <= title_idx:
            continue

        raw_title = cells[title_idx] if title_idx >= 0 and title_idx < len(cells) else ""
        if not raw_title or len(raw_title) < 2 or raw_title.lower() in ["task", "focus", "title"]:
            continue

        raw_time = cells[time_idx] if time_idx >= 0 and time_idx < len(cells) else ""
        start_time = _extract_time_slot(raw_time, task_idx)

        raw_duration = cells[duration_idx] if duration_idx >= 0 and duration_idx < len(cells) else ""
        duration_mins = _extract_duration_minutes(raw_duration, 45)

        raw_cat = cells[category_idx] if category_idx >= 0 and category_idx < len(cells) else ""
        raw_detail = cells[detail_idx] if detail_idx >= 0 and detail_idx < len(cells) else ""
        raw_impact = cells[impact_idx] if impact_idx >= 0 and impact_idx < len(cells) else ""

        category = raw_cat.title() if raw_cat and raw_cat.lower() in ["work", "study", "health", "money", "routine", "personal"] else infer_task_category(raw_title, f"{raw_detail} {raw_impact} {text[:200]}")

        # Build clean impact description
        if raw_impact and len(raw_impact) >= 3:
            impact_desc = raw_impact if raw_impact.startswith("+") else f"+1.0 {raw_impact}"
        elif raw_detail and len(raw_detail) >= 3:
            impact_desc = f"+1.2 Vitality ({raw_detail})" if category == "Health" else f"+1.0 Focus ({raw_detail})"
        else:
            impact_desc = "+1.4 Vitality & Recovery" if category == "Health" else ("+1.2 Cognitive Focus" if category in ["Work", "Study"] else "+1.0 Efficiency")

        # Full title enhancement if core move is available
        full_title = raw_title
        if raw_detail and raw_detail.lower() not in raw_title.lower() and len(raw_detail) < 40:
            full_title = f"{raw_title}: {raw_detail}"

        extracted_tasks.append({
            "title": full_title[:55],
            "start": start_time,
            "minutes": duration_mins,
            "category": category,
            "impact": impact_desc[:60]
        })
        task_idx += 1

    return extracted_tasks


def parse_timestamp_lines(text: str, default_category: str = "Work") -> List[Dict[str, Any]]:
    """
    Extracts structured tasks from lines with timestamp ranges (e.g. 06:30 – 07:00 – Cold-shower + 5-min breathwork)
    or single timestamps (e.g. 09:00 - Deep Work Sprint).
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    extracted_tasks = []
    task_idx = 0

    range_pattern = re.compile(
        r"^(?:[-*•\d\.\)]\s*)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:–|-|—|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:–|-|—|:)?\s*(.+)$",
        re.IGNORECASE
    )
    single_pattern = re.compile(
        r"^(?:[-*•\d\.\)]\s*)?(\d{1,2}:\d{2}\s*(?:am|pm)?)\s*(?:–|-|—|:)\s*(.+)$",
        re.IGNORECASE
    )

    for line in lines:
        clean_line = _clean_markdown_text(line)
        
        # Check range pattern first
        m_range = range_pattern.match(clean_line)
        if m_range:
            t1, t2, rest = m_range.group(1), m_range.group(2), m_range.group(3).strip()
            start_time = _extract_time_slot(t1, task_idx)
            duration_mins = _calculate_duration_from_range(t1, t2)
            
            # Extract category tag if explicitly present e.g. (Category: Health)
            cat_match = re.search(r"\(Category:\s*([a-zA-Z]+)\)", rest, flags=re.IGNORECASE)
            if cat_match:
                category = cat_match.group(1).title()
                rest = re.sub(r"\(Category:\s*[a-zA-Z]+\)", "", rest, flags=re.IGNORECASE).strip()
            else:
                category = infer_task_category(rest, text[:200])

            # Extract title & impact
            title_clean = re.sub(r"^[-–—:\s]+", "", rest).strip()
            if not title_clean or len(title_clean) < 3:
                continue

            impact_desc = "+1.4 Vitality & Health" if category == "Health" else ("+1.2 Cognitive Focus" if category in ["Work", "Study"] else "+1.0 Routine Flow")

            extracted_tasks.append({
                "title": title_clean[:55],
                "start": start_time,
                "minutes": duration_mins,
                "category": category,
                "impact": impact_desc
            })
            task_idx += 1
            continue

        # Check single timestamp pattern
        m_single = single_pattern.match(clean_line)
        if m_single:
            t1, rest = m_single.group(1), m_single.group(2).strip()
            start_time = _extract_time_slot(t1, task_idx)
            duration_mins = _extract_duration_minutes(rest, 45)

            cat_match = re.search(r"\(Category:\s*([a-zA-Z]+)\)", rest, flags=re.IGNORECASE)
            if cat_match:
                category = cat_match.group(1).title()
                rest = re.sub(r"\(Category:\s*[a-zA-Z]+\)", "", rest, flags=re.IGNORECASE).strip()
            else:
                category = infer_task_category(rest, text[:200])

            title_clean = re.sub(r"^[-–—:\s]+", "", rest).strip()
            if not title_clean or len(title_clean) < 3:
                continue

            impact_desc = "+1.4 Vitality & Health" if category == "Health" else ("+1.2 Cognitive Focus" if category in ["Work", "Study"] else "+1.0 Routine Flow")

            extracted_tasks.append({
                "title": title_clean[:55],
                "start": start_time,
                "minutes": duration_mins,
                "category": category,
                "impact": impact_desc
            })
            task_idx += 1

    return extracted_tasks


def parse_duration_labeled_items(text: str, default_category: str = "Work") -> List[Dict[str, Any]]:
    """
    Extracts structured tasks from duration-annotated named items (e.g. Micro-Workout Blitz (15 min) – 3 rounds...).
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    extracted_tasks = []
    task_idx = 0

    item_pattern = re.compile(
        r"^(?:[-*•\d\.\)]\s*)?([^\n\(]+?)\s*\(\s*(\d+(?:\.\d+)?)\s*(?:min|mins|minutes|m|hours?|hrs?|h)\s*\)\s*(?:–|-|—|:)?\s*(.*)$",
        re.IGNORECASE
    )

    for line in lines:
        clean_line = _clean_markdown_text(line)
        m = item_pattern.match(clean_line)
        if not m:
            continue

        raw_title = m.group(1).strip()
        dur_val = m.group(2).strip()
        rest = m.group(3).strip()

        if len(raw_title) < 3 or raw_title.lower() in ["pick", "here", "let", "reply"]:
            continue

        duration_mins = _extract_duration_minutes(dur_val, 45)
        start_time = DEFAULT_TIME_SLOTS[task_idx % len(DEFAULT_TIME_SLOTS)]

        cat_match = re.search(r"\(Category:\s*([a-zA-Z]+)\)", rest, flags=re.IGNORECASE)
        if cat_match:
            category = cat_match.group(1).title()
            rest = re.sub(r"\(Category:\s*[a-zA-Z]+\)", "", rest, flags=re.IGNORECASE).strip()
        else:
            category = infer_task_category(raw_title, f"{rest} {text[:200]}")

        full_title = raw_title
        if rest and len(rest) < 35 and rest.lower() not in raw_title.lower():
            full_title = f"{raw_title}: {rest}"

        impact_desc = "+1.4 Vitality & Health" if category == "Health" else ("+1.2 Cognitive Focus" if category in ["Work", "Study"] else "+1.0 Focus")

        extracted_tasks.append({
            "title": full_title[:55],
            "start": start_time,
            "minutes": duration_mins,
            "category": category,
            "impact": impact_desc
        })
        task_idx += 1

    return extracted_tasks


def parse_bullet_tasks(text: str, default_category: str = "Work") -> List[Dict[str, Any]]:
    """
    Extracts structured tasks from numbered or bulleted list items.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    extracted_tasks = []
    task_idx = 0

    for line in lines:
        # Match lines like: - 09:00: Deep Work Sprint (90m) or 1. [Health] Morning Cardio at 07:30 (45 mins)
        if not (line.startswith("-") or line.startswith("*") or line.startswith("•") or re.match(r"^\d+[\.\)]", line)):
            continue

        clean_line = _clean_markdown_text(line)
        time_m = re.search(r"(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm))", clean_line, flags=re.IGNORECASE)
        start_time = _extract_time_slot(time_m.group(1) if time_m else "", task_idx)

        duration_mins = _extract_duration_minutes(clean_line, 45)

        # Extract title
        title_text = re.sub(r"^[-*•\d\.\)\s]+", "", clean_line)
        title_text = re.sub(r"^(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)?(?::|-|—)?\s*", "", title_text, flags=re.IGNORECASE)
        title_text = re.sub(r"\(\s*\d+\s*(?:mins?|minutes?|m|hrs?|hours?)\s*\)", "", title_text, flags=re.IGNORECASE).strip()

        if not title_text or len(title_text) < 3:
            continue

        category = infer_task_category(title_text, text[:200])
        impact_desc = "+1.4 Vitality & Health" if category == "Health" else ("+1.2 Cognitive Focus" if category in ["Work", "Study"] else "+1.0 Routine Flow")

        extracted_tasks.append({
            "title": title_text[:55],
            "start": start_time,
            "minutes": duration_mins,
            "category": category,
            "impact": impact_desc
        })
        task_idx += 1

    return extracted_tasks
