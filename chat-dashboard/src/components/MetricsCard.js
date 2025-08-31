import React from "react";

const MetricsCard = ({ title, value, subtitle, icon, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    cyan: "bg-gradient-to-br from-cyan-500 to-blue-500",
    emerald: "bg-gradient-to-br from-emerald-500 to-green-500",
    purple: "bg-gradient-to-br from-purple-500 to-pink-500",
    orange: "bg-gradient-to-br from-orange-500 to-red-500",
    red: "bg-gradient-to-br from-red-500 to-pink-500",
  };

  return (
    <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-6 hover:bg-black/30 transition-all duration-300 group">
      <div className="flex items-center">
        <div
          className={`${colorClasses[color]} p-3 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-300">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
        </div>
      </div>
    </div>
  );
};

export default MetricsCard;
