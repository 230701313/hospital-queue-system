// ============================================================
// middleware/auth.middleware.js — JWT verification
// ============================================================
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");

// Verify any authenticated user
exports.protect = async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Attach user (without password) to request
    req.user = await Patient.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Restrict route to specific roles
exports.restrictTo = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ message: `Role '${req.user.role}' is not allowed here` });
    }
    next();
  };
