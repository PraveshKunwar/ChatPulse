const { io } = require("socket.io-client");

const socket = io("http://localhost:3001");

const users = Array.from({ length: 100 }, (_, i) => `user${i + 1}`);
const sampleMessages = [
  "hello there",
  "hi everyone",
  "test message",
  "chat analytics",
  "react dashboard",
  "redis metrics",
  "socket.io real-time",
  "node.js backend",
  "express server",
  "web development",
  "javascript coding",
  "data visualization",
  "real-time updates",
  "performance monitoring",
  "system metrics",
  "user engagement",
  "chat application",
  "messaging platform",
  "analytics tools",
  "dashboard metrics",
  "live updates",
  "streaming data",
];

let messageCount = 0;
let startTime = Date.now();

setInterval(() => {
  const userId = users[Math.floor(Math.random() * users.length)];
  if (Math.random() > 0.5) {
    socket.emit("user_joined", { userId });
  } else {
    socket.emit("user_left", { userId });
  }
}, 2000);

setInterval(() => {
  const userId = users[Math.floor(Math.random() * users.length)];
  const text =
    sampleMessages[Math.floor(Math.random() * sampleMessages.length)];

  socket.emit("message_sent", { userId, text });
  messageCount++;

  if (messageCount % 100 === 0) {
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = (messageCount / elapsed).toFixed(2);
    console.log(
      `Sent ${messageCount} messages in ${elapsed.toFixed(1)}s (${rate} msg/s)`
    );
  }
}, 1);

console.log("Starting chat simulation...");
console.log("Press Ctrl+C to stop");

process.on("SIGINT", () => {
  console.log("\nStopping simulation...");
  socket.disconnect();
  process.exit(0);
});
