const { io } = require("socket.io-client");

console.log("🔥 Starting EXTREME ChatPulse Simulation...");
console.log("This will generate maximum possible load - use with caution!");

// EXTREME Configuration - adjust these carefully
const CONFIG = {
  USERS: 10000, // 10,000 simulated users
  MESSAGES_PER_SEC: 50000, // 50,000 messages per second target
  BURST_SIZE: 500, // 500 messages per burst
  BURST_INTERVAL: 10, // 10ms between bursts = 100 bursts/sec * 500 msgs = 50k/sec
  USER_JOIN_RATE: 200, // 200 users join/leave per second
  MESSAGE_LENGTH: { min: 5, max: 200 }, // Varied message lengths
  CONNECTION_BATCH_SIZE: 500, // Create connections in batches
  CONNECTION_DELAY: 5, // 5ms between connection batches
  MAX_CONCURRENT_CONNECTIONS: 2000, // Limit to prevent system overload
};

// Generate massive user base
const users = Array.from(
  { length: CONFIG.USERS },
  (_, i) => `extreme-user-${i + 1}`
);

// Massive message corpus
const messageCorpus = [
  // Technical terms (expanded)
  "javascript",
  "typescript",
  "react",
  "vue",
  "angular",
  "nodejs",
  "deno",
  "bun",
  "docker",
  "kubernetes",
  "helm",
  "istio",
  "linkerd",
  "microservices",
  "serverless",
  "lambda",
  "functions",
  "api",
  "rest",
  "graphql",
  "grpc",
  "websocket",
  "sse",
  "webhook",
  "redis",
  "memcached",
  "postgresql",
  "mysql",
  "mongodb",
  "cassandra",
  "elasticsearch",
  "opensearch",
  "influxdb",
  "timescaledb",
  "aws",
  "azure",
  "gcp",
  "digitalocean",
  "linode",
  "vultr",
  "terraform",
  "pulumi",
  "ansible",
  "chef",
  "puppet",
  "salt",
  "jenkins",
  "gitlab",
  "github",
  "bitbucket",
  "circleci",
  "travisci",
  "github-actions",
  "gitlab-ci",
  "azure-devops",

  // Development workflow
  "code review",
  "pull request",
  "merge request",
  "merge conflict",
  "rebase",
  "squash",
  "cherry-pick",
  "hotfix",
  "release",
  "deployment",
  "production",
  "staging",
  "development",
  "testing",
  "qa",
  "uat",
  "preprod",
  "canary",
  "blue-green",
  "unit tests",
  "integration tests",
  "e2e tests",
  "performance tests",
  "load tests",
  "stress tests",
  "chaos engineering",
  "ci/cd",
  "continuous integration",
  "continuous deployment",
  "continuous delivery",
  "pipeline",
  "workflow",
  "build",
  "compile",
  "version control",
  "git",
  "svn",
  "mercurial",
  "branch",
  "tag",
  "commit",
  "push",
  "pull",
  "clone",
  "fork",
  "upstream",

  // Business and operations
  "strategy",
  "planning",
  "execution",
  "delivery",
  "timeline",
  "deadline",
  "milestone",
  "sprint",
  "iteration",
  "agile",
  "scrum",
  "stakeholder",
  "product owner",
  "scrum master",
  "developer",
  "engineer",
  "architect",
  "devops",
  "sre",
  "qa engineer",
  "requirements",
  "user story",
  "acceptance criteria",
  "definition of done",
  "backlog",
  "sprint backlog",
  "product backlog",
  "specification",
  "documentation",
  "api docs",
  "swagger",
  "openapi",
  "readme",
  "wiki",
  "confluence",
  "notion",
  "training",
  "onboarding",
  "knowledge transfer",
  "mentoring",
  "pair programming",
  "code review",
  "tech talk",
  "workshop",
  "support",
  "maintenance",
  "monitoring",
  "alerting",
  "logging",
  "tracing",
  "metrics",
  "kpis",
  "dashboards",
  "grafana",
  "analytics",
  "business intelligence",
  "data warehouse",
  "data lake",
  "etl",
  "elt",
  "data pipeline",
  "machine learning",

  // Performance and scalability
  "performance",
  "scalability",
  "throughput",
  "latency",
  "response time",
  "tps",
  "qps",
  "concurrent users",
  "load balancing",
  "caching",
  "cdn",
  "edge computing",
  "distributed systems",
  "microservices",
  "service mesh",
  "circuit breaker",
  "retry",
  "timeout",
  "rate limiting",
  "throttling",
  "queuing",
  "message broker",
  "kafka",
  "rabbitmq",
  "redis pub/sub",
  "event streaming",
  "database sharding",
  "read replicas",
  "write replicas",
  "master-slave",
  "primary-secondary",
  "consistency",
  "availability",

  // Security and compliance
  "security",
  "authentication",
  "authorization",
  "oauth",
  "jwt",
  "saml",
  "mfa",
  "2fa",
  "encryption",
  "hashing",
  "bcrypt",
  "ssl",
  "tls",
  "https",
  "certificates",
  "pki",
  "vpn",
  "firewall",
  "waf",
  "ddos protection",
  "rate limiting",
  "compliance",
  "gdpr",
  "ccpa",
  "sox",
  "hipaa",
  "pci-dss",
  "audit",
  "logging",
  "monitoring",
  "alerting",

  // Random filler and conversational
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
  "of",
  "about",
  "against",
  "between",
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
  "what",
  "which",
  "who",
  "whom",
  "hello",
  "hi",
  "hey",
  "good morning",
  "good afternoon",
  "good evening",
  "how are you",
  "nice to meet you",
  "pleasure",
  "great",
  "excellent",
  "amazing",
  "wonderful",
  "fantastic",
  "brilliant",
  "outstanding",
  "superb",
  "terrific",
  "awesome",
  "agree",
  "disagree",
  "understand",
  "comprehend",
  "grasp",
  "follow",
  "get it",
  "make sense",
  "logical",
  "reasonable",
  "think",
  "believe",
  "feel",
  "know",
  "understand",
  "realize",
  "recognize",
  "identify",
  "determine",
  "decide",
  "question",
  "ask",
  "wonder",
  "curious",
  "interested",
  "fascinated",
  "intrigued",
  "excited",
  "enthusiastic",
  "passionate",
];

