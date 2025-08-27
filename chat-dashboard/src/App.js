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
function App() {
  const { messagesPerSec, activeUsers, keywords, isConnected } = useSocket();
  return (
    <div className="min-h-screen bg-gray-50">
      {}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                ChatPulse Analytics
              </h1>
            </div>
            <ConnectionStatus isConnected={isConnected} />
          </div>
        </div>
      </header>
      {}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricsCard
            title="Active Users"
            value={activeUsers}
            subtitle="Currently online"
            icon={<UserIcon />}
            color="green"
          />
          <MetricsCard
            title="Messages/sec"
            value={messagesPerSec}
            subtitle="Real-time rate"
            icon={<MessageIcon />}
            color="blue"
          />
          <MetricsCard
            title="System Status"
            value={isConnected ? "Online" : "Offline"}
            subtitle="WebSocket connection"
            icon={<ActivityIcon />}
            color={isConnected ? "green" : "red"}
          />
        </div>
        {}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <KeywordsChart keywords={keywords} />
          {}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Real-time Activity
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  Messages per second
                </span>
                <span className="text-lg font-semibold text-blue-900">
                  {messagesPerSec}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <span className="text-sm text-green-700">Active users</span>
                <span className="text-lg font-semibold text-green-900">
                  {activeUsers}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <span className="text-sm text-purple-700">Unique keywords</span>
                <span className="text-lg font-semibold text-purple-900">
                  {Object.keys(keywords || {}).length}
                </span>
              </div>
            </div>
          </div>
        </div>
        {}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Data updates every second • Built with React, Socket.IO, and Redis
          </p>
        </div>
      </main>
    </div>
  );
}
export default App;
