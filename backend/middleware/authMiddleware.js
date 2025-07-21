const jwt = require("jsonwebtoken");

exports.verifyTeacher = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.log("Missing or malformed Authorization header");
    return res.status(401).json({ error: "Unauthorized - No token provided" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Token verification failed:", err.message);
      return res.status(401).json({ error: "Invalid token" });
    }

    if (decoded.role !== "teacher") {
      console.log(`Access denied for user role: ${decoded.role}`);
      return res.status(403).json({ error: "Access denied - Not a teacher" });
    }

    req.user = decoded;
    next();
  });
};
