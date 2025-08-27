const io = require("socket.io-client");
console.log("🧪 Testing ChatPulse Backend...");
const socket = io("http://localhost:3001
socket.on("connect", () => {
  console.log("✅ WebSocket connected successfully");
  socket.emit("user_joined", { userId: "test-user-1" });
  console.log("✅ User join event sent");
  socket.emit("message_sent", {
    userId: "test-user-1",
    text: "Hello ChatPulse!",
  });
  console.log("✅ Message event sent");
  socket.on("metrics", (data) => {
    console.log("📊 Received metrics:", data);
    if (data.activeUsers > 0 || data.messagesPerSec > 0) {
      console.log("✅ Metrics are working correctly");
      socket.disconnect();
      process.exit(0);
    }
  });
  setTimeout(() => {
    console.log("⏰ Timeout waiting for metrics");
    socket.disconnect();
    process.exit(1);
  }, 5000);
});
socket.on("connect_error", (error) => {
  console.error("❌ WebSocket connection failed:", error.message);
  process.exit(1);
});
socket.on("disconnect", () => {
  console.log("🔌 WebSocket disconnected");
});
