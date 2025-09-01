import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const BACKEND_INSTANCES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];

export const useSocket = () => {
  const [metrics, setMetrics] = useState({
    messagesPerSec: 0,
    activeUsers: 0,
    keywords: {},
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [aggregatedData, setAggregatedData] = useState({
    totalActiveUsers: 0,
    instanceCount: 0,
    totalConnections: 0,
    totalMemory: "0 MB",
    instanceMetrics: {},
  });
  const socketsRef = useRef(new Map());
  const instanceMetricsRef = useRef(new Map());

  const updateAggregatedData = () => {
    const instanceMetrics = instanceMetricsRef.current;
    const connectedInstances = Array.from(instanceMetrics.keys());

    let totalActiveUsers = 0;
    let totalMessagesPerSec = 0;
    let totalMemory = 0;
    let allKeywords = {};

    connectedInstances.forEach((instanceUrl) => {
      const metrics = instanceMetrics.get(instanceUrl);
      if (metrics) {
        totalActiveUsers += metrics.activeUsers || 0;
        totalMessagesPerSec += metrics.messagesPerSec || 0;
        totalMemory += metrics.memoryUsage?.heapUsed || 0;

        // Merge keywords
        if (metrics.keywords) {
          Object.entries(metrics.keywords).forEach(([keyword, count]) => {
            allKeywords[keyword] = (allKeywords[keyword] || 0) + count;
          });
        }
      }
    });

    setMetrics({
      messagesPerSec: totalMessagesPerSec,
      activeUsers: totalActiveUsers,
      keywords: allKeywords,
    });

    setAggregatedData({
      totalActiveUsers,
      instanceCount: connectedInstances.length,
      totalConnections: totalActiveUsers, // Assuming activeUsers = connections
      totalMemory: `${Math.round(totalMemory / 1024 / 1024)} MB`,
      instanceMetrics: Object.fromEntries(instanceMetrics),
    });
  };

  useEffect(() => {
    const sockets = socketsRef.current;
    const instanceMetrics = instanceMetricsRef.current;

    const createSocketConnection = (instanceUrl) => {
      const socket = io(instanceUrl, {
        transports: ["websocket"],
        timeout: 3000,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      const handleConnect = () => {
        console.log(`✅ Connected to ${instanceUrl}:`, socket.id);
        updateConnectionStatus();
      };

      const handleDisconnect = (reason) => {
        console.log(`❌ Disconnected from ${instanceUrl}:`, reason);
        instanceMetrics.delete(instanceUrl);
        updateConnectionStatus();
        updateAggregatedData();
      };

      const handleConnectError = (error) => {
        console.error(`🚫 Connection error to ${instanceUrl}:`, error);
        instanceMetrics.delete(instanceUrl);
        updateConnectionStatus();
        updateAggregatedData();
      };

      const handleMetrics = (data) => {
        instanceMetrics.set(instanceUrl, {
          ...data,
          instanceUrl,
          connected: true,
        });
        updateAggregatedData();
      };

      socket.on("connect", handleConnect);
      socket.on("disconnect", handleDisconnect);
      socket.on("connect_error", handleConnectError);
      socket.on("metrics", handleMetrics);

      return socket;
    };

    const updateConnectionStatus = () => {
      const connectedSockets = Array.from(sockets.values()).filter(
        (socket) => socket.connected
      );
      setIsConnected(connectedSockets.length > 0);
      setConnectionAttempts(0);
    };

    // Create connections to all instances
    BACKEND_INSTANCES.forEach((instanceUrl) => {
      const socket = createSocketConnection(instanceUrl);
      sockets.set(instanceUrl, socket);
    });

    return () => {
      // Cleanup all socket connections
      sockets.forEach((socket, instanceUrl) => {
        socket.off("connect");
        socket.off("disconnect");
        socket.off("connect_error");
        socket.off("metrics");
        socket.disconnect();
      });
      sockets.clear();
      instanceMetrics.clear();
    };
  }, []);

  return {
    ...metrics,
    isConnected,
    connectionAttempts,
    isReconnecting: connectionAttempts > 0 && !isConnected,
    aggregatedData,
  };
};
