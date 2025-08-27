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
});

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisClient = Redis.createClient({ url: redisUrl });
redisClient.connect().catch(console.error);

const activeUsers = new Set();

setInterval(async () => {
  try {
    const count = await redisClient.get("messages_count");
    const keywords = await redisClient.zRange("keywords", 0, 4, {
      WITHSCORES: true,
    });

    const keywordsObj = {};
    for (let i = 0; i < keywords.length; i += 2) {
      keywordsObj[keywords[i]] = parseInt(keywords[i + 1]);
    }

    io.emit("metrics", {
      messagesPerSec: parseInt(count) || 0,
      activeUsers: activeUsers.size,
      keywords: keywordsObj,
    });

    await redisClient.set("messages_count", 0);
  } catch (error) {
    console.error("Error collecting metrics:", error);
  }
}, 1000);

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("user_joined", ({ userId }) => {
    activeUsers.add(userId);
    io.emit("metrics", { activeUsers: activeUsers.size });
  });

  socket.on("message_sent", async ({ userId, text }) => {
    try {
      await redisClient.incr("messages_count");

      const words = text
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 2);
      for (const word of words) {
        await redisClient.zIncrBy("keywords", 1, word);
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  socket.on("user_left", ({ userId }) => {
    activeUsers.delete(userId);
    io.emit("metrics", { activeUsers: activeUsers.size });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Redis URL: ${redisUrl}`);
});
