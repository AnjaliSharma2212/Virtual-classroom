const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  scheduledDate: { type: String, required: true }, // e.g., "2025-07-15"
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Session", sessionSchema);
