const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/authMiddleware");
const { getStats } = require("../controllers/statsController");

router.get("/", authenticateToken, getStats);

module.exports = router;