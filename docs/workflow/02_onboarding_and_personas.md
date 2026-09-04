# Workflow Step 2: Onboarding & Persona Architecture

This document describes the 5 distinct life-stage personas supported by the Visual Risk AI platform, the role selection mechanism, and the adaptive question pipeline.

---

## 1. The 5 User Personas

The system recognizes that financial planning, daily habits, and productivity metrics fundamentally differ depending on a user's life stage. 

| Persona | Core Focus | Inflow Label | Net Worth Scope | Learning / Focus Area |
| :--- | :--- | :--- | :--- | :--- |
| **Student** | Coursework, exams, pocket allowance | Pocket Money / Allowance | Saved Pocket Money ($10k scale) | Study & Coursework |
| **Working Professional** | Salaried career, 401(k), retirement | Monthly Take-Home Salary | Current Net Worth ($1M scale) | Upskilling & Learning |
| **Freelancer / Creator** | Client contracts, invoices, runway | Average Invoiced Revenue | Cash Buffer & Portfolio ($800k scale) | Skill Building & Portfolio |
| **Founder / Entrepreneur**| Venture build sprints, equity, runway | Founder Draw / Income | Liquid Capital & Valuation ($2.5M scale) | Strategy & Market Research |
| **Retiree / Senior** | Longevity, healthcare buffer, legacy | Monthly Pension / Passive | Nest Egg & Legacy ($600k scale) | Reading & Mind Hobbies |

---

## 2. Onboarding Workflow (`frontend/src/routes/setup.tsx`)

### Step 0: Persona Selection
When a new user launches the application, they are immediately presented with 5 clear role options. Selecting a role initializes persona-tailored default metrics (age range, target horizon, base income, expenses, and savings targets).

### Steps 1..N: Dynamic Question Sequence
Questions dynamically adjust their language, slider ranges, step intervals, and units to match the selected role:

1. **Current Age & Target Horizon**:
   - *Student*: Age 14–28 -> Target career launch age 20–35.
   - *Professional*: Age 20–65 -> Target retirement age 40–75.
   - *Freelancer*: Age 18–65 -> Target financial freedom age 35–70.
   - *Entrepreneur*: Age 18–65 -> Target venture exit age 30–65.
   - *Retiree*: Age 55–95 -> Target longevity age 75–100.

2. **Cashflow & Reserves**:
   - Tailored ranges for monthly inflow ($0–$3k for students, up to $35k for founders).
   - Tailored net worth milestones ($10k tech/fund for students, $2.5M exit for founders).

3. **Daily Routine & Biology**:
   - Sleep hours per night (4h to 11h).
   - Leisure screen time (0h to 12h).
   - Weekly learning / coursework / hobbies (0h to 50h).
   - Weekly active movement days (0 to 7 days).

4. **Primary Milestone Goal**:
   - Short-term goal name, dollar target, and current progress.

---

## 3. Dynamic Profile Synchronization

Once onboarding is completed:
1. The user profile is created/updated directly in the MongoDB database via `POST /users/` or `PUT /users/{user_id}`.
2. All profile targets, biometrics, financial goals, and intelligence cache fields are persisted to MongoDB.
3. All subsequent pages (`/dashboard`, `/wealth`, `/planner`, `/suggestions`, `/simulator`, `/analytics`) reference `getRoleConfig(profile.role)` to display cohesive terminology.


## 6. Dynamic Question Progression
- Student onboarding captures allowance and study targets.
- Professional onboarding captures 401(k) and retirement horizons.
- Freelancer onboarding captures average invoice income and tax runway.


## 7. Instant Persona Switching & Dedicated Demo Accounts
- Users can explore any persona instantly without signing up via 1-click demo loaders on Landing, Login, and Signup pages.
- Backend automatically initializes and seeds dedicated MongoDB documents (`student_demo`, `freelancer_demo`, `founder_demo`, `retiree_demo`, `pro_demo`) via `GET /users/demo/{role}`.
- 30 days of realistic, persona-specific telemetry (biometrics, coursework sessions, cash flows) are seeded in MongoDB Atlas for rich dashboard interaction out of the box.
