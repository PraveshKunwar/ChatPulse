const { io } = require("socket.io-client");
console.log("🛡️ Starting SAFE Massive Surge Simulation...");
const BACKEND_INSTANCES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];
const CONFIG = {
  TOTAL_USERS: 6000,
  USERS_PER_INSTANCE: 2000,
  MESSAGES_PER_SEC: 5000,
  BURST_SIZE: 50,
  BURST_INTERVAL: 20,
  USER_JOIN_RATE: 20,
  MESSAGE_LENGTH: { min: 5, max: 50 },
  CONNECTION_BATCH_SIZE: 50,
  CONNECTION_DELAY: 10,
  MAX_CONCURRENT_CONNECTIONS: 6000,
  MEMORY_CHECK_INTERVAL: 5000,
  MAX_MEMORY_USAGE: 500,
};
const users = Array.from(
  { length: CONFIG.TOTAL_USERS },
  (_, i) => `safe-user-${i + 1}`
);
const connections = new Map();
let currentInstance = 0;
let isThrottling = false;
let stats = {
  totalMessages: 0,
  totalUsers: 0,
  startTime: Date.now(),
  messageRates: [],
  connectionCount: 0,
  errors: 0,
  memoryWarnings: 0,
  throttledBursts: 0,
  successfulConnections: 0,
};
function getNextBackend() {
  const instance = BACKEND_INSTANCES[currentInstance];
  currentInstance = (currentInstance + 1) % BACKEND_INSTANCES.length;
  return instance;
}
function checkMemoryUsage() {
  if (process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    if (heapUsedMB > CONFIG.MAX_MEMORY_USAGE) {
      console.log(
        `⚠️ Memory warning: ${heapUsedMB}MB used (limit: ${CONFIG.MAX_MEMORY_USAGE}MB)`
      );
      stats.memoryWarnings++;
      return true;
    }
  }
  return false;
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
      stats.successfulConnections++;
      if (stats.successfulConnections % 100 === 0) {
        console.log(`✅ Connected: ${stats.successfulConnections} users`);
      }
    });
    socket.on("disconnect", () => {
      console.log(`❌ ${userId} disconnected from ${backendUrl}`);
      connections.delete(userId);
      stats.connectionCount = connections.size;
    });
    socket.on("error", (error) => {
      console.error(`❌ ${userId} error on ${backendUrl}:`, error.message);
      connections.delete(userId);
      stats.errors++;
      if (stats.errors % 100 === 0) {
        console.log(`⚠️ Connection errors: ${stats.errors}`);
      }
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
    if (checkMemoryUsage()) {
      console.log("⏸️ Pausing connection creation due to memory usage");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.log(
    `✅ Created ${stats.successfulConnections} connections successfully`
  );
}
function generateMessage() {
  const wordCount =
    Math.floor(
      Math.random() *
        (CONFIG.MESSAGE_LENGTH.max - CONFIG.MESSAGE_LENGTH.min + 1)
    ) + CONFIG.MESSAGE_LENGTH.min;
  const messageCorpus = [
    "javascript",
    "typescript",
    "react",
    "nodejs",
    "docker",
    "kubernetes",
    "redis",
    "api",
    "rest",
    "graphql",
    "websocket",
    "microservices",
    "aws",
    "azure",
    "gcp",
    "code",
    "test",
    "build",
    "deploy",
    "git",
    "ci",
    "cd",
    "monitor",
    "log",
    "debug",
    "hello",
    "hi",
    "good",
    "great",
    "thanks",
    "agree",
    "understand",
    "question",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "by",
    "from",
  ];
  const message = [];
  for (let i = 0; i < wordCount; i++) {
    message.push(
      messageCorpus[Math.floor(Math.random() * messageCorpus.length)]
    );
  }
  return message.join(" ");
}
function sendMessageBurst() {
  if (isThrottling) {
    stats.throttledBursts++;
    return;
  }
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
  if (stats.totalMessages % 5000 === 0) {
    console.log(`💥 Burst sent: ${burstMessages} messages`);
  }
}
function simulateUserActivity() {
  const activeConnections = Array.from(connections.values()).filter(
    (connection) => connection.socket.connected
  );
  if (activeConnections.length === 0) return;
  const activityChance = 0.05;
  if (Math.random() < activityChance) {
    const connection =
      activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (Math.random() > 0.7) {
      connection.socket.emit("user_joined", { userId: randomUser });
      stats.totalUsers++;
    } else {
      connection.socket.emit("user_left", { userId: randomUser });
      stats.totalUsers = Math.max(0, stats.totalUsers - 1);
    }
  }
}
function logPerformance() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const currentRate = (stats.totalMessages / elapsed).toFixed(0);
  stats.messageRates.push(parseInt(currentRate));
  if (stats.messageRates.length > 10) stats.messageRates.shift();
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
    } | Errors: ${stats.errors} | Memory Warnings: ${stats.memoryWarnings}`
  );
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.5) {
    console.log(
      `⚠️ Performance warning: Current rate (${currentRate}) below 50% of target`
    );
  }
  if (stats.errors > 500) {
    console.log(
      `🚨 High error rate: ${stats.errors} errors detected - consider stopping`
    );
  }
  if (stats.memoryWarnings > 10) {
    console.log(
      `💾 High memory usage warnings: ${stats.memoryWarnings} - system may be stressed`
    );
  }
}
function monitorMemory() {
  if (checkMemoryUsage()) {
    console.log("🛡️ Activating throttling due to memory usage");
    isThrottling = true;
    setTimeout(() => {
      isThrottling = false;
      console.log("✅ Throttling deactivated");
    }, 10000);
  }
}
async function startSimulation() {
  console.log("🚀 Starting safe massive simulation...");
  console.log(
    `📊 Target: ${CONFIG.TOTAL_USERS} users across ${BACKEND_INSTANCES.length} backends`
  );
  console.log(`💬 Messages: ${CONFIG.MESSAGES_PER_SEC} per second total`);
  await createConnections();
  if (connections.size > 0) {
    setInterval(sendMessageBurst, CONFIG.BURST_INTERVAL);
    setInterval(simulateUserActivity, 1000 / CONFIG.USER_JOIN_RATE);
    setInterval(logPerformance, 1000);
    setInterval(monitorMemory, CONFIG.MEMORY_CHECK_INTERVAL);
    console.log("✅ Simulation running! Press Ctrl+C to stop");
  } else {
    console.log("❌ No connections established");
  }
}
process.on("SIGINT", () => {
  console.log("\n🛑 Stopping safe massive simulation...");
  console.log(`📊 Final Stats:`);
  console.log(`   Messages: ${stats.totalMessages.toLocaleString()}`);
  console.log(`   Users: ${stats.totalUsers}`);
  console.log(`   Connections: ${stats.connectionCount}`);
  console.log(`   Successful Connections: ${stats.successfulConnections}`);
  console.log(`   Errors: ${stats.errors}`);
  console.log(`   Memory Warnings: ${stats.memoryWarnings}`);
  console.log(`   Throttled Bursts: ${stats.throttledBursts}`);
  console.log("🧹 Flushing Redis database...");
  fetch("http://localhost:3001/reset")
    .then((response) => response.json())
    .then((data) => {
      console.log("✅ Redis database cleared:", data.message);
      for (const [userId, connection] of connections.entries()) {
        if (connection.socket.connected) {
          connection.socket.disconnect();
        }
      }
      process.exit(0);
    })
    .catch((error) => {
      console.log("⚠️ Could not clear Redis:", error.message);
      for (const [userId, connection] of connections.entries()) {
        if (connection.socket.connected) {
          connection.socket.disconnect();
        }
      }
      process.exit(0);
    });
});
startSimulation().catch(console.error);
