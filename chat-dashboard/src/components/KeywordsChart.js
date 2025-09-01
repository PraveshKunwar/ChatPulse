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
  // Better data handling with fallbacks
  const chartData = React.useMemo(() => {
    if (!keywords || Object.keys(keywords).length === 0) {
      return [
        { name: "No data", count: 0 },
        { name: "yet", count: 0 },
        { name: "available", count: 0 },
      ];
    }

    return Object.entries(keywords)
      .filter(([key, value]) => key && value > 0) // Filter out empty/invalid data
      .map(([key, value]) => ({
        name: key.length > 15 ? key.substring(0, 15) + "..." : key,
        count: parseInt(value) || 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [keywords]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      return (
        <div className="bg-black/90 backdrop-blur-xl border border-gray-700/50 rounded-lg p-3 shadow-2xl z-50">
          <p className="text-white font-semibold">{`${label}`}</p>
          <p className="text-cyan-400">{`Count: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  // Show loading state when no data
  if (!keywords || Object.keys(keywords).length === 0) {
    return (
      <div className="bg-black/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Keyword Frequency</h2>
          <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
        </div>
        <p className="text-gray-400 mb-6">
          Number of messages containing each keyword
        </p>

        <div className="h-[400px] flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-500 text-lg mb-2">📊</div>
            <p className="text-gray-400">No keywords yet</p>
            <p className="text-gray-500 text-sm">
              Send some messages to see keyword frequency
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            interval={0} // Show all labels
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
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
            wrapperStyle={{ zIndex: 1000 }}
          />
          <Bar
            dataKey="count"
            fill="url(#gradient)"
            radius={[6, 6, 0, 0]}
            stroke="#3B82F6"
            strokeWidth={2}
            barSize={40}
            onMouseEnter={(data, index) => {
              // Ensure tooltip shows properly
              console.log("Hover:", data);
            }}
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
