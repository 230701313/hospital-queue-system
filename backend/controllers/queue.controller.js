// ============================================================
// controllers/queue.controller.js — Doctor queue actions
// ============================================================
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Queue = require("../models/Queue");
const { sortQueue } = require("../utils/queueLogic");
const { emitQueueUpdate, emitPatientNotification } = require("../utils/socket");

// ── POST /api/queue/next ─────────────────────────────────────
// Doctor calls the next patient in their queue
exports.callNext = async (req, res) => {
  try {
    // Doctor's profile linked via userId
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) return res.status(404).json({ message: "Doctor profile not found" });

    // Get sorted waiting queue
    const waitingAppointments = await Appointment.find({
      doctor: doctor._id,
      status: "waiting",
    }).populate("patient", "name age");

    const sorted = sortQueue(waitingAppointments);
    if (sorted.length === 0) {
      return res.status(200).json({ message: "Queue is empty" });
    }

    const next = sorted[0];

    // Mark as in-progress
    next.status = "in-progress";
    next.calledAt = new Date();
    await next.save();

    // Update doctor's currentPatient
    doctor.currentPatient = next.patient._id;
    await doctor.save();

    // Notify patient it's their turn
    emitPatientNotification(String(next.patient._id), {
      message: `🔔 It's your turn! Token: ${next.token}`,
      token: next.token,
      doctorId: doctor._id,
    });

    // Broadcast updated waiting queue
    const remaining = await getWaitingQueue(doctor._id);
    emitQueueUpdate(String(doctor._id), {
      queue: remaining,
      currentPatient: next,
    });

    res.json({ message: "Patient called", appointment: next });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── POST /api/queue/complete ─────────────────────────────────
// Doctor marks consultation complete
exports.completeConsultation = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId).populate(
      "patient",
      "name"
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    appointment.status = "completed";
    appointment.completedAt = new Date();
    await appointment.save();

    // Calculate actual consultation duration and update doctor's avg
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (doctor && appointment.calledAt) {
      const durationMin =
        (new Date() - new Date(appointment.calledAt)) / 60000;
      // Rolling average
      doctor.avgConsultationTime = Math.round(
        (doctor.avgConsultationTime * 0.8 + durationMin * 0.2)
      );
      doctor.currentPatient = null;
      await doctor.save();
    }

    // Broadcast queue refresh
    const remaining = await getWaitingQueue(doctor._id);
    emitQueueUpdate(String(doctor._id), { queue: remaining, currentPatient: null });

    res.json({ message: "Consultation completed", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/queue/status/:doctorId ─────────────────────────
exports.getQueueStatus = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const queue = await getWaitingQueue(doctorId);
    const inProgress = await Appointment.findOne({
      doctor: doctorId,
      status: "in-progress",
    }).populate("patient", "name token");

    res.json({ queue, currentPatient: inProgress });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Admin: override priority ─────────────────────────────────
exports.overridePriority = async (req, res) => {
  try {
    const { appointmentId, priority } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { priority },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const remaining = await getWaitingQueue(appointment.doctor);
    emitQueueUpdate(String(appointment.doctor), { queue: remaining });

    res.json({ message: "Priority updated", appointment });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Helper ───────────────────────────────────────────────────
async function getWaitingQueue(doctorId) {
  const appointments = await Appointment.find({
    doctor: doctorId,
    status: "waiting",
  }).populate("patient", "name age phone defaultPriority");
  return sortQueue(appointments);
}
