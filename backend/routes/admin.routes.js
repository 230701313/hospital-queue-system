// routes/admin.routes.js
const router = require("express").Router();
const {
  getOverview,
  getAllQueues,
  getAllPatients,
} = require("../controllers/admin.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.use(protect, restrictTo("admin")); // All admin routes require auth

router.get("/overview", getOverview);
router.get("/queues", getAllQueues);
router.get("/patients", getAllPatients);

module.exports = router;
