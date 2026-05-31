require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const Notification = require("./models/Notification");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());

// REST - bildirimleri getir
app.get("/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipient: req.params.userId,
    })
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// REST — okunmamış bildirim sayısı
app.get("/notifications/:userId/unread-count", async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.params.userId,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", service: "notification-service" });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB bağlantısı başarılı");
    const notificationHandler = require("./socket/notificationHandler");
    await notificationHandler(io);
    server.listen(3003, "0.0.0.0", () => {
      console.log("Notification Service çalışıyor: http://localhost:3003");
    });
  })
  .catch((err) => {
    console.error("MongoDB bağlantı hatası:", err.message);
    process.exit(1);
  });
