const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["teacher", "student"],
    required: true,
    default: "student",
  },
});

module.exports = mongoose.model("User", userSchema);