// Performance tracking with detailed metrics
let stats = {
  totalMessages: 0,
  totalUsers: 0,
  startTime: Date.now(),
  messageRates: [],
  userRates: [],
  connectionCount: 0,
  errors: 0,
  lastMinuteMessages: 0,
  lastMinuteStart: Date.now(),
};

// Connection pool with performance optimization
const connections = new Map();
let connectionCreationInProgress = false;

console.log(
  `📊 Target: ${CONFIG.MESSAGES_PER_SEC.toLocaleString()} messages/sec`
);
console.log(`👥 Users: ${CONFIG.USERS.toLocaleString()}`);
console.log(
  `🔌 Max Connections: ${CONFIG.MAX_CONCURRENT_CONNECTIONS.toLocaleString()}`
);
console.log(`💥 Burst Size: ${CONFIG.BURST_SIZE.toLocaleString()}`);
console.log(`⚡ Burst Interval: ${CONFIG.BURST_INTERVAL}ms`);

// Create connections in batches for better performance
async function createConnections() {
  if (connectionCreationInProgress) return;
  connectionCreationInProgress = true;

  console.log("🔌 Creating connection pool in batches...");

  const totalConnections = Math.min(
    CONFIG.USERS,
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

    for (let i = start; i < end; i++) {
      const socket = io("http://localhost:3001", {
        transports: ["websocket"],
        timeout: 30000,
        forceNew: true,
        reconnection: false, // Disable reconnection for cleaner testing
      });

      socket.on("connect", () => {
        connections.set(i, socket);
        stats.connectionCount = connections.size;
      });

      socket.on("connect_error", (error) => {
        stats.errors++;
        if (stats.errors % 100 === 0) {
          console.error(`❌ ${stats.errors} connection errors so far`);
        }
      });

      socket.on("error", (error) => {
        stats.errors++;
      });
    }

    // Wait between batches to prevent overwhelming
    if (batch < batches - 1) {
      await new Promise((resolve) =>
        setTimeout(resolve, CONFIG.CONNECTION_DELAY)
      );
    }
  }

  connectionCreationInProgress = false;
  console.log(`✅ Created ${connections.size} connections`);
}

// Generate random message with varied complexity
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

