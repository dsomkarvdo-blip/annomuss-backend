// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import { createServer } from "http";
// import { dirname, join } from "path";
// import { Server } from "socket.io";
// import { fileURLToPath } from "url";
// import { connectDB } from "./db.js";
// import messageRoutes from "./routes/messages.js";
// // import mirrorReelRoutes from "./routes/mirrorReels.js";
// import moodRoutes from "./routes/moods.js";
// import otpRoutes from "./routes/otp.js";
// import postRoutes from "./routes/posts.js";
// import uploadRoutes from "./routes/upload.js";
// import userRoutes from "./routes/users.js";

// // app.use("/api/reels", mirrorReelRoutes);

// dotenv.config();

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// const app = express();
// const httpServer = createServer(app);

// const io = new Server(httpServer, {
//   cors: {
//     origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500",
//     credentials: true
//   }
// });

// const onlineUsers = new Map();

// // ─── Random Chat ──────────────────────────────────────────────────
// const waitingQueue = [];
// const activeRooms = new Map();

// function generateRoomId() {
//   return Math.random().toString(36).substring(2, 10);
// }

// function endRandomChat(roomId, reason) {
//   const room = activeRooms.get(roomId);
//   if (!room) return;
//   clearTimeout(room.timer);
//   io.to(roomId).emit("random-chat-ended", { reason });
//   activeRooms.delete(roomId);
//   console.log(`🔥 Random chat ended: Room ${roomId} | Reason: ${reason}`);
// }

// // ─── Socket.IO ────────────────────────────────────────────────────
// io.on("connection", (socket) => {

//   // ── Register ──────────────────────────────────────────────────
//   socket.on("register", (anonymousName) => {
//     onlineUsers.set(anonymousName, socket.id);
//     socket.anonymousName = anonymousName;
//     io.emit("user-online", { name: anonymousName });
//     console.log(`✅ User connected: ${anonymousName}`);
//   });

//   // ── Private message ───────────────────────────────────────────
//   socket.on("private-message", ({ from, to, message, fileUrl, fileName, isImage }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("private-message", { from, message, fileUrl, fileName, isImage });
//     } else {
//       socket.emit("message-failed", { to, reason: "User is offline" });
//     }
//   });

//   // ── Typing private chat ───────────────────────────────────────
//   socket.on("typing", ({ from, to }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) io.to(targetSocketId).emit("typing", { from });
//   });

//   // ── Random Chat: Join Queue ───────────────────────────────────
//   socket.on("join-random-chat", (anonymousName) => {
//     if (waitingQueue.find(u => u.socketId === socket.id)) return;

//     if (waitingQueue.length > 0) {
//       const partner = waitingQueue.shift();
//       const roomId = generateRoomId();

//       const room = {
//         user1: { socketId: partner.socketId, name: partner.name },
//         user2: { socketId: socket.id, name: anonymousName },
//         messages: [],
//         startTime: Date.now()
//       };
//       activeRooms.set(roomId, room);

//       socket.join(roomId);
//       io.sockets.sockets.get(partner.socketId)?.join(roomId);

//       io.to(roomId).emit("random-chat-matched", {
//         roomId,
//         duration: 5 * 60 * 1000
//       });

//       console.log(`✅ Matched: ${partner.name} ↔ ${anonymousName} | Room: ${roomId}`);

//       const timer = setTimeout(() => {
//         endRandomChat(roomId, "time");
//       }, 5 * 60 * 1000);

//       room.timer = timer;

//     } else {
//       waitingQueue.push({ socketId: socket.id, name: anonymousName });
//       socket.emit("random-chat-waiting");
//       console.log(`⏳ ${anonymousName} waiting...`);
//     }
//   });

//   // ── Random Chat: Send Message ─────────────────────────────────
//   socket.on("random-chat-message", ({ roomId, message }) => {
//     const room = activeRooms.get(roomId);
//     if (!room) return;

