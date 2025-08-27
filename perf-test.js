const io = require("socket.io-client");
console.log("🚀 Performance Testing ChatPulse...");
const NUM_USERS = 50;
const MESSAGES_PER_USER = 100;
const DELAY_MS = 10;
const users = Array.from({ length: NUM_USERS }, (_, i) => `perf-user-${i + 1}`);
const sampleMessages = [
  "performance test message",
  "load testing",
  "stress test",
  "high throughput",
  "scalability test",
  "real-time analytics",
  "websocket performance",
  "redis metrics",
  "node.js backend",
];
let totalMessages = 0;
let startTime = Date.now();
let connections = [];
console.log(`🔌 Creating ${NUM_USERS} WebSocket connections...`);
for (let i = 0; i < NUM_USERS; i++) {
  const socket = io("http://localhost:3001
  socket.on("connect", () => {
    console.log(`✅ User ${i + 1} connected`);
    let messageCount = 0;
    const sendMessage = () => {
      if (messageCount < MESSAGES_PER_USER) {
        const text =
          sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
        socket.emit("message_sent", { userId: users[i], text });
        messageCount++;
        totalMessages++;
        setTimeout(sendMessage, DELAY_MS);
      } else {
        socket.disconnect();
      }
    };
    setTimeout(sendMessage, i * 100);
  });
  connections.push(socket);
}
const progressInterval = setInterval(() => {
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = (totalMessages / elapsed).toFixed(2);
  console.log(`📊 Progress: ${totalMessages} messages sent (${rate} msg/s)`);
  if (totalMessages >= NUM_USERS * MESSAGES_PER_USER) {
    clearInterval(progressInterval);
    const totalElapsed = (Date.now() - startTime) / 1000;
    const avgRate = (totalMessages / totalElapsed).toFixed(2);
    console.log("\n🎉 Performance test completed!");
    console.log(`📈 Total messages: ${totalMessages}`);
    console.log(`⏱️  Total time: ${totalElapsed.toFixed(2)}s`);
    console.log(`🚀 Average rate: ${avgRate} msg/s`);
    console.log(`👥 Users: ${NUM_USERS}`);
    connections.forEach((socket) => socket.disconnect());
    process.exit(0);
  }
}, 1000);
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping performance test...");
  connections.forEach((socket) => socket.disconnect());
  clearInterval(progressInterval);
  process.exit(0);
});