// Send message burst with error handling
function sendMessageBurst() {
  const burstSize = CONFIG.BURST_SIZE;
  const activeConnections = Array.from(connections.values()).filter(
    (socket) => socket.connected
  );

  if (activeConnections.length === 0) return;

  let burstMessages = 0;

  for (let i = 0; i < burstSize; i++) {
    try {
      const randomSocket =
        activeConnections[Math.floor(Math.random() * activeConnections.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const message = generateMessage();

      randomSocket.emit("message_sent", { userId: randomUser, text: message });
      stats.totalMessages++;
      stats.lastMinuteMessages++;
      burstMessages++;
    } catch (error) {
      stats.errors++;
    }
  }

  // Log burst performance
  if (stats.totalMessages % 10000 === 0) {
    console.log(`💥 Burst sent: ${burstMessages} messages`);
  }
}

// Simulate user activity with realistic patterns
function simulateUserActivity() {
  const activeConnections = Array.from(connections.values()).filter(
    (socket) => socket.connected
  );

  if (activeConnections.length === 0) return;

  // Simulate user joins/leaves with realistic patterns
  const activityChance = 0.15; // 15% chance each interval

  if (Math.random() < activityChance) {
    const randomSocket =
      activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];

    if (Math.random() > 0.6) {
      // 40% join, 60% leave (realistic chat behavior)
      randomSocket.emit("user_joined", { userId: randomUser });
      stats.totalUsers++;
    } else {
      randomSocket.emit("user_left", { userId: randomUser });
      stats.totalUsers = Math.max(0, stats.totalUsers - 1);
    }
  }
}

// Advanced performance monitoring
function logPerformance() {
  const elapsed = Date.now() - stats.startTime;
  const elapsedSeconds = elapsed / 1000;

  // Current rate calculations
  const currentRate = (stats.totalMessages / elapsedSeconds).toFixed(0);
  const lastMinuteRate = (stats.lastMinuteMessages / 60).toFixed(0);

  // Store rates for averaging
  stats.messageRates.push(parseInt(currentRate));
  if (stats.messageRates.length > 20) stats.messageRates.shift();

  const avgRateOverTime = (
    stats.messageRates.reduce((a, b) => a + b, 0) / stats.messageRates.length
  ).toFixed(0);

  // Reset last minute counter
  if (elapsedSeconds >= 60) {
    stats.lastMinuteMessages = 0;
    stats.lastMinuteStart = Date.now();
  }

  console.log(
    `📊 ${stats.totalMessages.toLocaleString()} messages in ${elapsedSeconds.toFixed(
      1
    )}s | Current: ${currentRate} msg/s | Last Min: ${lastMinuteRate} msg/s | Avg: ${avgRateOverTime} msg/s | Users: ${
      stats.totalUsers
    } | Connections: ${stats.connectionCount} | Errors: ${stats.errors}`
  );

  // Performance alerts
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.7) {
    console.log(
      `⚠️  Performance warning: Current rate (${currentRate}) below 70% of target (${CONFIG.MESSAGES_PER_SEC})`
    );
  }

  if (stats.errors > 1000) {
    console.log(`🚨 High error rate: ${stats.errors} errors detected`);
  }
}

// Main simulation loop
async function startSimulation() {
  await createConnections();

  console.log("🎯 Starting extreme message simulation...");
  console.log("Press Ctrl+C to stop");

  // Message burst loop
  setInterval(sendMessageBurst, CONFIG.BURST_INTERVAL);

  // User activity loop
  setInterval(simulateUserActivity, 1000 / CONFIG.USER_JOIN_RATE);

  // Performance logging
  setInterval(logPerformance, 1000);

  // Graceful shutdown
  process.on("SIGINT", () => {
    const elapsed = Date.now() - stats.startTime;
    const elapsedSeconds = elapsed / 1000;

    console.log("\n🛑 Stopping extreme simulation...");
    console.log(`📈 Final Stats:`);
    console.log(`   Total Messages: ${stats.totalMessages.toLocaleString()}`);
    console.log(`   Total Users: ${stats.totalUsers.toLocaleString()}`);
    console.log(`   Duration: ${elapsedSeconds.toFixed(1)}s`);
    console.log(
      `   Average Rate: ${(stats.totalMessages / elapsedSeconds).toFixed(
        0
      )} msg/s`
    );
    console.log(`   Peak Rate: ${Math.max(...stats.messageRates)} msg/s`);
    console.log(`   Total Errors: ${stats.errors}`);
    console.log(`   Final Connections: ${stats.connectionCount}`);

    // Close all connections
    connections.forEach((socket) => socket.disconnect());
    process.exit(0);
  });
}

// Start the simulation
startSimulation().catch(console.error);
