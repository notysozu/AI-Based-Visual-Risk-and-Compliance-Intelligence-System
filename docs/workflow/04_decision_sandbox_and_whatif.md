# Workflow Step 4: Decision Sandbox & What-If Simulation

This document explains the interactive Decision Sandbox (`/simulator`), the multi-scenario parameter modification model, biological feedback tradeoffs, and structured verdict reporting.

---

## 1. Dual Scenario Architecture

The Decision Sandbox allows users to test two competing lifestyle adjustments (**Scenario A** vs **Scenario B**) against their current baseline:

Each scenario modifies 3 core lifestyle levers:
1. **Monthly Savings / Investment Offset**: $\Delta S \in [\$0, +\$2,000]$ (Step: \$50).
2. **Daily Sleep Offset**: $\Delta \text{Sleep} \in [-2.0\text{h}, +3.0\text{h}]$ (Step: 0.5h).
3. **Weekly Learning / Upskilling / Hobbies Offset**: $\Delta \text{Study} \in [-10\text{h}, +20\text{h}]$ (Step: 1h).

---

## 2. Biological Tradeoff Modeling

The engine calculates mathematical indices reflecting the biological and cognitive consequences of daily routines:

### A. Health & Vitality Index ($0.0 - 10.0$)
- Maximized at 8.0 hours of nightly sleep and adequate physical activity ($>30$ min/day).
- Penalized heavily by chronic sleep deficits ($<6.0$ hours) and excessive screen time ($>6.0$ hours):
  $$\text{Health Index} = \text{clamp}\left(10 \cdot \left[1 - \left(\frac{|\text{Sleep} - 8.0|}{4}\right)^{1.4}\right] - 0.2 \cdot \max(0, \text{Screen} - 4) + 0.05 \cdot \text{Exercise}, 0, 10\right)$$

### B. Cognitive Focus Rating ($0.0 - 10.0$)
- Directly driven by sleep sufficiency and dedicated daily learning blocks:
  $$\text{Focus Rating} = \text{clamp}\left(0.5 \cdot \text{Health Index} + 1.2 \cdot \min(\text{Daily Study}, 4) - 0.3 \cdot \max(0, \text{Screen} - 5), 0, 10\right)$$

---

## 3. Automated AI Scenario Generation

If a user opens the sandbox and clicks **"Compare & Analyze"** with empty or default inputs ($0$ offsets on both scenarios):
1. The backend automatically calls `generate_scenario_suggestions()` in `advisor.py`.
2. Groq LLaMA 3.3 creates two contrasting, realistic scenarios tailored to the user's role:
   - *Student*: **Balanced Campus Life** vs **Exam & Study Sprint**.
   - *Freelancer*: **Sustainable Client Cadence** vs **High-Inbound Agency Sprint**.
   - *Entrepreneur*: **High-Leverage Execution** vs **Product Launch Blitz**.
   - *Retiree*: **Daily Wellness & Leisure** vs **Active Projects & Travel**.
   - *Professional*: **Wellbeing-Optimized** vs **High-Growth Career Hustle**.
3. The slider positions update on the frontend, and the comparison analysis runs automatically.

---

## 4. Structured Verdict Cards Grid & AI Intelligence

The simulator displays comparison results through two layers:

### A. Standalone Summary Cards Grid
1. **Financial Impact Card**: Evaluates the 5-year wealth difference and retirement/independence pacing.
2. **Wellbeing Analysis Card**: Analyzes burnout risk, sleep sufficiency, and cognitive sustainability.
3. **Strategy Verdict Card**: Highlights the winning scenario with clear rationale and outcome metrics.

### B. Interactive `AIIntelligenceCard`
- **View Filter Tabs**: Toggle between **All**, **Scenarios**, or **Verdict**.
- **Formatted Callout Panels**: Scenario A, Scenario B, and Tradeoff dynamics rendered with distinct pastel badges.
- **Inline Adoption**: Direct **"Adopt Scenario A"** and **"Adopt Scenario B"** buttons to immediately sync winning parameters into active profile metrics.
- **One-Click Clipboard Copy**: Easy copying of the complete AI analysis.


## 7. Tradeoff Matrix Analysis
- Evaluates sleep vs wealth trade-offs to prevent aggressive savings that induce burnout.
- Recommends balanced trajectories where focus ratings remain $\ge 6.5/10$.
