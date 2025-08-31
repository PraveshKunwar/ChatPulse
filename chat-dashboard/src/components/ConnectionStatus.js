import React from "react";

const ConnectionStatus = ({ isConnected }) => {
  return (
    <div className="flex items-center space-x-3">
      <div className="flex items-center space-x-2 px-4 py-2 bg-black/20 backdrop-blur-xl rounded-full border border-gray-700/50">
        <div
          className={`w-3 h-3 rounded-full ${
            isConnected ? "bg-green-400" : "bg-red-400"
          } animate-pulse`}
        ></div>
        <span
          className={`text-sm font-medium ${
            isConnected ? "text-green-300" : "text-red-300"
          }`}
        >
          {isConnected ? "Connected" : "Disconnected"}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus;
