const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes");
const connectDB = require("./config/db");
const sessionRouter = require("./routes/sessionRouter");
const chatRouter = require("./routes/chatRoutes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
const socketHandler = require("./sockets/socketHandler");
const path = require("path");

socketHandler(io);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'", "http://localhost:5000"],
        "img-src": ["'self'", "http://localhost:5000", "data:"],
        "media-src": ["'self'", "http://localhost:5000"],
        "frame-ancestors": ["'self'", "http://localhost:5173"], // Allow your React frontend
      },
    },
  })
);
// Connect to MongoDB
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", fileRoutes);
app.use("/api/sessions", sessionRouter);
app.use("/api/chats", chatRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

io.on("connection", (socket) => {
  console.log("🔌 Client connected:", socket.id);

  // Forward teacher's offer to student
  socket.on("screen-share-offer", ({ offer, to }) => {
    io.to(to).emit("screen-share-offer", { offer, from: socket.id });
  });

  // Forward student's answer to teacher
  socket.on("screen-share-answer", ({ answer, to }) => {
    io.to(to).emit("screen-share-answer", { answer, from: socket.id });
  });

  // Forward ICE candidates both ways
  socket.on("ice-candidate", ({ candidate, to }) => {
    io.to(to).emit("ice-candidate", { candidate, from: socket.id });
  });

  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