//     const from = room.user1.socketId === socket.id ? "Stranger A" : "Stranger B";
//     const msg = { from, message, time: new Date() };
//     room.messages.push(msg);
//     io.to(roomId).emit("random-chat-message", msg);
//   });

//   // ── Random Chat: Typing ───────────────────────────────────────
//   socket.on("random-chat-typing", ({ roomId }) => {
//     socket.to(roomId).emit("random-chat-typing");
//   });

//   // ── Random Chat: Leave ────────────────────────────────────────
//   socket.on("leave-random-chat", ({ roomId }) => {
//     endRandomChat(roomId, "left");
//   });

//   // ── Cancel waiting ────────────────────────────────────────────
//   socket.on("cancel-random-chat", () => {
//     const idx = waitingQueue.findIndex(u => u.socketId === socket.id);
//     if (idx !== -1) {
//       waitingQueue.splice(idx, 1);
//       socket.emit("random-chat-cancelled");
//     }
//   });

//   // ── Video Call: Call User ─────────────────────────────────────
//   socket.on("call-user", ({ to, offer, from }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("incoming-call", { from, offer });
//       console.log(`📞 Call: ${from} → ${to}`);
//     } else {
//       socket.emit("call-failed", { reason: `${to} is offline` });
//     }
//   });

//   // ── Video Call: Answer ────────────────────────────────────────
//   socket.on("call-answer", ({ to, answer }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("call-answered", { answer });
//       console.log(`✅ Call answered → ${to}`);
//     }
//   });

//   // ── Video Call: ICE Candidate ─────────────────────────────────
//   socket.on("ice-candidate", ({ to, candidate }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("ice-candidate", { candidate });
//     }
//   });

//   // ── Video Call: End Call ──────────────────────────────────────
//   socket.on("end-call", ({ to }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("call-ended");
//       console.log(`📵 Call ended → ${to}`);
//     }
//   });

//   // ── Video Call: Reject ────────────────────────────────────────
//   socket.on("reject-call", ({ to }) => {
//     const targetSocketId = onlineUsers.get(to);
//     if (targetSocketId) {
//       io.to(targetSocketId).emit("call-rejected");
//       console.log(`❌ Call rejected → ${to}`);
//     }
//   });

//   // ── Disconnect ────────────────────────────────────────────────
//   socket.on("disconnect", () => {
//     if (socket.anonymousName) {
//       onlineUsers.delete(socket.anonymousName);
//       io.emit("user-offline", { name: socket.anonymousName });
//       console.log(`❌ User disconnected: ${socket.anonymousName}`);
//     }

//     // Remove from waiting queue
//     const idx = waitingQueue.findIndex(u => u.socketId === socket.id);
//     if (idx !== -1) waitingQueue.splice(idx, 1);

//     // End any active random chat
//     for (const [roomId, room] of activeRooms.entries()) {
//       if (room.user1.socketId === socket.id || room.user2.socketId === socket.id) {
//         endRandomChat(roomId, "left");
//         break;
//       }
//     }
//   });

// }); // ← this closes io.on("connection")

// // ─── Middleware ───────────────────────────────────────────────────
// app.use(cors({
//   origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500",
//   credentials: true
// }));

// app.use(express.json());

// // Serve uploaded files
// app.use("/uploads", express.static(join(__dirname, "uploads")));

// // ─── Routes ───────────────────────────────────────────────────────
// app.use("/api/auth", otpRoutes);
// app.use("/api/messages", messageRoutes);
// app.use("/api/moods", moodRoutes);
// app.use("/api/users", userRoutes);
// app.use("/api/upload", uploadRoutes);
// app.use("/api/posts", postRoutes);
// // app.use("/api/mirror-reels", mirrorReelRoutes); 

// app.get("/", (req, res) => res.json({ status: "Anonymous Feelings API 🎭" }));

// // 404 handler
// app.use((req, res) => {
//   console.log("❌ 404:", req.method, req.url);
//   res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
// });

