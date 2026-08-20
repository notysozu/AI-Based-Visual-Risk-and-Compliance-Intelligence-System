# Workflow Step 3: Financial Forecasting & Monte Carlo Simulation

This document explains the mathematical foundations, Monte Carlo simulation model, probability of success algorithms, and AI advice caching.

---

## 1. Dual Financial Modeling

The financial engine (`ai_engine/forecasting/finance.py`) projects long-term wealth using two parallel methodologies:

### A. Deterministic Projection
- Models steady-state compound interest with constant annual asset returns (default 8%) and consistent monthly additions:
  $$W_{t+1} = W_t \cdot (1 + r_{\text{annual}}) + 12 \cdot S_{\text{monthly}}$$

### B. Monte Carlo Stochastic Simulation (500 Paths)
- Simulates real-world market volatility using log-normal annual returns:
  $$r_t \sim \mathcal{N}(\mu = 0.08, \sigma = 0.15)$$
- Runs 500 independent timeline iterations across the user's horizon $(T_{\text{target}} - T_{\text{current}})$.
- Computes percentile trajectories:
  - **90th Percentile ($p_{90}$)**: Optimistic bull market scenario.
  - **50th Percentile ($p_{50}$)**: Median expected trajectory.
  - **10th Percentile ($p_{10}$)**: Conservative bear market scenario.

---

## 2. Probability of Success Metric

The probability of hitting the user's target net worth ($W_{\text{target}}$) is computed as the proportion of Monte Carlo paths whose terminal wealth meets or exceeds the target:

$$\text{Probability of Success} = \frac{\sum_{i=1}^{500} \mathbb{I}(W_{T, i} \ge W_{\text{target}})}{500}$$

---

## 3. Automated Cache & Refresh Workflow (`/wealth`)

To ensure fast UI responses and prevent redundant LLM inference calls:

1. **Target Editing in Place**: When the user edits their target age or target net worth in the Wealth view, clicking **"Get Prediction"** triggers an atomic update:
   - Synchronizes new targets to the database via `updateProfile()`.
   - Re-runs the Monte Carlo simulation in the background via `loadForecast()`.
2. **Backend Hash / Odds Cache Check**:
   - `GET /simulations/wealth-advice/{user_id}` inspects the user's current `probability_of_success`.
   - If `last_success_odds` in the database matches the newly simulated probability, the cached advice is returned instantly without calling the LLM.
   - If the simulation output changed, Groq LLaMA 3.1 is invoked with persona-specific instructions to generate a fresh 3–5 sentence prediction, which is saved to `last_wealth_prediction` in the database.


## 4. LLM Narrative Generation & Token Limits
- Wealth narratives run on LLaMA 3.3 (70B) with temperature set to 0.4 for consistent financial projections.
- Fallback algorithms calculate deterministic trajectory and success percentage when offline.


## 6. Percentile Ranking Algorithms
- P10, P50, and P90 confidence curves sort 500 simulated paths at each milestone year.
- Outliers are normalized to generate continuous smooth confidence bands.
