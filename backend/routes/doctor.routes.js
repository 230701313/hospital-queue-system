// routes/doctor.routes.js
const router = require("express").Router();
const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctor.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.get("/", getAllDoctors);
router.get("/:id", getDoctorById);
router.post("/", protect, restrictTo("admin"), createDoctor);
router.put("/:id", protect, restrictTo("admin"), updateDoctor);
router.delete("/:id", protect, restrictTo("admin"), deleteDoctor);

module.exports = router;
