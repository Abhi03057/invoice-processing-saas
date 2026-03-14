const express = require("express");
const router = express.Router();

const upload = require("../config/multer");
const { authenticateToken } = require("../middleware/authMiddleware");

const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getInvoices
} = require("../controllers/documentController");

router.post("/", authenticateToken, upload.array("files", 10), uploadDocument);
router.get("/", authenticateToken, getDocuments);

// IMPORTANT: this must come BEFORE :id
router.get("/invoices", authenticateToken, getInvoices);

router.get("/:id", authenticateToken, getDocumentById);

module.exports = router;