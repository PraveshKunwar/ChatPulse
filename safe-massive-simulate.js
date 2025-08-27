const { io } = require("socket.io-client");

console.log("🛡️  Starting SAFE Massive ChatPulse Simulation...");
console.log("This version is designed to test limits without crashing the system");

// SAFE Configuration - designed to test limits without breaking
const CONFIG = {
  USERS: 2000,                    // Reduced from 5000 to be safer
  MESSAGES_PER_SEC: 5000,         // Reduced from 10000 to be safer
  BURST_SIZE: 50,                 // Smaller bursts for stability
  BURST_INTERVAL: 20,             // 20ms between bursts = 50 bursts/sec * 50 msgs = 2.5k/sec
  USER_JOIN_RATE: 20,             // Reduced user activity rate
  MESSAGE_LENGTH: { min: 5, max: 50 }, // Shorter messages for efficiency
  CONNECTION_BATCH_SIZE: 100,     // Smaller batches
  CONNECTION_DELAY: 20,           // 20ms between batches
  MAX_CONCURRENT_CONNECTIONS: 500, // Reduced connection limit
  MEMORY_CHECK_INTERVAL: 5000,    // Check memory every 5 seconds
  MAX_MEMORY_USAGE: 500           // Max memory usage in MB before throttling
};

// Generate user base
const users = Array.from({ length: CONFIG.USERS }, (_, i) => `safe-user-${i + 1}`);

// Efficient message corpus
const messageCorpus = [
  // Core technical terms
  "javascript", "typescript", "react", "nodejs", "docker", "kubernetes", "redis",
  "api", "rest", "graphql", "websocket", "microservices", "aws", "azure", "gcp",
  
  // Development terms
  "code", "test", "build", "deploy", "git", "ci", "cd", "monitor", "log", "debug",
  
  // Chat phrases
  "hello", "hi", "good", "great", "thanks", "agree", "understand", "question",
  
  // Filler words
  "the", "and", "or", "but", "in", "on", "at", "to", "for", "with", "by", "from"
];

// Performance tracking with memory monitoring
let stats = {
  totalMessages: 0,
  totalUsers: 0,
  startTime: Date.now(),
  messageRates: [],
  connectionCount: 0,
  errors: 0,
  memoryWarnings: 0,
  throttledBursts: 0
};

// Connection pool with safety limits
const connections = new Map();
let connectionCreationInProgress = false;
let isThrottling = false;

console.log(`📊 Target: ${CONFIG.MESSAGES_PER_SEC.toLocaleString()} messages/sec`);
console.log(`👥 Users: ${CONFIG.USERS.toLocaleString()}`);
console.log(`🔌 Max Connections: ${CONFIG.MAX_CONCURRENT_CONNECTIONS.toLocaleString()}`);
console.log(`💥 Burst Size: ${CONFIG.BURST_SIZE.toLocaleString()}`);
console.log(`⚡ Burst Interval: ${CONFIG.BURST_INTERVAL}ms`);
console.log(`🛡️  Memory Limit: ${CONFIG.MAX_MEMORY_USAGE}MB`);

// Memory monitoring function
function checkMemoryUsage() {
  if (process.memoryUsage) {
    const memUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (heapUsedMB > CONFIG.MAX_MEMORY_USAGE) {
      console.log(`⚠️  Memory warning: ${heapUsedMB}MB used (limit: ${CONFIG.MAX_MEMORY_USAGE}MB)`);
      stats.memoryWarnings++;
      return true; // Memory usage is high
    }
  }
  return false; // Memory usage is OK
}

// Create connections safely
async function createConnections() {
  if (connectionCreationInProgress) return;
  connectionCreationInProgress = true;
  
  console.log("🔌 Creating connection pool safely...");
  
  const totalConnections = Math.min(CONFIG.USERS, CONFIG.MAX_CONCURRENT_CONNECTIONS);
  const batches = Math.ceil(totalConnections / CONFIG.CONNECTION_BATCH_SIZE);
  
  for (let batch = 0; batch < batches; batch++) {
    const start = batch * CONFIG.CONNECTION_BATCH_SIZE;
    const end = Math.min(start + CONFIG.CONNECTION_BATCH_SIZE, totalConnections);
    
    console.log(`📦 Creating batch ${batch + 1}/${batches} (connections ${start + 1}-${end})`);
    
    for (let i = start; i < end; i++) {
      const socket = io("http://localhost:3001", {
        transports: ["websocket"],
        timeout: 30000,
        forceNew: true,
        reconnection: false
      });
      
      socket.on("connect", () => {
        connections.set(i, socket);
        stats.connectionCount = connections.size;
      });
      
      socket.on("connect_error", (error) => {
        stats.errors++;
        if (stats.errors % 50 === 0) {
          console.error(`❌ ${stats.errors} connection errors so far`);
        }
      });
      
      socket.on("error", (error) => {
        stats.errors++;
      });
    }
    
    // Wait between batches
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, CONFIG.CONNECTION_DELAY));
    }
    
    // Check memory after each batch
    if (checkMemoryUsage()) {
      console.log("⏸️  Pausing connection creation due to memory usage");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  connectionCreationInProgress = false;
  console.log(`✅ Created ${connections.size} connections safely`);
}

