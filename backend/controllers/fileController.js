const express = require("express");
const multer = require("multer");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/upload", upload.array("files"), (req, res) => {
  console.log("Received files:", req.files);
  res.status(200).json({ message: "Files uploaded successfully" });
});

module.exports = router;
