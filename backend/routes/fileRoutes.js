const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Note = require("../models/notesModel");
const { verifyTeacher } = require("../middleware/authMiddleware");

const router = express.Router();

// Setup Multer
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Upload Note (Teacher Only)
router.post(
  "/upload",
  verifyTeacher,
  upload.single("file"),
  async (req, res) => {
    const { title, description, sessionId } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "File missing" });
    }

    const note = new Note({
      title,
      description,
      filename: req.file.filename,
      fileUrl: `${process.env.BASE_URL || "http://localhost:5000"}/uploads/${
        req.file.filename
      }`,
      uploadedBy: req.user.id,
      sessionId,
    });

    await note.save();

    res.status(201).json(note);
  }
);

// Get All Notes (For Session)
router.get("/list/:sessionId", async (req, res) => {
  const notes = await Note.find({ sessionId: req.params.sessionId }).sort({
    createdAt: -1,
  });
  res.json({ notes });
});

// Fetch all notes (admin/student view)
router.get("/all", async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch all notes." });
  }
});
// Delete Note (Teacher Only)
router.delete("/:noteId", verifyTeacher, async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note) return res.status(404).json({ error: "Note not found" });

  const filePath = path.join(__dirname, "../uploads", note.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

  await Note.findByIdAndDelete(req.params.noteId);

  res.json({ message: "Note deleted" });
});

// Edit Note Title/Description (Teacher Only)
router.put("/:noteId", verifyTeacher, async (req, res) => {
  const { title, description } = req.body;

  const note = await Note.findById(req.params.noteId);
  if (!note) return res.status(404).json({ error: "Note not found" });

  note.title = title || note.title;
  note.description = description || note.description;

  await note.save();

  res.json(note);
});

module.exports = router;
