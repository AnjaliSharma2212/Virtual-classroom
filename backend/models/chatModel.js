const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    senderName: { type: String },
    content: { type: String },
    fileUrl: { type: String },
    fileType: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChatMessage", chatSchema);