// Generate efficient messages
function generateMessage() {
  const wordCount = Math.floor(Math.random() * 
    (CONFIG.MESSAGE_LENGTH.max - CONFIG.MESSAGE_LENGTH.min + 1)) + CONFIG.MESSAGE_LENGTH.min;
  
  const message = [];
  for (let i = 0; i < wordCount; i++) {
    message.push(messageCorpus[Math.floor(Math.random() * messageCorpus.length)]);
  }
  
  return message.join(" ");
}

// Send message burst with safety checks
function sendMessageBurst() {
  // Check if we should throttle
  if (isThrottling) {
    stats.throttledBursts++;
    return;
  }
  
  const burstSize = CONFIG.BURST_SIZE;
  const activeConnections = Array.from(connections.values()).filter(socket => socket.connected);
  
  if (activeConnections.length === 0) return;
  
  let burstMessages = 0;
  
  for (let i = 0; i < burstSize; i++) {
    try {
      const randomSocket = activeConnections[Math.floor(Math.random() * activeConnections.length)];
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const message = generateMessage();
      
      randomSocket.emit("message_sent", { userId: randomUser, text: message });
      stats.totalMessages++;
      burstMessages++;
    } catch (error) {
      stats.errors++;
    }
  }
  
  // Log burst performance
  if (stats.totalMessages % 5000 === 0) {
    console.log(`💥 Burst sent: ${burstMessages} messages`);
  }
}

// Simulate user activity safely
function simulateUserActivity() {
  const activeConnections = Array.from(connections.values()).filter(socket => socket.connected);
  
  if (activeConnections.length === 0) return;
  
  // Reduced activity rate
  const activityChance = 0.05; // 5% chance each interval
  
  if (Math.random() < activityChance) {
    const randomSocket = activeConnections[Math.floor(Math.random() * activeConnections.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    if (Math.random() > 0.7) { // 30% join, 70% leave
      randomSocket.emit("user_joined", { userId: randomUser });
      stats.totalUsers++;
    } else {
      randomSocket.emit("user_left", { userId: randomUser });
      stats.totalUsers = Math.max(0, stats.totalUsers - 1);
    }
  }
}

// Performance monitoring with safety checks
function logPerformance() {
  const elapsed = (Date.now() - stats.startTime) / 1000;
  const currentRate = (stats.totalMessages / elapsed).toFixed(0);
  
  // Store rates for averaging
  stats.messageRates.push(parseInt(currentRate));
  if (stats.messageRates.length > 10) stats.messageRates.shift();
  
  const avgRateOverTime = (stats.messageRates.reduce((a, b) => a + b, 0) / stats.messageRates.length).toFixed(0);
  
  console.log(`📊 ${stats.totalMessages.toLocaleString()} messages in ${elapsed.toFixed(1)}s | Current: ${currentRate} msg/s | Avg: ${avgRateOverTime} msg/s | Users: ${stats.totalUsers} | Connections: ${stats.connectionCount} | Errors: ${stats.errors} | Memory Warnings: ${stats.memoryWarnings}`);
  
  // Safety checks
  if (parseInt(currentRate) < CONFIG.MESSAGES_PER_SEC * 0.5) {
    console.log(`⚠️  Performance warning: Current rate (${currentRate}) below 50% of target`);
  }
  
  if (stats.errors > 500) {
    console.log(`🚨 High error rate: ${stats.errors} errors detected - consider stopping`);
  }
  
  if (stats.memoryWarnings > 10) {
    console.log(`💾 High memory usage warnings: ${stats.memoryWarnings} - system may be stressed`);
  }
}

// Memory monitoring
function monitorMemory() {
  if (checkMemoryUsage()) {
    console.log("🛡️  Activating throttling due to memory usage");
    isThrottling = true;
    
    // Resume after a delay
    setTimeout(() => {
      isThrottling = false;
      console.log("✅ Throttling deactivated");
    }, 10000); // 10 second throttle
  }
}

// Main simulation loop
async function startSimulation() {
  await createConnections();
  
  console.log("🎯 Starting safe massive simulation...");
  console.log("Press Ctrl+C to stop");
  
  // Message burst loop
  setInterval(sendMessageBurst, CONFIG.BURST_INTERVAL);
  
  // User activity loop
  setInterval(simulateUserActivity, 1000 / CONFIG.USER_JOIN_RATE);
  
  // Performance logging
  setInterval(logPerformance, 1000);
  
  // Memory monitoring
  setInterval(monitorMemory, CONFIG.MEMORY_CHECK_INTERVAL);
  
  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping safe massive simulation...");
    console.log(`📈 Final Stats:`);
    console.log(`   Total Messages: ${stats.totalMessages.toLocaleString()}`);
    console.log(`   Total Users: ${stats.totalUsers.toLocaleString()}`);
    console.log(`   Duration: ${((Date.now() - stats.startTime) / 1000).toFixed(1)}s`);
    console.log(`   Average Rate: ${(stats.totalMessages / ((Date.now() - stats.startTime) / 1000)).toFixed(0)} msg/s`);
    console.log(`   Total Errors: ${stats.errors}`);
    console.log(`   Memory Warnings: ${stats.memoryWarnings}`);
    console.log(`   Throttled Bursts: ${stats.throttledBursts}`);
    
    // Close all connections
    connections.forEach(socket => socket.disconnect());
    process.exit(0);
  });
}

// Start the simulation
startSimulation().catch(console.error);
