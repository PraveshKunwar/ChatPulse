const { io } = require("socket.io-client");

console.log("🚀 Starting MASSIVE ChatPulse Simulation...");
console.log("This will generate extreme load for stress testing");

// Configuration - adjust these for different load levels
const CONFIG = {
  USERS: 5000, // 5000 simulated users
  MESSAGES_PER_SEC: 10000, // 10,000 messages per second target
  BURST_SIZE: 100, // Send messages in bursts for efficiency
  BURST_INTERVAL: 10, // 10ms between bursts = 100 bursts/sec * 100 msgs = 10k/sec
  USER_JOIN_RATE: 50, // 50 users join/leave per second
  MESSAGE_LENGTH: { min: 10, max: 100 }, // Random message lengths
  KEYWORDS_PER_MESSAGE: { min: 3, max: 8 }, // Random keyword counts
};

// Generate massive user base
const users = Array.from({ length: CONFIG.USERS }, (_, i) => `user-${i + 1}`);

// Extended message corpus for variety
const messageCorpus = [
  // Technical terms
  "javascript",
  "typescript",
  "react",
  "nodejs",
  "docker",
  "kubernetes",
  "microservices",
  "api",
  "rest",
  "graphql",
  "websocket",
  "redis",
  "postgresql",
  "mongodb",
  "elasticsearch",
  "aws",
  "azure",
  "gcp",
  "terraform",
  "ansible",
  "jenkins",
  "gitlab",
  "github",

  // Chat phrases
  "hello there",
  "hi everyone",
  "good morning",
  "how are you",
  "nice to meet you",
  "great idea",
  "excellent point",
  "I agree",
  "that makes sense",
  "interesting thought",
  "let me think",
  "good question",
  "thanks for sharing",
  "appreciate it",
  "well done",

  // Development terms
  "code review",
  "pull request",
  "merge conflict",
  "deployment",
  "production",
  "staging",
  "testing",
  "unit tests",
  "integration tests",
  "ci/cd",
  "pipeline",
  "build",
  "release",
  "version control",
  "branch",
  "commit",
  "push",
  "pull",
  "clone",
  "fork",

  // Business terms
  "strategy",
  "planning",
  "execution",
  "delivery",
  "timeline",
  "deadline",
  "milestone",
  "stakeholder",
  "requirements",
  "specification",
  "documentation",
  "training",
  "support",
  "maintenance",
  "monitoring",
  "analytics",
  "metrics",
  "performance",
  "scalability",

  // Random filler words
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
  "this",
  "that",
  "these",
  "those",
  "here",
  "there",
  "where",
  "when",
  "why",
  "how",
];

// Performance tracking
let stats = {
  totalMessages: 0,
  totalUsers: 0,
  startTime: Date.now(),
  messageRates: [],
  userRates: [],
};

// Connection pool for better performance
const connections = new Map();
const MAX_CONCURRENT_CONNECTIONS = 1000; // Limit concurrent connections to prevent overwhelming

console.log(
  `📊 Target: ${CONFIG.MESSAGES_PER_SEC.toLocaleString()} messages/sec`
);
console.log(`👥 Users: ${CONFIG.USERS.toLocaleString()}`);
console.log(
  `🔌 Max Connections: ${MAX_CONCURRENT_CONNECTIONS.toLocaleString()}`
);

// Create connection pool
async function createConnections() {
  console.log("🔌 Creating connection pool...");

  for (let i = 0; i < Math.min(CONFIG.USERS, MAX_CONCURRENT_CONNECTIONS); i++) {
    const socket = io("http://localhost:3001", {
      transports: ["websocket"], // Force WebSocket for better performance
      timeout: 20000,
      forceNew: true,
    });

    socket.on("connect", () => {
      connections.set(i, socket);
    });

    socket.on("connect_error", (error) => {
      console.error(`Connection ${i} failed:`, error.message);
    });

    // Add small delay to prevent overwhelming the server
    if (i % 100 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  console.log(`✅ Created ${connections.size} connections`);
}

// Generate random message
function generateMessage() {
  const wordCount =
    Math.floor(
      Math.random() *
        (CONFIG.MESSAGE_LENGTH.max - CONFIG.MESSAGE_LENGTH.min + 1)
    ) + CONFIG.MESSAGE_LENGTH.min;

  const message = [];
  for (let i = 0; i < wordCount; i++) {
    message.push(
      messageCorpus[Math.floor(Math.random() * messageCorpus.length)]
    );
  }

  return message.join(" ");
}

// Send message burst
function sendMessageBurst() {
  const burstSize = CONFIG.BURST_SIZE;
  const activeConnections = Array.from(connections.values()).filter(
    (socket) => socket.connected
  );

  if (activeConnections.length === 0) return;

  for (let i = 0; i < burstSize; i++) {
    const randomSocket =
      activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const message = generateMessage();

    randomSocket.emit("message_sent", { userId: randomUser, text: message });
    stats.totalMessages++;
  }
}

// Simulate user activity
function simulateUserActivity() {
  const activeConnections = Array.from(connections.values()).filter(
    (socket) => socket.connected
  );

  if (activeConnections.length === 0) return;

  // Random user joins/leaves
  if (Math.random() < 0.1) {
    // 10% chance each interval
    const randomSocket =
      activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    if (Math.random() > 0.5) {
      randomSocket.emit("user_joined", { userId: randomUser });
      stats.totalUsers++;
    } else {
      randomSocket.emit("user_left", { userId: randomUser });
      stats.totalUsers = Math.max(0, stats.totalUsers - 1);
    }
  }
}

// Performance monitoring
function logPerformance() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const currentRate = (stats.totalMessages / elapsed).toFixed(0);
  const avgRate = (stats.totalMessages / elapsed).toFixed(0);

  // Store rates for averaging
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
    }`
  );

  // Performance alerts
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.8) {
    console.log(
      `⚠️  Performance warning: Current rate (${currentRate}) below target (${CONFIG.MESSAGES_PER_SEC})`
    );
  }
}

// Main simulation loop
async function startSimulation() {
  await createConnections();

  console.log("🎯 Starting message simulation...");
  console.log("Press Ctrl+C to stop");

  // Message burst loop
  setInterval(sendMessageBurst, CONFIG.BURST_INTERVAL);

  // User activity loop
  setInterval(simulateUserActivity, 1000 / CONFIG.USER_JOIN_RATE);

  // Performance logging
  setInterval(logPerformance, 1000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping massive simulation...");
    console.log(`📈 Final Stats:`);
    console.log(`   Total Messages: ${stats.totalMessages.toLocaleString()}`);
    console.log(`   Total Users: ${stats.totalUsers.toLocaleString()}`);
    console.log(
      `   Duration: ${((Date.now() - stats.startTime) / 1000).toFixed(1)}s`
    );
    console.log(
      `   Average Rate: ${(
        stats.totalMessages /
        ((Date.now() - stats.startTime) / 1000)
      ).toFixed(0)} msg/s`
    );

    // Close all connections
    connections.forEach((socket) => socket.disconnect());
    process.exit(0);
  });
}

// Start the simulation
startSimulation().catch(console.error);
