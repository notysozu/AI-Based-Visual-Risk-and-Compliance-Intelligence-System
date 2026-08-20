# Workflow Step 5: Habit Analytics & Daily Noon Cache Synchronization

This document explains the habit analytics pipeline, multi-variable correlation charts, and the automated 12:00 PM local noon AI summary cache.

---

## 1. Habit Logging & History Tracking (`/analytics`)

The application logs 5 primary daily parameters:
- **Sleep Duration** (hours/night)
- **Screen Time** (hours/day)
- **Learning / Study / Reading** (hours/day)
- **Active Movement / Exercise** (minutes/day)
- **Subjective Wellbeing / Mood Rating** (1 to 10)

These logs can be recorded via the quick logging drawer on the dashboard or the analytics page, and exported as a standard CSV (`twin-history.csv`).

---

## 2. Universal Habit Visualizations

To make habit data instantly understandable for all user ages and personas without complex scatter plots, the analytics view uses grouped bar charts:

### Chart 1: Sleep vs Focus Rating
- Groups logged days into discrete sleep buckets ($<6.0$h, $6.0–7.0$h, $7.0–8.5$h, $>8.5$h).
- Renders side-by-side bars demonstrating how increasing nightly sleep consistently elevates cognitive focus scores.

### Chart 2: Screen Time vs Mood & Wellbeing
- Groups logged days into screen exposure tiers ($<2$h, $2–4$h, $4–6$h, $>6$h).
- Shows how excessive non-essential screen time correlates with lower reported mood and higher mental fatigue.

---

## 3. Automated 12:00 PM Local Noon Cache Architecture

The AI Digital Twin Habit Summary provides high-level coaching on user routine balance. To prevent unnecessary API calls while ensuring users receive a fresh daily insight:

```
[Page Load / Analytics Mount]
             |
             v
[Check Local Noon Timestamp]
  - Has local time crossed 12:00 PM today?
  - Has summary been updated since most recent 12:00 PM?
             |
      +------+------+
      |             |
   [Yes]          [No]
      |             |
      v             v
[Use Database   [Call Backend: GET /simulations/analytics-summary/{user_id}]
 Cached Text]       |
                    v
                [Generate Fresh Role-Tailored Summary via Groq LLaMA 3.1]
                    |
                    v
                [Persist to SQLite: last_analytics_summary & last_analytics_updated]
```

### Cache Invalidation Logic:
- If current time is **after 12:00 PM** today: Cache must have been created after today's 12:00 PM.
- If current time is **before 12:00 PM** today: Cache must have been created after yesterday's 12:00 PM.
- If invalid or missing, a background request generates a fresh summary and updates the database timestamp.


## 6. Pearson Correlation Calculation
- Evaluates statistical correlation between nightly sleep hours and daily focus ratings.
- Highlights actionable adjustments in the AI explanatory briefing.
