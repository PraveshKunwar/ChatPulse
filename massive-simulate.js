const { io } = require("socket.io-client");
console.log("🚀 Starting MASSIVE Surge Simulation...");
const BACKEND_INSTANCES = [
  "http://localhost:3001",
  "http://localhost:3002",
  "http://localhost:3003",
];
const CONFIG = {
  TOTAL_USERS: 8000,
  USERS_PER_INSTANCE: 2666,
  MESSAGES_PER_SEC: 25000,
  BURST_SIZE: 250,
  BURST_INTERVAL: 20,
  USER_JOIN_RATE: 100,
  MESSAGE_LENGTH: { min: 3, max: 100 },
  CONNECTION_BATCH_SIZE: 100,
  CONNECTION_DELAY: 5,
  MAX_CONCURRENT_CONNECTIONS: 8000,
};
const users = Array.from(
  { length: CONFIG.TOTAL_USERS },
  (_, i) => `massive-user-${i + 1}`
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
      stats.successfulConnections++;
      if (stats.successfulConnections % 200 === 0) {
        console.log(`✅ Connected: ${stats.successfulConnections} users`);
      }
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
    "performance",
    "scalability",
    "throughput",
    "latency",
    "response time",
    "load balancing",
    "caching",
    "cdn",
    "edge computing",
    "distributed systems",
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
    "consistency",
    "availability",
    "security",
    "authentication",
    "authorization",
    "oauth",
    "jwt",
    "encryption",
    "hashing",
    "ssl",
    "tls",
    "https",
    "certificates",
    "firewall",
    "ddos protection",
    "compliance",
    "gdpr",
    "audit",
    "monitoring",
    "alerting",
    "logging",
    "tracing",
    "metrics",
    "kpis",
    "dashboards",
    "analytics",
    "business intelligence",
    "data warehouse",
    "data lake",
    "etl",
    "data pipeline",
    "machine learning",
    "artificial intelligence",
    "deep learning",
    "neural networks",
    "algorithms",
    "data structures",
    "optimization",
    "efficiency",
    "reliability",
    "fault tolerance",
    "high availability",
    "disaster recovery",
    "backup",
    "replication",
    "synchronization",
    "consistency",
    "partitioning",
    "sharding",
    "clustering",
    "load balancing",
    "auto scaling",
    "elastic scaling",
    "horizontal scaling",
    "vertical scaling",
    "capacity planning",
    "resource management",
    "memory management",
    "garbage collection",
    "performance tuning",
    "optimization",
    "profiling",
    "benchmarking",
    "testing",
    "unit testing",
    "integration testing",
    "end-to-end testing",
    "performance testing",
    "load testing",
    "stress testing",
    "chaos engineering",
    "reliability testing",
    "security testing",
    "penetration testing",
    "vulnerability assessment",
    "risk assessment",
    "threat modeling",
    "security architecture",
    "defense in depth",
    "zero trust",
    "identity management",
    "access control",
    "role-based access control",
    "attribute-based access control",
    "multi-factor authentication",
    "single sign-on",
    "federation",
    "saml",
    "oauth",
    "openid connect",
    "jwt",
    "token management",
    "session management",
    "cookie management",
    "csrf protection",
    "xss protection",
    "sql injection protection",
    "input validation",
    "output encoding",
    "secure coding",
    "code review",
    "static analysis",
    "dynamic analysis",
    "dependency scanning",
    "vulnerability scanning",
    "container security",
    "image scanning",
    "runtime security",
    "network security",
    "endpoint security",
    "data protection",
    "encryption at rest",
    "encryption in transit",
    "key management",
    "certificate management",
    "pki",
    "digital signatures",
    "hashing",
    "salting",
    "bcrypt",
    "argon2",
    "scrypt",
    "pbkdf2",
    "hmac",
    "aes",
    "rsa",
    "elliptic curve",
    "quantum cryptography",
    "post-quantum cryptography",
    "homomorphic encryption",
    "differential privacy",
    "secure multi-party computation",
    "zero-knowledge proofs",
    "blockchain",
    "distributed ledger",
    "smart contracts",
    "consensus algorithms",
    "proof of work",
    "proof of stake",
    "delegated proof of stake",
    "practical byzantine fault tolerance",
    "raft",
    "paxos",
    "gossip protocols",
    "event sourcing",
    "cqrs",
    "domain-driven design",
    "microservices architecture",
    "service-oriented architecture",
    "event-driven architecture",
    "hexagonal architecture",
    "clean architecture",
    "onion architecture",
    "layered architecture",
    "monolithic architecture",
    "modular monolith",
    "strangler fig pattern",
    "anti-corruption layer",
    "bounded context",
    "aggregate",
    "entity",
    "value object",
    "domain service",
    "repository pattern",
    "unit of work",
    "factory pattern",
    "builder pattern",
    "strategy pattern",
    "observer pattern",
    "command pattern",
    "query pattern",
    "mediator pattern",
    "facade pattern",
    "adapter pattern",
    "decorator pattern",
    "proxy pattern",
    "singleton pattern",
    "dependency injection",
    "inversion of control",
    "aspect-oriented programming",
    "functional programming",
    "object-oriented programming",
    "procedural programming",
    "declarative programming",
    "imperative programming",
    "reactive programming",
    "asynchronous programming",
    "concurrent programming",
    "parallel programming",
    "multithreading",
    "multiprocessing",
    "coroutines",
    "futures",
    "promises",
    "async/await",
    "generators",
    "iterators",
    "streams",
    "observables",
    "subjects",
    "operators",
    "transformations",
    "filtering",
    "mapping",
    "reducing",
    "aggregation",
    "grouping",
    "sorting",
    "searching",
    "indexing",
    "caching",
    "memoization",
    "lazy loading",
    "eager loading",
    "pagination",
    "virtualization",
    "windowing",
    "batching",
    "debouncing",
    "throttling",
    "rate limiting",
    "circuit breaking",
    "bulkhead pattern",
    "timeout pattern",
    "retry pattern",
    "exponential backoff",
    "jitter",
    "health checks",
    "liveness probes",
    "readiness probes",
    "graceful shutdown",
    "graceful degradation",
    "failover",
    "failback",
    "disaster recovery",
    "backup strategies",
    "replication strategies",
    "consistency models",
    "cap theorem",
    "acid properties",
    "base properties",
    "eventual consistency",
    "strong consistency",
    "weak consistency",
    "causal consistency",
    "sequential consistency",
    "linearizability",
    "serializability",
    "isolation levels",
    "transaction management",
    "distributed transactions",
    "two-phase commit",
    "three-phase commit",
    "saga pattern",
    "choreography",
    "orchestration",
    "compensating transactions",
    "outbox pattern",
    "inbox pattern",
    "event store",
    "snapshot",
    "projection",
    "read model",
    "write model",
    "command query separation",
    "event sourcing",
    "change data capture",
    "log-based replication",
    "stream processing",
    "batch processing",
    "lambda architecture",
    "kappa architecture",
    "data mesh",
    "data fabric",
    "data virtualization",
    "data integration",
    "etl",
    "elt",
    "reverse etl",
    "data pipeline",
    "data workflow",
    "data orchestration",
    "data governance",
    "data quality",
    "data lineage",
    "data catalog",
    "data dictionary",
    "metadata management",
    "schema evolution",
    "schema registry",
    "avro",
    "protobuf",
    "json schema",
    "xml schema",
    "relational model",
    "document model",
    "key-value model",
    "column-family model",
    "graph model",
    "time-series model",
    "wide-column model",
    "multi-model database",
    "polyglot persistence",
    "database per service",
    "shared database",
    "database sharding",
    "horizontal partitioning",
    "vertical partitioning",
    "consistent hashing",
    "range partitioning",
    "hash partitioning",
    "directory-based partitioning",
    "federation",
    "replication",
    "master-slave",
    "master-master",
    "primary-secondary",
    "active-passive",
    "active-active",
    "read replicas",
    "write replicas",
    "cascading replication",
    "circular replication",
    "star replication",
    "tree replication",
    "mesh replication",
    "gossip protocol",
    "vector clocks",
    "lamport timestamps",
    "logical clocks",
    "physical clocks",
    "ntp",
    "ptp",
    "time synchronization",
    "clock skew",
    "clock drift",
    "leap seconds",
    "time zones",
    "utc",
    "iso 8601",
    "epoch time",
    "unix timestamp",
    "nanosecond precision",
    "microsecond precision",
    "millisecond precision",
    "second precision",
    "minute precision",
    "hour precision",
    "day precision",
    "week precision",
    "month precision",
    "year precision",
    "decade precision",
    "century precision",
    "millennium precision",
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
      burstMessages++;
    } catch (error) {
      stats.errors++;
      if (stats.errors % 100 === 0) {
        console.log(`⚠️ Message errors: ${stats.errors}`);
      }
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
  const activityChance = 0.1;
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
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const currentRate = (stats.totalMessages / elapsed).toFixed(0);
  stats.messageRates.push(parseInt(currentRate));
  if (stats.messageRates.length > 15) stats.messageRates.shift();
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
    } | Errors: ${stats.errors}`
  );
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.6) {
    console.log(
      `⚠️ Performance warning: Current rate (${currentRate}) below 60% of target`
    );
  }
  if (stats.errors > 1000) {
    console.log(
      `🚨 High error rate: ${stats.errors} errors detected - consider stopping`
    );
  }
}
async function startSimulation() {
  console.log("🚀 Starting massive simulation...");
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
  console.log("\n🛑 Stopping massive simulation...");
  console.log(`📊 Final Stats:`);
  console.log(`   Messages: ${stats.totalMessages.toLocaleString()}`);
  console.log(`   Users: ${stats.totalUsers}`);
  console.log(`   Connections: ${stats.connectionCount}`);
  console.log(`   Successful Connections: ${stats.successfulConnections}`);
  console.log(`   Errors: ${stats.errors}`);
  for (const [userId, connection] of connections.entries()) {
    if (connection.socket.connected) {
      connection.socket.disconnect();
    }
  }
  process.exit(0);
});
startSimulation().catch(console.error);
