# Workflow Step 6: Task Planner & Suggestion Adoption Engine

This document details the role-adapted daily task planner (`/planner`), persona suggestion libraries (`/suggestions`), and one-click task scheduling.

---

## 1. Role-Tailored Task Categories

The task planner dynamically filters and organizes categories based on the user's active persona:

- **Student**: `["Study", "Exams", "Campus", "Money", "Health", "Social"]`
- **Working Professional**: `["Work", "Career", "Finance", "Health", "Upskilling", "Personal"]`
- **Freelancer / Creator**: `["Client Work", "Projects", "Invoices", "Admin", "Health", "Upskilling"]`
- **Founder / Entrepreneur**: `["Product", "Growth", "Fundraising", "Operations", "Team", "Health"]`
- **Retiree / Senior**: `["Health", "Hobbies", "Finance", "Family", "Home", "Leisure"]`

---

## 2. Suggestion Recommendation Engine (`/suggestions`)

The suggestions view provides pre-calibrated lifestyle habits tailored to the user's persona and baseline history.

### Persona Suggestion Examples:

#### 1. Student
- *Morning library & study block*: 60 min deep coursework block before campus distractions (+1.2 focus).
- *Pocket money weekly review*: 15 min review of coffee, snack, and subscription costs (+5% savings).
- *Post-class fresh air walk*: 20 min reset between study sessions for memory consolidation (+0.5 mood).

#### 2. Working Professional
- *One uninterrupted deep-work sprint*: 90 min sprint with notifications muted (+0.7 focus).
- *Weekly financial review*: 15 min review of account balances and expense patterns (+2% savings).
- *Morning learning & upskilling*: 45 min dedicated to certifications or technical books (+0.8 focus).

#### 3. Freelancer / Creator
- *Dedicated client delivery sprint*: 120 min sprint focused strictly on billable client deliverables (+1.0 focus).
- *Weekly invoice & tax buffer audit*: 20 min accounts receivable check with 25% tax set-aside (+Runway clarity).
- *Inbound pipeline & skill building*: 45 min publishing case studies and upgrading high-value skills (+0.7 pipeline).

#### 4. Founder / Entrepreneur
- *Morning high-leverage product sprint*: 90 min focus on core product before team standups (+1.2 leverage).
- *Burn rate & runway review*: 25 min review of monthly business burn vs liquid buffer (+Runway extension).
- *Direct customer feedback synthesis*: 45 min synthesizing user interview feedback for roadmap refinement (+Product clarity).

#### 5. Retiree / Senior
- *Morning sunshine walk*: 30 min gentle walk for cardiovascular vitality and joint health (+0.8 health).
- *Daily reading & brain puzzle*: 45 min with a book, crossword, or crafting hobby (+0.6 focus).
- *Monthly pension & healthcare check*: 20 min review of healthcare expenses and utility bills (+Peace of mind).

---

## 3. One-Click Adoption Pipeline

When a user clicks **"Add to tasks"** on any suggestion card:
1. The suggestion is added to `state.adopted` list in `twin-store.tsx` (preventing duplicates and marking the button as *"In your plan"*).
2. A corresponding `Task` item is created with matching title, start time, duration, and category.
3. The task is injected into **Today's Plan** (`/planner`), allowing the user to mark it done as part of their daily schedule.
