import { useQuery } from "@tanstack/react-query";
import { listRisks } from "../services/risks";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RisksList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [minSeverity, setMinSeverity] = useState<number | "">("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["risks", status, minSeverity],
    queryFn: () =>
      listRisks({
        status: status || undefined,
        min_severity: typeof minSeverity === "number" ? minSeverity : undefined,
      }),
  });

  return (
    <div style={{ maxWidth: 900, margin: "20px auto" }}>
      <h1>Risks</h1>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="mitigated">Mitigated</option>
          <option value="closed">Closed</option>
        </select>
        <input
          type="number"
          min={1}
          max={5}
          placeholder="Min severity"
          value={minSeverity}
          onChange={(e) =>
            setMinSeverity(e.target.value ? Number(e.target.value) : "")
          }
        />
        <button onClick={() => refetch()}>Apply</button>
        <button onClick={() => navigate("/risks/new")}>Create risk</button>
      </div>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table
          width="100%"
          cellPadding={6}
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr>
              <th align="left">Title</th>
              <th align="left">Severity</th>
              <th align="left">Probability</th>
              <th align="left">Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #ddd" }}>
                <td>{r.title}</td>
                <td>{r.severity}</td>
                <td>{r.probability}</td>
                <td>{r.status}</td>
                <td>
                  <Link to={`/risks/${r.id}`}>View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
