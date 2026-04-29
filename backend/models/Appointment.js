// ============================================================
// models/Appointment.js — Appointment schema
// ============================================================
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    // Priority: emergency > elderly > normal (FIFO within same priority)
    priority: {
      type: String,
      enum: ["emergency", "elderly", "normal"],
      default: "normal",
    },
    status: {
      type: String,
      enum: ["waiting", "in-progress", "completed", "cancelled"],
      default: "waiting",
    },
    // Auto-generated token like "A001", "A002" …
    token: { type: String, unique: true },
    symptoms: { type: String, default: "" },
    // Timestamps for analytics
    calledAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    // Predicted wait time in minutes (set at booking)
    predictedWaitTime: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Appointment", appointmentSchema);