// // ─── Start Server ─────────────────────────────────────────────────
// const PORT = process.env.PORT || 3000;
// connectDB().then(() => {
//   httpServer.listen(PORT, () => {
//     console.log(`🚀 Server at http://localhost:${PORT}`);
//     console.log("✅ Routes: /api/auth | /api/messages | /api/moods | /api/users | /api/upload | /uploads");
//     console.log("✅ Sockets: private-chat | random-chat | video-call");
//   });
// });

// export { io };



// =============================================
// FILE: backend/server.js  (FULL UPDATED FILE)
// =============================================

// =============================================
// FILE: backend/server.js  (FULL UPDATED FILE)
// =============================================

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { dirname, join } from "path";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import { connectDB } from "./db.js";
import messageRoutes from "./routes/messages.js";
import moodRoutes from "./routes/moods.js";
import otpRoutes from "./routes/otp.js";
import postRoutes from "./routes/posts.js";
import reelRoutes from "./routes/reels.js"; // ← NEW
import uploadRoutes from "./routes/upload.js";
import userRoutes from "./routes/users.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500",
    credentials: true
  }
});

const onlineUsers = new Map();

// ─── Random Chat ──────────────────────────────────────────────────
const waitingQueue = [];
const activeRooms = new Map();

function generateRoomId() {
  return Math.random().toString(36).substring(2, 10);
}

function endRandomChat(roomId, reason) {
  const room = activeRooms.get(roomId);
  if (!room) return;
  clearTimeout(room.timer);
  io.to(roomId).emit("random-chat-ended", { reason });
  activeRooms.delete(roomId);
  console.log(`🔥 Random chat ended: Room ${roomId} | Reason: ${reason}`);
}

