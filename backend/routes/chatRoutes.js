const express = require("express");
const multer = require("multer");
const path = require("path");
const ChatMessage = require("../models/chatModel");

const router = express.Router();

// File upload setup
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// GET all messages
router.get("/", async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Upload file
router.post("/upload", upload.single("file"), (req, res) => {
  const fileUrl = `${req.protocol}://${req.get(
    "host"
  )}/uploads/${encodeURIComponent(req.file.filename)}`;
  res.json({ fileUrl });
  console.log("Rendering image from URL:", getFileUrl(msg.fileUrl));
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await ChatMessage.findByIdAndDelete(id);
    res.json({ message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete message" });
  }
});
// Edit message content by ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    const updated = await ChatMessage.findByIdAndUpdate(
      id,
      { content },
      { new: true }
    );

    res.json({ message: "Message updated", updated });
  } catch (error) {
    res.status(500).json({ error: "Failed to update message" });
  }
});

module.exports = router;
