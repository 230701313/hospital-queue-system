// ============================================================
// controllers/auth.controller.js — Register & Login
// ============================================================
const jwt = require("jsonwebtoken");
const Patient = require("../models/Patient");

/** Generate a signed JWT valid for 7 days */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

// ── POST /api/auth/register ──────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone, age, role } = req.body;

    // Prevent duplicate emails
    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Derive default priority from age (≥60 = elderly)
    const defaultPriority = age >= 60 ? "elderly" : "normal";

    const user = await Patient.create({
      name,
      email,
      password,
      phone,
      age,
      role: role || "patient",
      defaultPriority,
    });

    const token = signToken(user._id);
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        defaultPriority: user.defaultPriority,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/auth/login ─────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await Patient.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = signToken(user._id);
    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        defaultPriority: user.defaultPriority,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/auth/me ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json(req.user);
};
