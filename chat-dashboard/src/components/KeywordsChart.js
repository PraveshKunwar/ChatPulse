import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const KeywordsChart = ({ keywords }) => {
  const chartData = Object.entries(keywords || {})
    .map(([key, value]) => ({ name: key, count: value }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 backdrop-blur-xl border border-gray-700/50 rounded-lg p-3 shadow-2xl">
          <p className="text-white font-semibold">{`${label}`}</p>
          <p className="text-cyan-400">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-gray-700/50">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Keyword Frequency</h2>
        <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
      </div>
      <p className="text-gray-400 mb-6">
        Number of messages containing each keyword
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            label={{
              value: "Number of Messages",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#9CA3AF" },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="count"
            fill="url(#gradient)"
            radius={[6, 6, 0, 0]}
            stroke="#3B82F6"
            strokeWidth={2}
            barSize={40}
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KeywordsChart;
