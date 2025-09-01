const { io } = require("socket.io-client");
console.log("🚀 Starting SCALED Surge Simulation...");
console.log(
  "This version distributes connections across multiple backend instances"
);
const BACKEND_INSTANCES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];
const CONFIG = {
  TOTAL_USERS: 6000, // ✅ Reduced to more realistic target
  USERS_PER_INSTANCE: 2000, // ✅ Reduced per instance
  MESSAGES_PER_SEC: 15000,
  BURST_SIZE: 100,
  BURST_INTERVAL: 50,
  USER_JOIN_RATE: 50,
  MESSAGE_LENGTH: { min: 5, max: 50 },
};
const users = Array.from(
  { length: CONFIG.TOTAL_USERS },
  (_, i) => `scaled-user-${i + 1}`
);
const connections = new Map();
let currentInstance = 0;
function getNextBackend() {
  const instance = BACKEND_INSTANCES[currentInstance];
  currentInstance = (currentInstance + 1) % BACKEND_INSTANCES.length;
  return instance;
}
async function createConnection(userId) {
  const backendUrl = getNextBackend();
  try {
    const socket = io(backendUrl, {
      transports: ["websocket"],
      timeout: 30000,
      forceNew: true,
      reconnection: false,
      upgrade: true,
      rememberUpgrade: false,
      autoConnect: true,
      pingTimeout: 60000,
      pingInterval: 25000,
    });
    socket.on("connect", () => {
      console.log(
        `✅ ${userId} connected to ${backendUrl} (${
          connections.size + 1
        } total)`
      );
      socket.emit("user_joined", { userId });
    });
    socket.on("disconnect", () => {
      console.log(`❌ ${userId} disconnected from ${backendUrl}`);
      connections.delete(userId);
    });
    socket.on("error", (error) => {
      console.error(`❌ ${userId} error on ${backendUrl}:`, error.message);
      connections.delete(userId);
    });
    connections.set(userId, { socket, backendUrl });
    return socket;
  } catch (error) {
    console.error(
      `❌ Failed to connect ${userId} to ${backendUrl}:`,
      error.message
    );
    return null;
  }
}
async function createConnections() {
  console.log(
    `🔌 Creating ${CONFIG.TOTAL_USERS} connections across ${BACKEND_INSTANCES.length} backends...`
  );
  const batchSize = 50;
  const batches = Math.ceil(CONFIG.TOTAL_USERS / batchSize);
  for (let batch = 0; batch < batches; batch++) {
    const start = batch * batchSize;
    const end = Math.min(start + batchSize, CONFIG.TOTAL_USERS);
    console.log(
      `📦 Batch ${batch + 1}/${batches}: Creating connections ${
        start + 1
      }-${end}`
    );
    const promises = [];
    for (let i = start; i < end; i++) {
      const userId = users[i];
      promises.push(createConnection(userId));
    }
    await Promise.allSettled(promises);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log(`✅ Created ${connections.size} connections`);
}
function sendMessages() {
  if (connections.size === 0) return;
  const messageCorpus = [
    "hello",
    "hi",
    "how",
    "are",
    "you",
    "doing",
    "today",
    "javascript",
    "react",
    "nodejs",
    "docker",
    "redis",
    "websocket",
    "scaling",
    "performance",
    "load",
    "testing",
    "real-time",
    "analytics",
  ];
  setInterval(() => {
    const activeConnections = Array.from(connections.values());
    if (activeConnections.length === 0) return;
    for (let i = 0; i < CONFIG.BURST_SIZE; i++) {
      const connection =
        activeConnections[Math.floor(Math.random() * activeConnections.length)];
      if (connection && connection.socket.connected) {
        const message =
          messageCorpus[Math.floor(Math.random() * messageCorpus.length)];
        connection.socket.emit("message_sent", {
          userId: connection.socket.id,
          text: message,
        });
      }
    }
  }, CONFIG.BURST_INTERVAL);
}
async function startSimulation() {
  console.log("🚀 Starting scaled simulation...");
  console.log(
    `📊 Target: ${CONFIG.TOTAL_USERS} users across ${BACKEND_INSTANCES.length} backends`
  );
  console.log(`💬 Messages: ${CONFIG.MESSAGES_PER_SEC} per second total`);
  await createConnections();
  if (connections.size > 0) {
    sendMessages();
    console.log("✅ Simulation running! Press Ctrl+C to stop");
  } else {
    console.log("❌ No connections established");
  }
}
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping scaled simulation...");
  console.log(`📊 Final Stats: ${connections.size} active connections`);
  for (const [userId, connection] of connections.entries()) {
    if (connection.socket.connected) {
      connection.socket.disconnect();
    }
  }
  process.exit(0);
});
startSimulation().catch(console.error);
