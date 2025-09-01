import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = () => {
  const [metrics, setMetrics] = useState({
    messagesPerSec: 0,
    activeUsers: 0,
    keywords: {},
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    // Create socket with better connection options
    socketRef.current = io("http://localhost:3001", {
      transports: ["websocket"],
      timeout: 3000, // Faster timeout
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    const socket = socketRef.current;

    const handleConnect = () => {
      setIsConnected(true);
      setConnectionAttempts(0);
      console.log("✅ Connected to server:", socket.id);
    };

    const handleDisconnect = (reason) => {
      setIsConnected(false);
      console.log("❌ Disconnected from server:", reason);

      // Auto-reconnect on unexpected disconnects
      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        console.log("🔄 Attempting to reconnect...");
        setTimeout(() => {
          socket.connect();
        }, 1000);
      }
    };

    const handleConnectError = (error) => {
      setIsConnected(false);
      setConnectionAttempts((prev) => prev + 1);
      console.error("🚫 Connection error:", error);

      // Retry connection after delay
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!socket.connected) {
          console.log("🔄 Retrying connection...");
          socket.connect();
        }
      }, Math.min(1000 * Math.pow(2, connectionAttempts), 10000));
    };

    const handleReconnect = (attemptNumber) => {
      console.log("🔄 Reconnected after", attemptNumber, "attempts");
      setIsConnected(true);
      setConnectionAttempts(0);
    };

    const handleReconnectError = () => {
      console.log("🚫 Reconnection failed");
      setIsConnected(false);
    };

    const handleMetrics = (data) => {
      setMetrics((prev) => ({ ...prev, ...data }));
    };

    // Set up event listeners
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("reconnect", handleReconnect);
    socket.on("reconnect_error", handleReconnectError);
    socket.on("metrics", handleMetrics);

    // Initial connection attempt
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("reconnect", handleReconnect);
      socket.off("reconnect_error", handleReconnectError);
      socket.off("metrics", handleMetrics);

      socket.disconnect();
    };
  }, []);

  return {
    ...metrics,
    isConnected,
    connectionAttempts,
    isReconnecting: connectionAttempts > 0 && !isConnected,
  };
};
