const { io } = require("socket.io-client");
console.log("🔥 Starting EXTREME Surge Simulation...");
const BACKEND_INSTANCES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];
const CONFIG = {
  TOTAL_USERS: 10000,
  USERS_PER_INSTANCE: 3333,
  MESSAGES_PER_SEC: 50000,
  BURST_SIZE: 500,
  BURST_INTERVAL: 10,
  USER_JOIN_RATE: 200,
  MESSAGE_LENGTH: { min: 5, max: 200 },
  CONNECTION_BATCH_SIZE: 500,
  CONNECTION_DELAY: 5,
  MAX_CONCURRENT_CONNECTIONS: 2000,
};
const users = Array.from(
  { length: CONFIG.TOTAL_USERS },
  (_, i) => `extreme-user-${i + 1}`
);
const connections = new Map();
let currentInstance = 0;
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
      stats.errors++;
      if (stats.errors % 100 === 0) {
        console.error(`❌ ${stats.errors} connection errors so far`);
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
  }
  console.log(`✅ Created ${connections.size} connections`);
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
  const message = [];
  for (let i = 0; i < wordCount; i++) {
    message.push(
      messageCorpus[Math.floor(Math.random() * messageCorpus.length)]
    );
  }
  return message.join(" ");
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
      stats.lastMinuteMessages++;
      burstMessages++;
    } catch (error) {
      stats.errors++;
    }
  }
  if (stats.totalMessages % 10000 === 0) {
    console.log(`💥 Burst sent: ${burstMessages} messages`);
  }
}
function simulateUserActivity() {
  const activeConnections = Array.from(connections.values()).filter(
    (connection) => connection.socket.connected
  );
  if (activeConnections.length === 0) return;
  const activityChance = 0.15;
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
function logPerformance() {
  const elapsed = Date.now() - stats.startTime;
  const elapsedSeconds = elapsed / 1000;
  const currentRate = (stats.totalMessages / elapsedSeconds).toFixed(0);
  const lastMinuteRate = (stats.lastMinuteMessages / 60).toFixed(0);
  stats.messageRates.push(parseInt(currentRate));
  if (stats.messageRates.length > 20) stats.messageRates.shift();
  const avgRateOverTime = (
    stats.messageRates.reduce((a, b) => a + b, 0) / stats.messageRates.length
  ).toFixed(0);
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
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.7) {
    console.log(
      `⚠️ Performance warning: Current rate (${currentRate}) below 70% of target (${CONFIG.MESSAGES_PER_SEC})`
    );
  }
  if (stats.errors > 1000) {
    console.log(`🚨 High error rate: ${stats.errors} errors detected`);
  }
}
async function startSimulation() {
  console.log("🚀 Starting extreme simulation...");
  console.log(
    `📊 Target: ${CONFIG.TOTAL_USERS} users across ${BACKEND_INSTANCES.length} backends`
  );
  console.log(`💬 Messages: ${CONFIG.MESSAGES_PER_SEC} per second total`);
  await createConnections();
  if (connections.size > 0) {
    setInterval(sendMessageBurst, CONFIG.BURST_INTERVAL);
    setInterval(simulateUserActivity, 1000 / CONFIG.USER_JOIN_RATE);
    setInterval(logPerformance, 1000);
    console.log("✅ Simulation running! Press Ctrl+C to stop");
  } else {
    console.log("❌ No connections established");
  }
}
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
  for (const [userId, connection] of connections.entries()) {
    if (connection.socket.connected) {
      connection.socket.disconnect();
    }
  }
  process.exit(0);
});
startSimulation().catch(console.error);
