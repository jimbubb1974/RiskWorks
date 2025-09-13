import React from "react";
import type { RiskTrendDataPoint } from "../services/audit";

interface RiskTrendChartProps {
  data: RiskTrendDataPoint[];
  riskId: number;
}

const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ data, riskId }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Trend</h3>
        <div className="text-gray-500 text-center py-8">
          No trend data available for this risk
        </div>
      </div>
    );
  }

  // Sort data by timestamp
  const sortedData = [...data].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Get the latest values for comparison
  const latest = sortedData[sortedData.length - 1];
  const previous =
    sortedData.length > 1 ? sortedData[sortedData.length - 2] : null;

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const getTrendIcon = (
    current: number | undefined,
    previous: number | undefined
  ) => {
    if (!current || !previous) return "→";
    if (current > previous) return "↗";
    if (current < previous) return "↘";
    return "→";
  };

  const getTrendColor = (
    current: number | undefined,
    previous: number | undefined
  ) => {
    if (!current || !previous) return "text-gray-500";
    if (current > previous) return "text-red-500";
    if (current < previous) return "text-green-500";
    return "text-gray-500";
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Risk Trend</h3>

      {/* Current values with trend indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-sm text-gray-500">Probability</div>
          <div className="text-2xl font-bold text-gray-900">
            {latest.probability || "N/A"}
          </div>
          {previous && (
            <div
              className={`text-sm ${getTrendColor(
                latest.probability,
                previous.probability
              )}`}
            >
              {getTrendIcon(latest.probability, previous.probability)}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">Impact</div>
          <div className="text-2xl font-bold text-gray-900">
            {latest.impact || "N/A"}
          </div>
          {previous && (
            <div
              className={`text-sm ${getTrendColor(
                latest.impact,
                previous.impact
              )}`}
            >
              {getTrendIcon(latest.impact, previous.impact)}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">Score</div>
          <div className="text-2xl font-bold text-gray-900">
            {latest.score || "N/A"}
          </div>
          {previous && (
            <div
              className={`text-sm ${getTrendColor(
                latest.score,
                previous.score
              )}`}
            >
              {getTrendIcon(latest.score, previous.score)}
            </div>
          )}
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-500">Risk Level</div>
          <div className="text-2xl font-bold text-gray-900">
            {latest.risk_level || "N/A"}
          </div>
        </div>
      </div>

      {/* Simple timeline */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Recent Changes</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {sortedData
            .slice(-5)
            .reverse()
            .map((point, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm py-1 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex space-x-4">
                  <span className="text-gray-500">
                    {formatDate(point.timestamp)}
                  </span>
                  {point.probability && <span>P: {point.probability}</span>}
                  {point.impact && <span>I: {point.impact}</span>}
                  {point.score && <span>S: {point.score}</span>}
                  {point.risk_level && <span>L: {point.risk_level}</span>}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default RiskTrendChart;
