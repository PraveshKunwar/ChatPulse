import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:3001");

export const useSocket = () => {
  const [metrics, setMetrics] = useState({
    messagesPerSec: 0,
    activeUsers: 0,
    keywords: {},
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    socket.on("metrics", (data) => {
      setMetrics((prev) => ({ ...prev, ...data }));
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("metrics");
    };
  }, []);

  return { ...metrics, isConnected };
};
