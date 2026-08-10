// src/components/ScenarioComparison.tsx
import { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const API_BASE = "http://localhost:8000";

interface ScenarioInput {
  monthly_investment_change: number;
  sleep_hours_change: number;
  weekly_study_change: number;
}

interface Datapoint {
  year: number;
  net_worth: number;
  health_index: number;
  focus_index: number;
}

interface SimulationResult {
  scenario_name: string;
  datapoints: Datapoint[];
  attained_retirement: boolean;
  wealth_at_end: number;
}

interface SimulationResponse {
  scenario_a: SimulationResult;
  scenario_b: SimulationResult;
  recommendation: string;
}

const defaultScenario: ScenarioInput = {
  monthly_investment_change: 0,
  sleep_hours_change: 0,
  weekly_study_change: 0,
};

interface Props {
  userId: number;
}

export default function ScenarioComparison({ userId }: Props) {
  const [scenarioA, setScenarioA] = useState<ScenarioInput>(defaultScenario);
  const [scenarioB, setScenarioB] = useState<ScenarioInput>({
    ...defaultScenario,
    sleep_hours_change: 1,
    weekly_study_change: 3,
  });
  const [years, setYears] = useState(5);
  const [result, setResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runComparison = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/simulations/compare/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario_a: scenarioA, scenario_b: scenarioB, years }),
      });
      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`${res.status}: ${detail}`);
      }
      const data: SimulationResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run comparison");
    } finally {
      setLoading(false);
    }
  };

  const renderScenarioForm = (
    label: string,
    scenario: ScenarioInput,
    setScenario: (s: ScenarioInput) => void
  ) => (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, flex: 1 }}>
      <h3>{label}</h3>
      <label style={{ display: "block", marginBottom: 8 }}>
        Monthly investment change ($)
        <input
          type="number"
          value={scenario.monthly_investment_change}
          onChange={(e) =>
            setScenario({ ...scenario, monthly_investment_change: parseFloat(e.target.value) || 0 })
          }
          style={{ display: "block", width: "100%" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: 8 }}>
        Sleep hours change (per day)
        <input
          type="number"
          step="0.5"
          value={scenario.sleep_hours_change}
          onChange={(e) =>
            setScenario({ ...scenario, sleep_hours_change: parseFloat(e.target.value) || 0 })
          }
          style={{ display: "block", width: "100%" }}
        />
      </label>
      <label style={{ display: "block" }}>
        Weekly study hours change
        <input
          type="number"
          step="0.5"
          value={scenario.weekly_study_change}
          onChange={(e) =>
            setScenario({ ...scenario, weekly_study_change: parseFloat(e.target.value) || 0 })
          }
          style={{ display: "block", width: "100%" }}
        />
      </label>
    </div>
  );

  // Merge datapoints from both scenarios into one array per year for charting
  const mergeForChart = (key: keyof Omit<Datapoint, "year">) => {
    if (!result) return [];
    return result.scenario_a.datapoints.map((dpA, i) => {
      const dpB = result.scenario_b.datapoints[i];
      return {
        year: dpA.year,
        [`Scenario A ${key}`]: dpA[key],
        [`Scenario B ${key}`]: dpB[key],
      };
    });
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2>What-If Scenario Comparison</h2>

      <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
        {renderScenarioForm("Scenario A", scenarioA, setScenarioA)}
        {renderScenarioForm("Scenario B", scenarioB, setScenarioB)}
      </div>

      <label style={{ display: "block", marginBottom: 16 }}>
        Years to project
        <input
          type="number"
          min={1}
          max={40}
          value={years}
          onChange={(e) => setYears(parseInt(e.target.value) || 5)}
          style={{ display: "block", width: 120 }}
        />
      </label>

      <button onClick={runComparison} disabled={loading}>
        {loading ? "Running..." : "Compare Scenarios"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: "flex", gap: 32, marginBottom: 16 }}>
            <div>
              <strong>Scenario A</strong> — wealth at end: $
              {result.scenario_a.wealth_at_end.toLocaleString()} |{" "}
              {result.scenario_a.attained_retirement ? "✅ hits retirement goal" : "❌ falls short"}
            </div>
            <div>
              <strong>Scenario B</strong> — wealth at end: $
              {result.scenario_b.wealth_at_end.toLocaleString()} |{" "}
              {result.scenario_b.attained_retirement ? "✅ hits retirement goal" : "❌ falls short"}
            </div>
          </div>

          <h4>Net Worth</h4>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={mergeForChart("net_worth")}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Scenario A net_worth" stroke="#2563eb" />
              <Line type="monotone" dataKey="Scenario B net_worth" stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>

          <h4>Health Index</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mergeForChart("health_index")}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Scenario A health_index" stroke="#2563eb" />
              <Line type="monotone" dataKey="Scenario B health_index" stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>

          <h4>Focus Index</h4>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mergeForChart("focus_index")}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Scenario A focus_index" stroke="#2563eb" />
              <Line type="monotone" dataKey="Scenario B focus_index" stroke="#dc2626" />
            </LineChart>
          </ResponsiveContainer>

          <div style={{ marginTop: 16, padding: 12, background: "#f5f5f5", borderRadius: 8 }}>
            <strong>Advisor recommendation:</strong>
            <p>{result.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}