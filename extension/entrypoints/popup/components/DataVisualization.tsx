import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

interface MetricPoint {
  timestamp: number;
  value: number;
  label?: string;
}

interface Props {
  metrics?: MetricPoint[];
}

function DataVisualization({ metrics = [] }: Props) {
  return (
    <div className="bg-[#1a1b26] rounded-lg border border-[#2a2b3d] p-3">
      <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
        Activity Trend
      </h3>
      <div className="h-32">
        <Line
          data={{
            labels: metrics.map((m) =>
              m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : ""
            ),
            datasets: [
              {
                label: "Activity",
                data: metrics.map((m) => m.value),
                borderColor: "#a78bfa",
                backgroundColor: "rgba(167, 139, 250, 0.1)",
                borderWidth: 1.5,
                pointRadius: 1.5,
                pointHoverRadius: 4,
                fill: true,
                tension: 0.3,
              },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 300 },
            scales: {
              x: {
                display: true,
                ticks: { color: "#4a4a5a", font: { size: 9 }, maxTicksLimit: 5 },
                grid: { display: false },
              },
              y: {
                display: true,
                min: 0,
                max: 100,
                ticks: { color: "#4a4a5a", font: { size: 9 }, maxTicksLimit: 4 },
                grid: { color: "rgba(255,255,255,0.03)" },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: "#1a1b26",
                titleColor: "#e0e0e0",
                bodyColor: "#a0a0b0",
                borderColor: "#2a2b3d",
                borderWidth: 1,
              },
            },
            interaction: { intersect: false, mode: "index" },
          }}
        />
      </div>
    </div>
  );
}

export default DataVisualization;
