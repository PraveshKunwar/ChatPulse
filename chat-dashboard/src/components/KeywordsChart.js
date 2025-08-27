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

  console.log("Processed chart data:", chartData);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Keyword Frequency
        </h3>
        <div className="text-center text-gray-500 py-8">
          No keywords data available yet
          <br />
          <small className="text-xs">
            Debug: keywords prop = {JSON.stringify(keywords)}
          </small>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`Keyword: ${label}`}</p>
          <p className="text-blue-600">{`Messages: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Keyword Frequency
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Number of messages containing each keyword
      </p>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 50, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            interval={0}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={{ stroke: "#d1d5db" }}
          />

          <YAxis
            label={{
              value: "Number of Messages",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#374151", fontSize: 14 },
            }}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={{ stroke: "#d1d5db" }}
            tickLine={{ stroke: "#d1d5db" }}
          />

          <Tooltip content={<CustomTooltip />} />

          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[6, 6, 0, 0]}
            stroke="#1d4ed8"
            strokeWidth={2}
            barSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default KeywordsChart;
