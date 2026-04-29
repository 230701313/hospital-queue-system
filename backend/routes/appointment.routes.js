// routes/appointment.routes.js
const router = require("express").Router();
const {
  bookAppointment,
  getMyAppointments,
  getDoctorQueue,
} = require("../controllers/appointment.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/book", protect, bookAppointment);            // POST /api/appointments/book
router.get("/my", protect, getMyAppointments);             // GET  /api/appointments/my
router.get("/queue/:doctorId", protect, getDoctorQueue);   // GET  /api/appointments/queue/:doctorId

module.exports = router;
