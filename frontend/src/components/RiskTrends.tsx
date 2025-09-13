import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { listRisks } from "../services/risks";
import { auditService } from "../services/audit";
import type { Risk } from "../types/risk";
import type { RiskTrendDataPoint } from "../services/audit";
import { TrendingUp, BarChart3, Calendar } from "lucide-react";
import type { Chart, ChartConfiguration } from "chart.js";

interface RiskTrendsProps {
  onClose?: () => void;
}

const RiskTrends: React.FC<RiskTrendsProps> = ({ onClose }) => {
  const [selectedRiskId, setSelectedRiskId] = useState<number | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Fetch risks for dropdown
  const { data: risks = [], isLoading: risksLoading } = useQuery({
    queryKey: ["risks"],
    queryFn: listRisks,
  });

  // Fetch trend data when risk is selected
  const { data: trendData = [], isLoading: trendLoading } = useQuery({
    queryKey: ["risk-trend", selectedRiskId, selectedDays],
    queryFn: () => auditService.getRiskTrend(selectedRiskId!, selectedDays),
    enabled: !!selectedRiskId,
  });

  // Chart.js setup and chart rendering
  useEffect(() => {
    if (!chartRef.current || !trendData.length || trendLoading) return;

    // Import Chart.js dynamically and create chart
    import("chart.js").then(({ Chart, registerables }) => {
      Chart.register(...registerables);

      // Destroy existing chart
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      // Sort data by timestamp
      const sortedData = [...trendData].sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Prepare chart data
      const labels = sortedData.map((point) => {
        const date = new Date(point.timestamp);
        return date.toLocaleDateString();
      });

      const scoreData = sortedData.map((point) => point.score || 0);
      const probabilityData = sortedData.map((point) => point.probability || 0);
      const impactData = sortedData.map((point) => point.impact || 0);

      const ctx = chartRef.current!.getContext("2d");
      if (!ctx) return;

      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Risk Score",
              data: scoreData,
              borderColor: "rgb(239, 68, 68)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              tension: 0.1,
              yAxisID: "y",
            },
            {
              label: "Probability",
              data: probabilityData,
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.1,
              yAxisID: "y1",
            },
            {
              label: "Impact",
              data: impactData,
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              tension: 0.1,
              yAxisID: "y1",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          scales: {
            x: {
              display: true,
              title: {
                display: true,
                text: "Date",
              },
            },
            y: {
              type: "linear",
              display: true,
              position: "left",
              title: {
                display: true,
                text: "Risk Score",
              },
              min: 0,
              max: 25,
            },
            y1: {
              type: "linear",
              display: true,
              position: "right",
              title: {
                display: true,
                text: "Probability & Impact (1-5)",
              },
              min: 0,
              max: 5,
              grid: {
                drawOnChartArea: false,
              },
            },
          },
          plugins: {
            legend: {
              position: "top",
            },
            title: {
              display: true,
              text: `Risk Trends - ${selectedDays} Days`,
            },
            tooltip: {
              callbacks: {
                afterLabel: (context: any) => {
                  const dataIndex = context.dataIndex;
                  const point = sortedData[dataIndex];
                  const tooltip = [];

                  if (point && point.risk_level) {
                    tooltip.push(`Risk Level: ${point.risk_level}`);
                  }

                  return tooltip;
                },
              },
            },
          },
        },
      });
    });
  }, [trendData, selectedDays, trendLoading]);

  const selectedRisk = risks.find((r) => r.id === selectedRiskId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <TrendingUp className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Risk Trends</h2>
            <p className="text-gray-600">
              Analyze how risk scores change over time
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Risk Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Risk
            </label>
            <select
              value={selectedRiskId || ""}
              onChange={(e) =>
                setSelectedRiskId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
              disabled={risksLoading}
            >
              <option value="">Choose a risk...</option>
              {risks.map((risk) => (
                <option key={risk.id} value={risk.id}>
                  {risk.risk_name} (ID: {risk.id})
                </option>
              ))}
            </select>
          </div>

          {/* Time Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>

          {/* Current Risk Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Risk Info
            </label>
            {selectedRisk ? (
              <div className="text-sm text-gray-600">
                <div>Score: {selectedRisk.score || "N/A"}</div>
                <div>Level: {selectedRisk.risk_level}</div>
                <div>Status: {selectedRisk.status}</div>
              </div>
            ) : (
              <div className="text-sm text-gray-400">No risk selected</div>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      {selectedRiskId ? (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Risk Trend Analysis
            </h3>
            {trendData.length > 0 && (
              <div className="text-sm text-gray-500 flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {trendData.length} data points
              </div>
            )}
          </div>

          {trendLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading trend data...</span>
            </div>
          ) : trendData.length > 0 ? (
            <div className="h-96">
              <canvas ref={chartRef}></canvas>
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                No Trend Data Available
              </h4>
              <p className="text-gray-500">
                This risk doesn't have any audit history for the selected time
                period. Changes to the risk will appear here over time.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select a Risk to View Trends
          </h3>
          <p className="text-gray-500">
            Choose a risk from the dropdown above to see how its score has
            changed over time.
          </p>
        </div>
      )}
    </div>
  );
};

export default RiskTrends;
