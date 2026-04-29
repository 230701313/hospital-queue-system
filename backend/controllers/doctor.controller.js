// ============================================================
// controllers/doctor.controller.js — Doctor CRUD
// ============================================================
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// ── GET /api/doctors ─────────────────────────────────────────
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("userId", "name email phone");
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/doctors/:id ─────────────────────────────────────
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "userId",
      "name email phone"
    );
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/doctors ─ Admin creates a doctor profile ───────
exports.createDoctor = async (req, res) => {
  try {
    const { userId, specialization, department, avgConsultationTime } = req.body;

    // Ensure the user exists and update their role
    const user = await Patient.findByIdAndUpdate(
      userId,
      { role: "doctor" },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    const doctor = await Doctor.create({
      userId,
      specialization,
      department,
      avgConsultationTime: avgConsultationTime || 10,
    });

    res.status(201).json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── PUT /api/doctors/:id ─────────────────────────────────────
exports.updateDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── DELETE /api/doctors/:id ──────────────────────────────────
exports.deleteDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ message: "Doctor deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
