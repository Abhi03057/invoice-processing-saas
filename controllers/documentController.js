const pool = require("../db/connection");
const documentQueue = require("../queues/documentQueue");


// ===============================
// Upload Invoice
// ===============================
exports.uploadDocument = async (req, res) => {
  try {

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const organizationId = req.user.organization_id;

    const uploadedDocs = [];

    for (const file of req.files) {

      const result = await pool.query(
        "INSERT INTO documents (organization_id, file_path) VALUES ($1,$2) RETURNING *",
        [organizationId, file.path]
      );

      const document = result.rows[0];

      await documentQueue.add(
        "process-document",
        {
          documentId: document.id,
          filePath: file.path
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000
          }
        }
      );

      uploadedDocs.push(document);
    }

    res.json({
      message: "Documents uploaded. Processing started.",
      documents: uploadedDocs
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading documents");
  }
};


// ===============================
// Get Documents (with pagination)
// ===============================
exports.getDocuments = async (req, res) => {
  try {

    const organizationId = req.user.organization_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        id,
        file_path,
        status,
        uploaded_at,
        processed_at
       FROM documents
       WHERE organization_id = $1
       ORDER BY uploaded_at DESC
       LIMIT $2 OFFSET $3`,
      [organizationId, limit, offset]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching documents");
  }
};


// ===============================
// Get Single Document
// ===============================
exports.getDocumentById = async (req, res) => {
  try {

    const documentId = req.params.id;
    const organizationId = req.user.organization_id;

    const documentResult = await pool.query(
      `SELECT 
        id,
        file_path,
        status,
        uploaded_at,
        processed_at
       FROM documents
       WHERE id = $1 AND organization_id = $2`,
      [documentId, organizationId]
    );

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" });
    }

    const document = documentResult.rows[0];

    const invoiceResult = await pool.query(
      `SELECT *
       FROM invoice_data
       WHERE document_id = $1`,
      [documentId]
    );

    res.json({
      document,
      invoice_data: invoiceResult.rows[0] || null
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching document");
  }
};


// ===============================
// Get Extracted Invoices (pagination)
// ===============================
exports.getInvoices = async (req, res) => {
  try {

    const organizationId = req.user.organization_id;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT
        i.id,
        i.invoice_number,
        i.vendor,
        i.amount,
        i.invoice_date,
        i.tax,
        d.id as document_id,
        d.file_path,
        d.uploaded_at
      FROM invoice_data i
      JOIN documents d ON i.document_id = d.id
      WHERE d.organization_id = $1
      ORDER BY d.uploaded_at DESC
      LIMIT $2 OFFSET $3
      `,
      [organizationId, limit, offset]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching invoices");
  }
};