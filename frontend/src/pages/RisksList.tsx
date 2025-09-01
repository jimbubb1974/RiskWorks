import { useQuery } from "@tanstack/react-query";
import { listRisks } from "../services/risks";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function RisksList() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>("");
  const [minSeverity, setMinSeverity] = useState<number | "">("");
  const [search, setSearch] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const { data } = useQuery({
    queryKey: ["risks", status, minSeverity, search, sortBy, order],
    queryFn: () =>
      listRisks({
        status: status || undefined,
        min_severity: typeof minSeverity === "number" ? minSeverity : undefined,
        search: search || undefined,
        sort_by: sortBy || undefined,
        order,
      }),
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Risks</h1>
        <button
          onClick={() => navigate("/risks/new")}
          className="inline-flex items-center rounded bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Create risk
        </button>
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        <input
          type="text"
          placeholder="Search title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
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
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="created_at">Created</option>
          <option value="updated_at">Updated</option>
          <option value="severity">Severity</option>
          <option value="probability">Probability</option>
          <option value="title">Title</option>
          <option value="status">Status</option>
        </select>
        <select
          value={order}
          onChange={(e) => setOrder(e.target.value as "asc" | "desc")}
          className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="desc">Desc</option>
          <option value="asc">Asc</option>
        </select>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-2 text-left">Title</th>
              <th className="px-4 py-2 text-left">Severity</th>
              <th className="px-4 py-2 text-left">Probability</th>
              <th className="px-4 py-2 text-left">Score</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r, idx) => (
              <tr key={r.id} className={idx % 2 ? "bg-white" : "bg-gray-50"}>
                <td className="px-4 py-2 font-medium text-gray-900">
                  {r.title}
                </td>
                <td className="px-4 py-2">{r.severity}</td>
                <td className="px-4 py-2">{r.probability}</td>
                <td className="px-4 py-2">{r.severity * r.probability}</td>
                <td className="px-4 py-2 capitalize">{r.status}</td>
                <td className="px-4 py-2 text-right">
                  <Link
                    className="text-indigo-600 hover:underline"
                    to={`/risks/${r.id}`}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
