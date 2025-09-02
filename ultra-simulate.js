const { io } = require("socket.io-client");
console.log("🚀 Starting ULTRA Surge Simulation...");
const BACKEND_INSTANCES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
  "http://localhost:3004",
  "http://localhost:3005",
];
const CONFIG = {
  TOTAL_USERS: 10000,
  USERS_PER_INSTANCE: 2000,
  MESSAGES_PER_SEC: 3000,
  BURST_SIZE: 150,
  BURST_INTERVAL: 50,
  USER_JOIN_RATE: 50,
  MESSAGE_LENGTH: { min: 3, max: 80 },
  CONNECTION_BATCH_SIZE: 100,
  CONNECTION_DELAY: 5,
  MAX_CONCURRENT_CONNECTIONS: 10000,
};
const users = Array.from(
  { length: CONFIG.TOTAL_USERS },
  (_, i) => `ultra-user-${i + 1}`
);
const connections = new Map();
let currentInstance = 0;
let stats = {
  totalMessages: 0,
  totalUsers: 0,
  startTime: Date.now(),
  messageRates: [],
  connectionCount: 0,
  errors: 0,
  successfulConnections: 0,
  reconnectionCount: 0,
  networkIssues: 0,
  avgLatency: 0,
  latencySamples: [],
};
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
      timeout: 5000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 100,
      reconnectionDelayMax: 2000,
      maxReconnectionAttempts: 10,
      upgrade: true,
      rememberUpgrade: false,
      autoConnect: true,
      pingTimeout: 30000,
      pingInterval: 15000,
    });
    socket.on("connect", () => {
      console.log(
        `✅ ${userId} connected to ${backendUrl} (${
          connections.size + 1
        } total)`
      );
      socket.emit("user_joined", { userId });
      stats.successfulConnections++;
      if (stats.successfulConnections % 500 === 0) {
        console.log(`✅ Connected: ${stats.successfulConnections} users`);
      }

      // Reduced heartbeat frequency
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit("ping", { userId, timestamp: Date.now() });
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 15000); // Reduced from 5s to 15s

      // Store heartbeat interval for cleanup
      socket.heartbeatInterval = heartbeatInterval;
    });
    socket.on("disconnect", (reason) => {
      console.log(`❌ ${userId} disconnected from ${backendUrl}: ${reason}`);

      // Clean up heartbeat interval
      if (socket.heartbeatInterval) {
        clearInterval(socket.heartbeatInterval);
      }

      if (
        reason === "io server disconnect" ||
        reason === "io client disconnect"
      ) {
        connections.delete(userId);
      }
    });
    socket.on("reconnect", (attemptNumber) => {
      console.log(
        `🔄 ${userId} reconnected to ${backendUrl} after ${attemptNumber} attempts`
      );
      stats.reconnectionCount++;

      // Restart heartbeat after reconnection
      const heartbeatInterval = setInterval(() => {
        if (socket.connected) {
          socket.emit("ping", { userId, timestamp: Date.now() });
        } else {
          clearInterval(heartbeatInterval);
        }
      }, 15000); // Reduced from 5s to 15s

      socket.heartbeatInterval = heartbeatInterval;
    });
    socket.on("reconnect_attempt", (attemptNumber) => {
      if (attemptNumber % 5 === 0) {
        console.log(
          `🔄 ${userId} attempting to reconnect to ${backendUrl} (attempt ${attemptNumber})`
        );
      }
    });
    socket.on("reconnect_error", (error) => {
      console.error(
        `❌ ${userId} reconnection error on ${backendUrl}:`,
        error.message
      );
      stats.errors++;
      stats.networkIssues++;
    });
    socket.on("reconnect_failed", () => {
      console.error(
        `❌ ${userId} failed to reconnect to ${backendUrl} after all attempts`
      );
      connections.delete(userId);
      stats.errors++;
    });
    socket.on("error", (error) => {
      console.error(`❌ ${userId} error on ${backendUrl}:`, error.message);
      stats.errors++;
      if (stats.errors % 100 === 0) {
        console.log(`⚠️ Connection errors: ${stats.errors}`);
      }
    });

    // Handle pong responses to keep connection alive
    socket.on("pong", (data) => {
      // Connection is alive, update last seen
      socket.lastPong = Date.now();
    });
    connections.set(userId, { socket, backendUrl });
    return socket;
  } catch (error) {
    console.error(
      `❌ Failed to connect ${userId} to ${backendUrl}:`,
      error.message
    );
    stats.errors++;
    return null;
  }
}
async function createConnections() {
  console.log(
    `🔌 Creating ${CONFIG.TOTAL_USERS} connections across ${BACKEND_INSTANCES.length} backends...`
  );
  const totalConnections = Math.min(
    CONFIG.TOTAL_USERS,
    CONFIG.MAX_CONCURRENT_CONNECTIONS
  );
  const batches = Math.ceil(totalConnections / CONFIG.CONNECTION_BATCH_SIZE);
  for (let batch = 0; batch < batches; batch++) {
    const start = batch * CONFIG.CONNECTION_BATCH_SIZE;
    const end = Math.min(
      start + CONFIG.CONNECTION_BATCH_SIZE,
      totalConnections
    );
    console.log(
      `📦 Creating batch ${batch + 1}/${batches} (connections ${
        start + 1
      }-${end})`
    );
    const promises = [];
    for (let i = start; i < end; i++) {
      const userId = users[i];
      promises.push(createConnection(userId));
    }
    await Promise.allSettled(promises);
    if (batch < batches - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.CONNECTION_DELAY)
      );
    }
  }
  console.log(`✅ Created ${connections.size} connections`);
}
function generateMessage() {
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
  return messageCorpus[Math.floor(Math.random() * messageCorpus.length)];
}
function sendMessageBurst() {
  const burstSize = CONFIG.BURST_SIZE;
  const activeConnections = Array.from(connections.values()).filter(
    (connection) => connection.socket.connected
  );
  if (activeConnections.length === 0) return;
  let burstMessages = 0;
  for (let i = 0; i < burstSize; i++) {
    try {
      const connection =
        activeConnections[Math.floor(Math.random() * activeConnections.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const message = generateMessage();
      connection.socket.emit("message_sent", {
        userId: randomUser,
        text: message,
      });
      stats.totalMessages++;
      burstMessages++;
    } catch (error) {
      stats.errors++;
      if (stats.errors % 100 === 0) {
        console.log(`⚠️ Message errors: ${stats.errors}`);
      }
    }
  }
  if (stats.totalMessages % 15000 === 0) {
    console.log(`💥 Burst sent: ${burstMessages} messages`);
  }
}
function simulateUserActivity() {
  const activeConnections = Array.from(connections.values()).filter(
    (connection) => connection.socket.connected
  );
  if (activeConnections.length === 0) return;
  const activityChance = 0.08;
  if (Math.random() < activityChance) {
    const connection =
      activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (Math.random() > 0.6) {
      connection.socket.emit("user_joined", { userId: randomUser });
      stats.totalUsers++;
    } else {
      connection.socket.emit("user_left", { userId: randomUser });
      stats.totalUsers = Math.max(0, stats.totalUsers - 1);
    }
  }
}

function maintainConnections() {
  const now = Date.now();
  const staleThreshold = 30000; // 30 seconds

  for (const [userId, connection] of connections.entries()) {
    const socket = connection.socket;

    // Check if connection is stale (no pong received recently)
    if (socket.lastPong && now - socket.lastPong > staleThreshold) {
      console.log(`🔄 ${userId} connection stale, forcing reconnect`);
      socket.disconnect();
      socket.connect();
    }

    // Send keep-alive activity
    if (socket.connected && Math.random() < 0.1) {
      socket.emit("user_activity", {
        userId,
        timestamp: now,
        type: "keepalive",
      });
    }
  }
}
function logPerformance() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const currentRate = (stats.totalMessages / elapsed).toFixed(0);
  stats.messageRates.push(parseInt(currentRate));
  if (stats.messageRates.length > 20) stats.messageRates.shift();
  const avgRateOverTime = (
    stats.messageRates.reduce((a, b) => a + b, 0) / stats.messageRates.length
  ).toFixed(0);
  console.log(
    `📊 ${stats.totalMessages.toLocaleString()} messages in ${elapsed.toFixed(
      1
    )}s | Current: ${currentRate} msg/s | Avg: ${avgRateOverTime} msg/s | Users: ${
      stats.totalUsers
    } | Connections: ${stats.connectionCount} | Successful: ${
      stats.successfulConnections
    } | Errors: ${stats.errors} | Reconnects: ${
      stats.reconnectionCount
    } | Network Issues: ${stats.networkIssues}`
  );
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.7) {
    console.log(
      `⚠️ Performance warning: Current rate (${currentRate}) below 70% of target`
    );
  }
  if (stats.errors > 1000) {
    console.log(
      `🚨 High error rate: ${stats.errors} errors detected - consider stopping`
    );
  }
  if (stats.networkIssues > 500) {
    console.log(
      `🌐 Network issues detected: ${stats.networkIssues} - check WiFi connection`
    );
  }
  if (stats.reconnectionCount > 1000) {
    console.log(
      `🔄 High reconnection rate: ${stats.reconnectionCount} - network instability detected`
    );
  }
}
async function startSimulation() {
  console.log("🚀 Starting ultra simulation...");
  console.log(
    `📊 Target: ${CONFIG.TOTAL_USERS} users across ${BACKEND_INSTANCES.length} backends`
  );
  console.log(`💬 Messages: ${CONFIG.MESSAGES_PER_SEC} per second total`);
  await createConnections();
  if (connections.size > 0) {
    setInterval(sendMessageBurst, CONFIG.BURST_INTERVAL);
    setInterval(simulateUserActivity, 1000 / CONFIG.USER_JOIN_RATE);
    setInterval(maintainConnections, 30000); // Check connections every 30 seconds
    setInterval(logPerformance, 1000);
    console.log("✅ Simulation running! Press Ctrl+C to stop");
  } else {
    console.log("❌ No connections established");
  }
}
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping ultra simulation...");
  console.log(`📊 Final Stats:`);
  console.log(`   Messages: ${stats.totalMessages.toLocaleString()}`);
  console.log(`   Users: ${stats.totalUsers}`);
  console.log(`   Connections: ${stats.connectionCount}`);
  console.log(`   Successful Connections: ${stats.successfulConnections}`);
  console.log(`   Errors: ${stats.errors}`);
  for (const [userId, connection] of connections.entries()) {
    if (connection.socket.connected) {
      // Clean up heartbeat intervals
      if (connection.socket.heartbeatInterval) {
        clearInterval(connection.socket.heartbeatInterval);
      }
      connection.socket.disconnect();
    }
  }
  process.exit(0);
});
startSimulation().catch(console.error);
