import React, { useRef, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

function DataVisualization({ metrics = [] }) {
  return (
    <div className="bg-claude-surface rounded-xl border border-claude-border p-4">
      <h3 className="text-xs uppercase tracking-widest text-gray-500 mb-3">
        Activity Trend
      </h3>
      <div className="h-48">
        <Line
          data={{
            labels: metrics.map((m) =>
              m.timestamp
                ? new Date(m.timestamp).toLocaleTimeString()
                : ''
            ),
            datasets: [
              {
                label: 'Activity',
                data: metrics.map((m) => m.value),
                borderColor: '#6c5ce7',
                backgroundColor: 'rgba(108, 92, 231, 0.1)',
                borderWidth: 2,
                pointRadius: 2,
                pointHoverRadius: 5,
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
                ticks: {
                  color: '#4a4a5a',
                  font: { size: 10 },
                  maxTicksLimit: 8,
                },
                grid: { display: false },
              },
              y: {
                display: true,
                min: 0,
                max: 100,
                ticks: {
                  color: '#4a4a5a',
                  font: { size: 10 },
                  maxTicksLimit: 5,
                },
                grid: {
                  color: 'rgba(255,255,255,0.04)',
                },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                theme: 'dark',
                backgroundColor: '#1a1b26',
                titleColor: '#e0e0e0',
                bodyColor: '#a0a0b0',
                borderColor: '#2a2b3d',
                borderWidth: 1,
              },
            },
            interaction: {
              intersect: false,
              mode: 'index',
            },
          }}
        />
      </div>
    </div>
  );
}

export default DataVisualization;
