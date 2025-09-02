const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("redis");

const app = express();

// Add CORS middleware for HTTP endpoints
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 2e5,
  pingTimeout: 15000,
  pingInterval: 6000,
  upgradeTimeout: 3000,
  allowUpgrades: true,
  transports: ["websocket"],
  allowRequest: (req, callback) => {
    const clientIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    callback(null, true);
  },
  perMessageDeflate: false,
  connectTimeout: 10000,
});

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = Redis.createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 3000,
    keepAlive: 15000,
    reconnectStrategy: (retries) => Math.min(retries * 30, 300),
  },
});

redisClient
  .connect()
  .then(() => {
    console.log("✅ Redis connected successfully");
  })
  .catch((error) => {
    console.error("❌ Redis connection failed:", error);
  });

redisClient.on("error", (error) => {
  console.error("❌ Redis error:", error);
});

redisClient.on("connect", () => {
  console.log("✅ Redis connected");
});

redisClient.on("ready", async () => {
  console.log("✅ Redis ready");

  try {
    await redisClient.configSet("save", "");
    await redisClient.configSet("appendonly", "no");
    console.log("🚀 Redis persistence disabled for testing");
  } catch (error) {
    console.log("⚠️  Could not disable Redis persistence:", error.message);
  }
  redisClient
    .flushDb()
    .then(() => {
      console.log("🧹 Cleared Redis database on startup");
    })
    .catch(console.error);
});

const activeUsers = new Map();
const userSockets = new Map();

