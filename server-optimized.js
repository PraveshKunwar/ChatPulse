const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Redis = require("redis");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e6,
  pingTimeout: 30000,
  pingInterval: 10000,
  upgradeTimeout: 10000,
  allowUpgrades: true,
  transports: ["websocket", "polling"],
  allowRequest: (req, callback) => {
    const clientIP =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    callback(null, true);
  },
});

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = Redis.createClient({
  url: redisUrl,
  socket: {
    connectTimeout: 5000,
    keepAlive: 30000,
    reconnectStrategy: (retries) => Math.min(retries * 50, 500),
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

redisClient.on("ready", () => {
  console.log("✅ Redis ready");

  redisClient
    .del("keywords")
    .then(() => {
      console.log("🧹 Cleared existing keywords");
    })
    .catch(console.error);
});

const activeUsers = new Map();
const userSockets = new Map();

setInterval(() => {
  let cleanedCount = 0;

  for (const [socketId, userId] of userSockets.entries()) {
    if (!io.sockets.sockets.has(socketId)) {
      userSockets.delete(socketId);
      activeUsers.delete(userId);
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`🧹 Cleaned up ${cleanedCount} zombie connections`);
  }

  if (global.gc) global.gc();
}, 10000);

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
  if (io.engine.clientsCount > 1000) {
    console.log(
      `🚫 Connection limit reached (${io.engine.clientsCount}), rejecting ${socket.id}`
    );
    socket.disconnect(true);
    return;
  }

  console.log(`User connected: ${socket.id} (${io.engine.clientsCount} total)`);

  // Force cleanup of rejected connections
  socket.on("disconnect", () => {
    if (io.engine.clientsCount > 1000) {
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
  res.json({
    status: "ok",
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
    },
    uptime: process.uptime(),
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
