import React from "react";

const ConnectionStatus = ({
  isConnected,
  connectionAttempts = 0,
  isReconnecting = false,
}) => {
  const getStatusInfo = () => {
    if (isConnected) {
      return {
        text: "Connected",
        bgColor: "bg-gradient-to-r from-green-500 to-emerald-500",
        borderColor: "border-green-400/50",
        textColor: "text-white",
        shadowColor: "shadow-green-500/25",
        icon: "🟢",
      };
    }

    if (isReconnecting) {
      return {
        text: `Reconnecting...`,
        bgColor: "bg-gradient-to-r from-yellow-500 to-amber-500",
        borderColor: "border-yellow-400/50",
        textColor: "text-white",
        shadowColor: "shadow-yellow-500/25",
        icon: "🟡",
      };
    }

    return {
      text: "Disconnected",
      bgColor: "bg-gradient-to-r from-red-500 to-pink-500",
      borderColor: "border-red-400/50",
      textColor: "text-white",
      shadowColor: "shadow-red-500/25",
      icon: "🔴",
    };
  };

  const status = getStatusInfo();

  return (
    <div
      className={`
      relative group cursor-pointer
      w-full sm:w-auto
      px-6 py-3 rounded-2xl 
      ${status.bgColor} ${status.borderColor}
      border-2 backdrop-blur-sm
      ${status.shadowColor} shadow-lg
      transition-all duration-300 ease-out
      hover:scale-105 hover:shadow-xl
      active:scale-95
      transform-gpu
      flex justify-center sm:justify-start
    `}
    >
      {/* Animated background glow */}
      <div
        className={`
        absolute inset-0 rounded-2xl 
        ${status.bgColor} opacity-0
        group-hover:opacity-20
        transition-opacity duration-300
        blur-xl scale-110
      `}
      ></div>

      {/* Content */}
      <div className="relative flex items-center space-x-3">
        <span className="text-lg animate-pulse">{status.icon}</span>
        <span className={`text-sm font-bold ${status.textColor} tracking-wide`}>
          {status.text}
        </span>

        {/* Connection attempts indicator */}
        {connectionAttempts > 0 && (
          <div className="flex items-center space-x-1">
            <span className="text-xs opacity-75">({connectionAttempts})</span>
          </div>
        )}

        {/* Reconnecting spinner */}
        {isReconnecting && (
          <div className="ml-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* Hover effect line */}
      <div
        className={`
        absolute bottom-0 left-1/2 w-0 h-0.5 
        ${status.borderColor.replace("/50", "")}
        group-hover:w-1/2 group-hover:left-0
        transition-all duration-300 ease-out
      `}
      ></div>

      {/* Pulse animation for disconnected state */}
      {!isConnected && (
        <div
          className={`
          absolute inset-0 rounded-2xl 
          ${status.bgColor} opacity-20
          animate-ping
        `}
        ></div>
      )}
    </div>
  );
};

export default ConnectionStatus;