setInterval(() => {
  let cleanedCount = 0;
  const now = Date.now();
  const staleThreshold = 60000; // 1 minute

  for (const [socketId, userId] of userSockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
      userSockets.delete(socketId);
      activeUsers.delete(userId);
      cleanedCount++;
    } else if (
      socket.lastActivity &&
      now - socket.lastActivity > staleThreshold
    ) {
      // Force disconnect stale connections
      console.log(`🔄 Disconnecting stale connection: ${userId}`);
      socket.disconnect(true);
      userSockets.delete(socketId);
      activeUsers.delete(userId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} zombie/stale connections`);
  }

  if (process.memoryUsage().heapUsed > 400 * 1024 * 1024) {
    global.gc && global.gc();
    console.log("🧠 Forced garbage collection");
  }
}, 1500);

let messageCount = 0;
let lastMetricsTime = Date.now();

setInterval(async () => {
  try {
    const now = Date.now();
    const elapsed = (now - lastMetricsTime) / 1000;

    const count = await redisClient.get("messages_count");

    const keywords = await redisClient.zRange("keywords", 0, 9, {
      WITHSCORES: true,
    });

    const keywordsObj = {};
    if (keywords.length > 0) {
      for (const keyword of keywords) {
        try {
          const score = await redisClient.zScore("keywords", keyword);
          if (score !== null) {
            keywordsObj[keyword] = parseInt(score);
          }
        } catch (error) {
          console.error(`Error getting score for ${keyword}:`, error);
        }
      }
    }

    const messagesPerSec = Math.round((parseInt(count) || 0) / elapsed);

    io.emit("metrics", {
      messagesPerSec,
      activeUsers: activeUsers.size,
      keywords: keywordsObj,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    });

    await redisClient.set("messages_count", 0);
    messageCount = 0;
    lastMetricsTime = now;
  } catch (error) {
    console.error("Error collecting metrics:", error);
  }
}, 1000);

io.on("connection", (socket) => {
  const currentConnections = io.engine.clientsCount;
  const maxConnections = parseInt(process.env.MAX_CONNECTIONS) || 4000;

  if (currentConnections > maxConnections) {
    console.log(
      `🚫 Connection limit reached (${currentConnections}/${maxConnections}), rejecting ${socket.id}`
    );
    socket.disconnect(true);
    return;
  }

  console.log(
    `User connected: ${socket.id} (${currentConnections}/${maxConnections})`
  );

  // Force cleanup of rejected connections
  socket.on("disconnect", () => {
    if (io.engine.clientsCount > 4500) {
      console.log(`🧹 Cleaning up rejected connection ${socket.id}`);
    }
  });

  const connectionTimeout = setTimeout(() => {
    if (!userSockets.has(socket.id)) {
      socket.disconnect();
    }
  }, 30000);

  socket.on("user_joined", ({ userId }) => {
    clearTimeout(connectionTimeout);

    activeUsers.set(userId, socket.id);
    userSockets.set(socket.id, userId);

    io.emit("metrics", { activeUsers: activeUsers.size });

    console.log(`User ${userId} joined (${activeUsers.size} total)`);
  });

  socket.on("message_sent", async ({ userId, text }) => {
    try {
      await redisClient.incr("messages_count");
      messageCount++;

      if (text && text.length > 0) {
        const words = text
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 2 && word.length < 50);

        const batchSize = 10;
        for (let i = 0; i < words.length; i += batchSize) {
          const batch = words.slice(i, i + batchSize);
          await Promise.all(
            batch.map((word) => redisClient.zIncrBy("keywords", 1, word))
          );
        }

        const testKeywords = await redisClient.zRange("keywords", 0, 2, {
          WITHSCORES: true,
        });
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  socket.on("user_left", ({ userId }) => {
    const socketId = activeUsers.get(userId);
    if (socketId) {
      activeUsers.delete(userId);
      userSockets.delete(socketId);
    }

    io.emit("metrics", { activeUsers: activeUsers.size });
    console.log(`User ${userId} left (${activeUsers.size} total)`);
  });

  socket.on("ping", ({ userId, timestamp }) => {
    // Respond to ping with pong to keep connection alive
    socket.emit("pong", { userId, timestamp, serverTime: Date.now() });
  });

  socket.on("user_activity", ({ userId, timestamp, type }) => {
    // Handle keep-alive activity
    if (type === "keepalive") {
      // Update user's last activity time
      socket.lastActivity = Date.now();
    }
  });

  socket.on("disconnect", () => {
    const userId = userSockets.get(socket.id);
    if (userId) {
      activeUsers.delete(userId);
      userSockets.delete(socket.id);
      io.emit("metrics", { activeUsers: activeUsers.size });
      console.log(`User ${userId} disconnected (${activeUsers.size} total)`);
    }

    clearTimeout(connectionTimeout);
  });

  socket.on("error", (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

app.get("/health", (req, res) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  res.json({
    status: heapUsedMB > 400 ? "warning" : "ok", // Alert if over 400MB
    timestamp: new Date().toISOString(),
    memory: {
      rss: Math.round(memUsage.rss / 1024 / 1024) + " MB",
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + " MB",
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + " MB",
      external: Math.round(memUsage.external / 1024 / 1024) + " MB",
    },
    connections: {
      activeUsers: activeUsers.size,
      totalSockets: io.engine.clientsCount,
      maxConnections: 3000, // # of max connections
    },
    uptime: process.uptime(),
    memoryPressure: heapUsedMB > 300 ? "high" : "normal",
  });
});

app.get("/memory", (req, res) => {
  const memUsage = process.memoryUsage();
  res.json({
    memory: memUsage,
    uptime: process.uptime(),
    activeUsers: activeUsers.size,
    totalSockets: io.engine.clientsCount,
  });
});

app.get("/debug/keywords", async (req, res) => {
  try {
    const keywords = await redisClient.zRange("keywords", 0, -1, {
      WITHSCORES: true,
    });
    const keywordsObj = {};
    for (let i = 0; i < keywords.length; i += 2) {
      const key = keywords[i];
      const score = keywords[i + 1];
      if (key && score !== undefined) {
        keywordsObj[key] = parseInt(score);
      }
    }
    res.json({
      keywords: keywordsObj,
      raw: keywords,
      count: keywords.length / 2,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/cleanup", (req, res) => {
  let cleanedCount = 0;

  for (const [socketId, userId] of userSockets.entries()) {
    if (!io.sockets.sockets.has(socketId)) {
      userSockets.delete(socketId);
      activeUsers.delete(userId);
      cleanedCount++;
    }
  }

  if (global.gc) global.gc();

  res.json({
    message: `Cleaned up ${cleanedCount} zombie connections`,
    activeUsers: activeUsers.size,
    totalSockets: io.engine.clientsCount,
    memory: process.memoryUsage(),
  });
});

app.get("/nuclear-cleanup", (req, res) => {
  const beforeCount = io.engine.clientsCount;

  for (const [socketId, userId] of userSockets.entries()) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
  }

  userSockets.clear();
  activeUsers.clear();

  if (global.gc) global.gc();

  const afterCount = io.engine.clientsCount;

  res.json({
    message: `Nuclear cleanup: ${beforeCount} → ${afterCount} connections`,
    activeUsers: activeUsers.size,
    totalSockets: io.engine.clientsCount,
    memory: process.memoryUsage(),
  });
});

app.get("/reset", async (req, res) => {
  try {
    await redisClient.flushDb();
    messageCount = 0;
    lastMetricsTime = Date.now();

    res.json({
      message: "Redis database cleared",
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ Add aggregated metrics endpoint
app.get("/aggregated-health", async (req, res) => {
  try {
    const instances = [
      "http://backend-1:3001",
      "http://backend-2:3001",
      "http://backend-3:3001",
      "http://backend-4:3001",
      "http://backend-5:3001",
    ];

    const instanceData = await Promise.allSettled(
      instances.map(async (url) => {
        const response = await fetch(`${url}/health`);
        return response.json();
      })
    );

    const validData = instanceData
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    const totalConnections = validData.reduce(
      (sum, data) => sum + (data.connections?.totalSockets || 0),
      0
    );

    const totalActiveUsers = validData.reduce(
      (sum, data) => sum + (data.connections?.activeUsers || 0),
      0
    );

    const totalMemory = validData.reduce((sum, data) => {
      const memMB = parseInt(data.memory?.heapUsed?.replace(" MB", "") || "0");
      return sum + memMB;
    }, 0);

    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      aggregated: {
        totalConnections,
        totalActiveUsers,
        totalMemory: `${totalMemory} MB`,
        instanceCount: validData.length,
        instances: validData.map((data, i) => ({
          instance: i + 1,
          connections: data.connections?.totalSockets || 0,
          activeUsers: data.connections?.activeUsers || 0,
          memory: data.memory?.heapUsed || "0 MB",
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Memory-optimized WebSocket server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`💾 Memory info: http://localhost:${PORT}/memory`);
  console.log(`🔌 Redis URL: ${redisUrl}`);

  if (process.env.NODE_OPTIONS) {
    console.log(`⚙️  Node options: ${process.env.NODE_OPTIONS}`);
  }
});
