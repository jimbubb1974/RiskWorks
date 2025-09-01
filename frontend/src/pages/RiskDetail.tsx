import { useEffect, useState } from "react";
import { deleteRisk, getRisk } from "../services/risks";
import { useNavigate, useParams } from "react-router-dom";
import type { Risk } from "../types/risk";

export default function RiskDetail() {
  const params = useParams();
  const navigate = useNavigate();
  const [risk, setRisk] = useState<Risk | null>(null);

  useEffect(() => {
    async function load() {
      if (params.id) {
        const r = await getRisk(Number(params.id));
        setRisk(r);
      }
    }
    load();
  }, [params.id]);

  async function onDelete() {
    if (!params.id) return;
    await deleteRisk(Number(params.id));
    navigate("/risks");
  }

  if (!risk) return <p style={{ margin: "20px" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "20px auto" }}>
      <h1>{risk.title}</h1>
      <p>Status: {risk.status}</p>
      <p>Severity: {risk.severity}</p>
      <p>Probability: {risk.probability}</p>
      {risk.description && <p>{risk.description}</p>}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => navigate(`/risks/${risk.id}/edit`)}>Edit</button>
        <button onClick={onDelete}>Delete</button>
        <button onClick={() => navigate("/risks")}>Back</button>
      </div>
    </div>
  );
}
