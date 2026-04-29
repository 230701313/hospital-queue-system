// routes/queue.routes.js
const router = require("express").Router();
const {
  callNext,
  completeConsultation,
  getQueueStatus,
  overridePriority,
} = require("../controllers/queue.controller");
const { protect, restrictTo } = require("../middleware/auth.middleware");

router.post("/next", protect, restrictTo("doctor"), callNext);
router.post("/complete", protect, restrictTo("doctor"), completeConsultation);
router.get("/status/:doctorId", getQueueStatus);           // Public — displayed on waiting screen
router.post("/override", protect, restrictTo("admin"), overridePriority);

module.exports = router;
