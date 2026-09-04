# The 5 User Personas — Visual Risk AI

Visual Risk AI adapts its financial models, habit baselines, circadian schedules, and AI reasoning algorithms across 5 distinct life-stage personas.

---

## Persona Comparison Matrix

| Persona | Core Life Focus | Primary Inflow Label | Baseline Net Worth | Target Horizon | Cognitive / Focus Metric |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Student** | Exams, coursework & allowance savings | Pocket Money / Allowance | Saved Allowance ($1,600) | Career Launch Age ($12k–$30k) | Coursework & Exam Deep Work |
| **Working Professional** | Salaried career, 401(k) & retirement | Monthly Take-Home Salary | Current Net Worth ($48,000) | Retirement Age ($1.2M) | Upskilling & High-Leverage Deep Work |
| **Freelancer / Creator** | Client contracts, invoices & runway | Invoiced Monthly Revenue | Cash Buffer & Portfolio ($35,000) | Financial Freedom Age ($850k) | Skill Mastery & Pipeline Development |
| **Founder / Entrepreneur**| Venture sprints, equity & runway | Founder Draw / Income | Capital Reserve ($90,000) | Valuation / Exit Age ($3.0M) | Strategic Product Sprints |
| **Retiree / Senior** | Longevity, health buffer & legacy | Monthly Pension / Passive | Nest Egg ($520,000) | Longevity Target Age ($650k) | Daily Reading, Walking & Vitality |

---

## In-Depth Persona Profiles

### 1. Student Persona
- **Demographics**: Ages 18–24, pursuing academic degrees, certifications, or early vocational training.
- **Financial Architecture**: Optimized for allowance budgets, micro-savings, and minimizing student debt friction.
- **Circadian Schedule**: Heavy emphasis on study session time-blocking, spaced repetition scheduling, and exam preparation sprint windows.
- **Default Targets**:
  - Sleep Target: 8.0 hours/night
  - Study Target: 18.0 hours/week
  - Monthly Allowance: $1,200.00
  - Target Career Launch Fund: $25,000.00 by age 24

### 2. Working Professional Persona
- **Demographics**: Ages 25–55, full-time employment, climbing career tracks, managing 401(k) / equity portfolios.
- **Financial Architecture**: Focuses on maximizing monthly savings rate (target > 35%), automated surplus investment sweeps, and compounding wealth trajectory to age 60.
- **Circadian Schedule**: Protects 08:30–11:30 AM circadian cortisol alertness peaks for deep work, mitigating evening cognitive fatigue.
- **Default Targets**:
  - Sleep Target: 7.5 hours/night
  - Study / Upskilling Target: 10.0 hours/week
  - Monthly Salary: $6,500.00
  - Target Retirement Net Worth: $1,200,000.00 by age 60

### 3. Freelancer / Creator Persona
- **Demographics**: Independent contractors, creative studio owners, and software consultants managing variable income streams.
- **Financial Architecture**: Prioritizes liquid emergency runway (6–12 months expenses buffer) and tax-efficient quarterly reserves.
- **Circadian Schedule**: Flexible work-block scheduling, preventing digital screen burnout and irregular sleep patterns.
- **Default Targets**:
  - Sleep Target: 7.5 hours/night
  - Deep Work Target: 20.0 hours/week
  - Average Invoiced Revenue: $5,400.00
  - Target Financial Independence Fund: $850,000.00 by age 55

### 4. Founder / Entrepreneur Persona
- **Demographics**: Venture founders, agency owners, and startup operators balancing rapid execution with high operational stress.
- **Financial Architecture**: Focuses on company runway survival, founder draw sustainability, and long-term equity valuation horizons.
- **Circadian Schedule**: Aggressively mitigates acute sleep debt to sustain high-stakes decision-making and executive focus.
- **Default Targets**:
  - Sleep Target: 7.0 hours/night
  - Strategic Sprint Target: 25.0 hours/week
  - Founder Draw: $8,500.00
  - Target Enterprise Valuation / Exit: $3,000,000.00 by age 48

### 5. Retiree / Senior Persona
- **Demographics**: Ages 55+, individuals in retirement or phased transition, focusing on asset preservation and health longevity.
- **Financial Architecture**: Safe withdrawal rate modeling (3.5%–4.0%), inflation-adjusted passive income streams, and healthcare risk buffers.
- **Circadian Schedule**: Structured daily walking, restorative sleep consistency, cognitive vitality exercises, and stress minimization.
- **Default Targets**:
  - Sleep Target: 8.0 hours/night
  - Reading / Vitality Activity: 12.0 hours/week
  - Monthly Pension / Dividends: $4,200.00
  - Capital Preservation Target: $650,000.00 to age 85+

---

## Dedicated MongoDB Demo Twin Accounts

To support instant, 1-click exploration with realistic multi-week history without requiring manual registration, Visual Risk AI automatically initializes dedicated, isolated demo documents in MongoDB Atlas (`GET /users/demo/{role}`):

| Persona | MongoDB Username | Seeded Telemetry Profile | Auto-Seeded Data in MongoDB |
| :--- | :--- | :--- | :--- |
| **Student** | `student_demo` | Age: 20 · $1,200/mo allowance · 25h/wk coursework | 30d sleep/study logs, course subjects, micro-savings flows |
| **Freelancer / Creator** | `freelancer_demo` | Age: 28 · $6,500/mo invoices · 10h/wk study | 30d client delivery logs, tax buffer reserves, contract cashflows |
| **Founder / Entrepreneur** | `founder_demo` | Age: 32 · $12,000/mo draw · $3M exit target | 30d strategic sprint logs, equity milestones, burn telemetry |
| **Retiree / Senior** | `retiree_demo` | Age: 62 · $4,500/mo pension · $1.5M nest egg | 30d vitality walk logs, safe withdrawal draws, health metrics |
| **Working Professional** | `pro_demo` | Age: 29 · $8,500/mo salary · 12h/wk upskilling | 30d deep work sessions, surplus investment sweeps, promotion goals |

Each demo persona maintains isolated simulation presets, AI reasoning history, and telemetry logs directly in MongoDB Atlas.

---

*Back to [README.md](../README.md)*
