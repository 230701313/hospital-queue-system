// ============================================================
// models/Doctor.js — Doctor profile schema
// ============================================================
const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    // Links to the Patient (user) account with role="doctor"
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    specialization: { type: String, required: true },
    department: { type: String, required: true },
    // Average minutes per consultation (used for wait-time prediction)
    avgConsultationTime: { type: Number, default: 10 },
    isAvailable: { type: Boolean, default: true },
    currentPatient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doctor", doctorSchema);
