// ============================================================
// models/Queue.js — Per-doctor queue snapshot schema
// ============================================================
const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
    },
    // Ordered list of appointment IDs currently in queue
    entries: [
      {
        appointment: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Appointment",
        },
        position: Number,
      },
    ],
    // Running token counter per doctor (resets daily)
    tokenCounter: { type: Number, default: 0 },
    lastResetDate: { type: String, default: "" }, // "YYYY-MM-DD"
  },
  { timestamps: true }
);

module.exports = mongoose.model("Queue", queueSchema);
