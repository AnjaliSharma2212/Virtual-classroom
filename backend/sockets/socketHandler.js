const jwt = require("jsonwebtoken");
const ChatMessage = require("../models/chatModel");

module.exports = (io) => {
  // JWT Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Unauthorized"));

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return next(new Error("Unauthorized"));
      socket.user = user;
      next();
    });
  });

  const users = {}; // { socket.id: { sessionId, userId, role } }
  const activeSessions = {}; // { sessionId: [ { userId, socketId, username } ] }
  const activeScreenSharers = {};
  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // JOIN SESSION (Room)
    socket.on("join-session", ({ sessionId, role, username }) => {
      socket.join(sessionId);
      users[socket.id] = { sessionId, userId: socket.user.id, role };

      // Track active users per session
      if (!activeSessions[sessionId]) activeSessions[sessionId] = [];
      activeSessions[sessionId].push({
        userId: socket.user.id,
        socketId: socket.id,
        username,
        role,
      });

      console.log(
        `✅ User ${socket.user.id} (${role}) joined session ${sessionId}`
      );

      io.to(sessionId).emit("session-users", activeSessions[sessionId]);

      socket.to(sessionId).emit("user-joined", {
        userId: socket.user.id,
        sessionId,
        role,
        username,
      });
    });

    // WebRTC Signaling
    socket.on("webrtc-signal", ({ sessionId, data }) => {
      socket.to(sessionId).emit("webrtc-signal", {
        from: socket.user.id,
        data,
      });
    });
    io.on("connection", (socket) => {
      // Teacher starts screen share
      socket.on("start-screen-share", ({ sessionId }) => {
        activeScreenSharers[sessionId] = socket.id;
        io.to(sessionId).emit("screen-share-started", { sharerId: socket.id });
        console.log(`🎥 ${socket.id} started sharing in session ${sessionId}`);
      });

      // Teacher stops screen share
      socket.on("stop-screen-share", ({ sessionId }) => {
        delete activeScreenSharers[sessionId];
        io.to(sessionId).emit("screen-share-stopped");
        console.log(`🛑 Screen sharing stopped in session ${sessionId}`);
      });

      // Clean up if disconnected
      socket.on("disconnect", () => {
        const sessionId = Object.keys(activeScreenSharers).find(
          (key) => activeScreenSharers[key] === socket.id
        );
        if (sessionId) {
          delete activeScreenSharers[sessionId];
          io.to(sessionId).emit("screen-share-stopped");
        }
      });
    });

    // Whiteboard Collaboration
    socket.on("whiteboard-draw", ({ sessionId, drawData }) => {
      socket.to(sessionId).emit("whiteboard-draw", drawData);
    });
    socket.on("file-shared", ({ sessionId, file }) => {
      io.to(sessionId).emit("file-shared", { file });
    });

    // WebRTC Classic (Direct Signaling)
    socket.on("offer", ({ to, offer }) => {
      io.to(to).emit("offer", { from: socket.id, offer });
    });

    socket.on("answer", ({ to, answer }) => {
      io.to(to).emit("answer", { from: socket.id, answer });
    });

    socket.on("ice-candidate", ({ to, candidate }) => {
      io.to(to).emit("ice-candidate", { from: socket.id, candidate });
    });

    // Teacher-Specific Controls
    const isTeacher = () => users[socket.id]?.role === "teacher";

    socket.on("teacher-mute-all", ({ sessionId }) => {
      if (!isTeacher()) return;
      console.log(
        `🛑 Teacher ${socket.user.id} muted all in session ${sessionId}`
      );
      socket.to(sessionId).emit("force-mute");
    });

    socket.on("teacher-mute-student", ({ sessionId, targetSocketId }) => {
      if (!isTeacher()) return;
      console.log(`🔇 Teacher muted ${targetSocketId}`);
      io.to(targetSocketId).emit("force-mute");
    });

    socket.on("teacher-remove-student", ({ sessionId, targetSocketId }) => {
      if (!isTeacher()) return;
      console.log(`❌ Teacher removed ${targetSocketId}`);
      io.to(targetSocketId).emit("force-disconnect");
      io.sockets.sockets.get(targetSocketId)?.leave(sessionId);
    });

    // Cleanup on disconnect or leave
    const cleanup = () => {
      const sessionId = users[socket.id]?.sessionId;
      const userId = users[socket.id]?.userId;

      if (sessionId) {
        // Remove from active session
        activeSessions[sessionId] = (activeSessions[sessionId] || []).filter(
          (user) => user.socketId !== socket.id
        );

        io.to(sessionId).emit("session-users", activeSessions[sessionId]);
        socket.to(sessionId).emit("user-left", { userId });
      }

      delete users[socket.id];
    };

    socket.on("leave-session", cleanup);

    socket.on("disconnect", () => {
      cleanup();
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

const chatSocketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log("🟢 New chat connection:", socket.id);

    socket.on("send-message", async (messageData) => {
      const newMessage = await ChatMessage.create(messageData);

      io.emit("new-message", newMessage); // Broadcast to all clients
    });

    socket.on("disconnect", () => {
      console.log("🔴 Chat client disconnected:", socket.id);
    });
  });
};

module.exports = chatSocketHandler;
