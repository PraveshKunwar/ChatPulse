import React from "react";
import { useSocket } from "./useSocket";
import MetricsCard from "./components/MetricsCard";
import KeywordsChart from "./components/KeywordsChart";
import ConnectionStatus from "./components/ConnectionStatus";

const UserIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
    />
  </svg>
);

const MessageIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
    />
  </svg>
);

const ActivityIcon = () => (
  <svg
    className="w-6 h-6 text-white"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
    />
  </svg>
);

const PulseIcon = () => (
  <svg
    className="w-8 h-8 text-cyan-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

function App() {
  const {
    messagesPerSec,
    activeUsers,
    keywords,
    isConnected,
    connectionAttempts,
    isReconnecting,
  } = useSocket();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white font-inter">
      {/* Animated Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(156,146,172,0.15),transparent_1px)] bg-[length:20px_20px]"></div>
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-black/20 backdrop-blur-xl border-b border-gray-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                  <PulseIcon />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  ChatPulse
                </h1>
                <p className="text-gray-400 text-sm font-medium">
                  Real-time Analytics Dashboard
                </p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <ConnectionStatus
                isConnected={isConnected}
                connectionAttempts={connectionAttempts || 0}
                isReconnecting={isReconnecting || false}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricsCard
            title="Active Users"
            value={activeUsers}
            subtitle="Currently online"
            icon={<UserIcon />}
            color="emerald"
          />
          <MetricsCard
            title="Messages/sec"
            value={messagesPerSec}
            subtitle="Real-time rate"
            icon={<MessageIcon />}
            color="cyan"
          />
          <MetricsCard
            title="System Status"
            value={isConnected ? "Online" : "Offline"}
            subtitle="WebSocket connection"
            icon={<ActivityIcon />}
            color={isConnected ? "emerald" : "red"}
          />
        </div>

        {/* Charts and Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <KeywordsChart keywords={keywords} />

          {/* Real-time Activity Panel */}
          <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                Real-time Activity
              </h3>
              <div className="w-3 h-3 bg-cyan-400 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-sm font-medium text-cyan-300">
                    Messages per second
                  </span>
                </div>
                <span className="text-2xl font-bold text-cyan-400">
                  {messagesPerSec}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-xl border border-emerald-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                  <span className="text-sm font-medium text-emerald-300">
                    Active users
                  </span>
                </div>
                <span className="text-2xl font-bold text-emerald-400">
                  {activeUsers}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-sm font-medium text-purple-300">
                    Unique keywords
                  </span>
                </div>
                <span className="text-2xl font-bold text-purple-400">
                  {Object.keys(keywords || {}).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-gray-700/50 shadow-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">
              System Information
            </h3>
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <div
                className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-gray-400">
              <span className="block text-xs uppercase tracking-wider mb-1">
                Status
              </span>
              <span
                className={`font-semibold ${
                  isConnected ? "text-green-400" : "text-red-400"
                }`}
              >
                {isConnected ? "Operational" : "Disconnected"}
              </span>
            </div>
            <div className="text-gray-400">
              <span className="block text-xs uppercase tracking-wider mb-1">
                Performance
              </span>
              <span className="font-semibold text-cyan-400">
                {messagesPerSec > 100
                  ? "High"
                  : messagesPerSec > 50
                  ? "Medium"
                  : "Low"}
              </span>
            </div>
            <div className="text-gray-400">
              <span className="block text-xs uppercase tracking-wider mb-1">
                Load
              </span>
              <span className="font-semibold text-purple-400">
                {activeUsers > 500
                  ? "Heavy"
                  : activeUsers > 100
                  ? "Moderate"
                  : "Light"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-black/20 backdrop-blur-xl rounded-full border border-gray-700/50">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
            <p className="text-sm text-gray-400 font-medium">
              Data updates every second • Built with React, Socket.IO, and Redis
            </p>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"
              style={{ animationDelay: "0.3s" }}
            ></div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
