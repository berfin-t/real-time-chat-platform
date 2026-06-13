const jwt = require("jsonwebtoken");
const { createClient } = require("redis");
const Notification = require("../models/Notification");

module.exports = async (io) => {
  //Redis subscriber oluştur
  const subscriber = createClient({ url: process.env.REDIS_URL });
  await subscriber.connect();
  console.log("Redis subscriber bağlandı");

  //socket için JWT doğrulama middleware'i
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Token bulunamadı"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Geçersiz token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`Kullanıcı bağlandı: ${userId}`);

    //kullanıcı kendi odasına katılır (direkt mesaj almak için)
    socket.join(userId);

    //Okunmamış bildirim
    socket.on("notifications:get", async () => {
      try {
        const notifications = await Notification.find({
          recipient: userId,
          isRead: false,
        })
          .sort({ createdAt: -1 })
          .limit(20);

        socket.emit("notifications:list", notifications);
      } catch (error) {
        console.error("error", { message: "Bildiriler alınamadı", error });
      }
    });

    //Bildirimi okundu olarak işaretle
    socket.on("notification:read", async (data) => {
      try {
        await Notification.findByIdAndUpdate(data.notificationId, {
          isRead: true,
        });

        socket.emit("notification:read:success", {
          notificationId: data.notificationId,
        });
      } catch (error) {
        console.error("error", { message: "Bildirim güncellenemedi", error });
      }
    });

    //Tüm bildirimleri okundu olarak işaretle
    socket.on("notifications:readAll", async () => {
      try {
        await Notification.updateMany(
          { recipient: userId, isRead: false },
          { isRead: true },
        );
        socket.emit("notifications:readAll:success");
      } catch (error) {
        console.error("Tüm bildirim okuma hatası:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log(`Notification socket ayrıldı: ${userId}`);
    });
  });

  // Redis'ten gelen eventleri dinle
  await subscriber.subscribe("chat:events", async (message) => {
    try {
      const event = JSON.parse(message);
      console.log("Redis eventi alındı:", event.type);

      if (event.type === 'new_message') {
        const { recipientId, senderId, senderUsername, content, conversationId } = event.data

        // Bildirimi kaydet
        const notification = await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type: 'new_message',
          content,
          metadata: { conversationId, senderUsername, preview: content.substring(0, 50) }
        })

        // Kullanıcı online ise socket ile bildir
        io.to(recipientId).emit('notification:new', notification)
      }

      if (event.type === 'new_message') {
        const { recipientId, senderId, senderUsername, content, conversationId } = event.data

        // Bildirimi kaydet
        const notification = await Notification.create({
          recipient: recipientId,
          sender: senderId,
          type: 'new_message',
          content,
          metadata: { conversationId, senderUsername, preview: content.substring(0, 50) }
        })

        // Kullanıcı online ise socket ile bildir
        io.to(recipientId).emit('notification:new', notification)
      }
    } catch (error) {
      console.error("Redis event işleme hatası:", error);
    }
  });
};
