import React from "react";
const ConnectionStatus = ({ isConnected }) => {
  return (
    <div className="flex items-center space-x-2">
      <div
        className={`w-3 h-3 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      ></div>
      <span
        className={`text-sm font-medium ${
          isConnected ? "text-green-700" : "text-red-700"
        }`}
      >
        {isConnected ? "Connected" : "Disconnected"}
      </span>
    </div>
  );
};
export default ConnectionStatus;
