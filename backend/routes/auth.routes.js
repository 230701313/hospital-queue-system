// routes/auth.routes.js
const router = require("express").Router();
const { register, login, getMe } = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth.middleware");

router.post("/register", register);   // POST /api/auth/register
router.post("/login", login);         // POST /api/auth/login
router.get("/me", protect, getMe);    // GET  /api/auth/me

module.exports = router;