// ─── Socket.IO ────────────────────────────────────────────────────
io.on("connection", (socket) => {

  // ── Register ──────────────────────────────────────────────────
  socket.on("register", (anonymousName) => {
    onlineUsers.set(anonymousName, socket.id);
    socket.anonymousName = anonymousName;
    io.emit("user-online", { name: anonymousName });
    console.log(`✅ User connected: ${anonymousName}`);
  });

  // ── Private message ───────────────────────────────────────────
  socket.on("private-message", ({ from, to, message, fileUrl, fileName, isImage }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("private-message", { from, message, fileUrl, fileName, isImage });
    } else {
      socket.emit("message-failed", { to, reason: "User is offline" });
    }
  });

  // ── Typing private chat ───────────────────────────────────────
  socket.on("typing", ({ from, to }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) io.to(targetSocketId).emit("typing", { from });
  });

  // ── Random Chat: Join Queue ───────────────────────────────────
  socket.on("join-random-chat", (anonymousName) => {
    if (waitingQueue.find(u => u.socketId === socket.id)) return;

    if (waitingQueue.length > 0) {
      const partner = waitingQueue.shift();
      const roomId = generateRoomId();

      const room = {
        user1: { socketId: partner.socketId, name: partner.name },
        user2: { socketId: socket.id, name: anonymousName },
        messages: [],
        startTime: Date.now()
      };
      activeRooms.set(roomId, room);

      socket.join(roomId);
      io.sockets.sockets.get(partner.socketId)?.join(roomId);

      io.to(roomId).emit("random-chat-matched", { roomId, duration: 5 * 60 * 1000 });
      console.log(`✅ Matched: ${partner.name} ↔ ${anonymousName} | Room: ${roomId}`);

      const timer = setTimeout(() => { endRandomChat(roomId, "time"); }, 5 * 60 * 1000);
      room.timer = timer;
    } else {
      waitingQueue.push({ socketId: socket.id, name: anonymousName });
      socket.emit("random-chat-waiting");
      console.log(`⏳ ${anonymousName} waiting...`);
    }
  });

  // ── Random Chat: Send Message ─────────────────────────────────
  socket.on("random-chat-message", ({ roomId, message }) => {
    const room = activeRooms.get(roomId);
    if (!room) return;
    const from = room.user1.socketId === socket.id ? "Stranger A" : "Stranger B";
    const msg = { from, message, time: new Date() };
    room.messages.push(msg);
    io.to(roomId).emit("random-chat-message", msg);
  });

  // ── Random Chat: Typing ───────────────────────────────────────
  socket.on("random-chat-typing", ({ roomId }) => {
    socket.to(roomId).emit("random-chat-typing");
  });

  // ── Random Chat: Leave ────────────────────────────────────────
  socket.on("leave-random-chat", ({ roomId }) => { endRandomChat(roomId, "left"); });

  // ── Cancel waiting ────────────────────────────────────────────
  socket.on("cancel-random-chat", () => {
    const idx = waitingQueue.findIndex(u => u.socketId === socket.id);
    if (idx !== -1) { waitingQueue.splice(idx, 1); socket.emit("random-chat-cancelled"); }
  });

  // ── Video Call: Call User ─────────────────────────────────────
  socket.on("call-user", ({ to, offer, from }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", { from, offer });
      console.log(`📞 Call: ${from} → ${to}`);
    } else {
      socket.emit("call-failed", { reason: `${to} is offline` });
    }
  });

  // ── Video Call: Answer ────────────────────────────────────────
  socket.on("call-answer", ({ to, answer }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) { io.to(targetSocketId).emit("call-answered", { answer }); }
  });

  // ── Video Call: ICE Candidate ─────────────────────────────────
  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) { io.to(targetSocketId).emit("ice-candidate", { candidate }); }
  });

  // ── Video Call: End Call ──────────────────────────────────────
  socket.on("end-call", ({ to }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) { io.to(targetSocketId).emit("call-ended"); }
  });

  // ── Video Call: Reject ────────────────────────────────────────
  socket.on("reject-call", ({ to }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) { io.to(targetSocketId).emit("call-rejected"); }
  });

  // ── Disconnect ────────────────────────────────────────────────
  socket.on("disconnect", () => {
    if (socket.anonymousName) {
      onlineUsers.delete(socket.anonymousName);
      io.emit("user-offline", { name: socket.anonymousName });
      console.log(`❌ User disconnected: ${socket.anonymousName}`);
    }
    const idx = waitingQueue.findIndex(u => u.socketId === socket.id);
    if (idx !== -1) waitingQueue.splice(idx, 1);
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.user1.socketId === socket.id || room.user2.socketId === socket.id) {
        endRandomChat(roomId, "left");
        break;
      }
    }
  });

}); // ← closes io.on("connection")

// ─── Middleware ───────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://127.0.0.1:5500",
  credentials: true
}));

app.use(express.json());
app.use("/uploads", express.static(join(__dirname, "uploads")));
// app.use(express.static(join(__dirname, "..")));  // ← serves dashboard.html, reels.html etc.

app.use("/uploads", express.static(join(__dirname, "uploads")));
app.use(express.static(join(__dirname, "..")));  // ← must be here

// ─── Routes ───────────────────────────────────────────────────────
app.use("/api/auth",     otpRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/moods",    moodRoutes);
app.use("/api/users",    userRoutes);
app.use("/api/upload",   uploadRoutes);
app.use("/api/posts",    postRoutes);
app.use("/api/reels",    reelRoutes);   // ← NEW

app.get("/", (req, res) => res.json({ status: "Anonymous Feelings API 🎭" }));

app.use((req, res) => {
  console.log("❌ 404:", req.method, req.url);
  res.status(404).json({ message: `Route not found: ${req.method} ${req.url}` });
});

// ─── Start Server ─────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
connectDB().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server at http://localhost:${PORT}`);
    console.log("✅ Routes: /api/auth | /api/messages | /api/moods | /api/users | /api/upload | /api/posts | /api/reels");
    console.log("✅ Sockets: private-chat | random-chat | video-call");
  });
});

export { io };
