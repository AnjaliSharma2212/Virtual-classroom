const express = require("express");
const Session = require("../models/SessionModel");
const sessionRouter = express.Router();
const mongoose = require("mongoose");

// ⚠️ Placeholder for role-based middleware
// const { verifyToken, checkTeacherRole } = require("../middleware/auth");

// Teacher creates session
sessionRouter.post("/create", async (req, res) => {
  const { title, description, teacherId, startTime, endTime, scheduledDate } =
    req.body;

  if (!title || !description || !teacherId || !startTime || !endTime) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const session = new Session({
      title,
      description,
      teacherId,
      startedAt: new Date(),
      startTime,
      endTime,
      scheduledDate,
    });

    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Edit Session (Teacher)
sessionRouter.put("/:sessionId", async (req, res) => {
  const { title, description, startTime, endTime } = req.body;

  try {
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { title, description, startTime, endTime },
      { new: true }
    );

    if (!session) return res.status(404).json({ msg: "Session not found" });

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete Session (Teacher)
sessionRouter.delete("/:sessionId", async (req, res) => {
  try {
    const session = await Session.findByIdAndDelete(req.params.sessionId);

    if (!session) return res.status(404).json({ msg: "Session not found" });

    res.json({ msg: "Session deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Mark Session as Ended (NEW)
sessionRouter.patch("/:sessionId/end", async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.sessionId,
      { isActive: false, endedAt: new Date() },
      { new: true }
    );

    if (!session) return res.status(404).json({ msg: "Session not found" });

    res.json({ msg: "Session ended successfully.", session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// Mark session as completed
sessionRouter.put("/:id/complete", async (req, res) => {
  try {
    const { id } = req.params;
    await Session.findByIdAndUpdate(id, { isCompleted: true });
    res.json({ message: "Session marked as completed." });
  } catch (error) {
    res.status(500).json({ message: "Failed to mark session as completed." });
  }
});

// Fetch teacher's sessions
sessionRouter.get("/teacher/:teacherId", async (req, res) => {
  try {
    const sessions = await Session.find({ teacherId: req.params.teacherId });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch active sessions for students
sessionRouter.get("/active", async (req, res) => {
  try {
    const sessions = await Session.find({ isActive: true });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get session by ID
sessionRouter.get("/:sessionId", async (req, res) => {
  const { sessionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sessionId)) {
    return res.status(400).json({ error: "Invalid session ID format" });
  }

  try {
    const session = await Session.findById(sessionId);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = sessionRouter;
