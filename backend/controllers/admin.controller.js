// ============================================================
// controllers/admin.controller.js — Admin monitoring
// ============================================================
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");

// ── GET /api/admin/overview ───────────────────────────────────
// Returns live stats for the admin dashboard
exports.getOverview = async (req, res) => {
  try {
    const [totalPatients, totalDoctors, waitingCount, inProgressCount, completedToday] =
      await Promise.all([
        Patient.countDocuments({ role: "patient" }),
        Doctor.countDocuments(),
        Appointment.countDocuments({ status: "waiting" }),
        Appointment.countDocuments({ status: "in-progress" }),
        Appointment.countDocuments({
          status: "completed",
          completedAt: { $gte: startOfDay() },
        }),
      ]);

    res.json({
      totalPatients,
      totalDoctors,
      waitingCount,
      inProgressCount,
      completedToday,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/admin/all-queues ─────────────────────────────────
exports.getAllQueues = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate("userId", "name");
    const queues = await Promise.all(
      doctors.map(async (doc) => {
        const waiting = await Appointment.countDocuments({
          doctor: doc._id,
          status: "waiting",
        });
        const inProgress = await Appointment.findOne({
          doctor: doc._id,
          status: "in-progress",
        }).populate("patient", "name token");
        return {
          doctor: doc,
          waitingCount: waiting,
          currentPatient: inProgress,
        };
      })
    );
    res.json(queues);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── GET /api/admin/patients ───────────────────────────────────
exports.getAllPatients = async (req, res) => {
  try {
    const patients = await Patient.find({ role: "patient" }).select("-password");
    res.json(patients);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
