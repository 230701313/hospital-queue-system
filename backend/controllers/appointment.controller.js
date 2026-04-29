// ============================================================
// controllers/appointment.controller.js — Booking logic
// ============================================================
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const { generateToken, sortQueue, predictWaitTime } = require("../utils/queueLogic");
const { emitQueueUpdate } = require("../utils/socket");

// ── POST /api/appointments/book ──────────────────────────────
exports.bookAppointment = async (req, res) => {
  try {
    const { doctorId, symptoms, priorityOverride } = req.body;
    const patient = req.user;

    // Validate doctor
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: "Doctor not found" });

    // Determine priority (admin override > patient default)
    let priority = patient.defaultPriority;
    if (priorityOverride && req.user.role === "admin") {
      priority = priorityOverride;
    }
    if (symptoms && symptoms.toLowerCase().includes("emergency")) {
      priority = "emergency";
    }

    // Get or create queue document for this doctor
    let queueDoc = await Queue.findOne({ doctor: doctorId });
    if (!queueDoc) {
      queueDoc = await Queue.create({ doctor: doctorId });
    }

    // Generate token
    const token = generateToken(queueDoc);

    // Get current sorted queue to predict wait time
    const waitingAppointments = await Appointment.find({
      doctor: doctorId,
      status: "waiting",
    });
    const sorted = sortQueue(waitingAppointments);
    const predictedWaitTime = predictWaitTime(
      sorted,
      priority,
      doctor.avgConsultationTime
    );

    // Create appointment
    const appointment = await Appointment.create({
      patient: patient._id,
      doctor: doctorId,
      priority,
      symptoms,
      token,
      predictedWaitTime,
    });

    // Add to queue entries
    queueDoc.entries.push({
      appointment: appointment._id,
      position: queueDoc.entries.length + 1,
    });
    await queueDoc.save();

    // Broadcast queue update to all watching this doctor
    const updatedQueue = await getPopulatedQueue(doctorId);
    emitQueueUpdate(doctorId, { queue: updatedQueue });

    res.status(201).json({
      message: "Appointment booked successfully",
      appointment,
      token,
      predictedWaitTime,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/appointments/my ─────────────────────────────────
exports.getMyAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate("doctor", "specialization department")
      .populate({ path: "doctor", populate: { path: "userId", select: "name" } })
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/appointments/queue/:doctorId ────────────────────
exports.getDoctorQueue = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const queue = await getPopulatedQueue(doctorId);
    res.json(queue);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Shared helper ────────────────────────────────────────────
async function getPopulatedQueue(doctorId) {
  const appointments = await Appointment.find({
    doctor: doctorId,
    status: "waiting",
  }).populate("patient", "name age phone defaultPriority");

  return sortQueue(appointments);
}
