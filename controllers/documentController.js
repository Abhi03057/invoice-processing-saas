const pool = require("../db/connection");
const documentQueue = require("../queues/documentQueue");

exports.uploadDocument = async (req, res) => {
  try {

    // check file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const organizationId = req.user.organization_id;
    const filePath = req.file.path;

    // 1️⃣ save document record
    const result = await pool.query(
      "INSERT INTO documents (organization_id, file_path) VALUES ($1,$2) RETURNING *",
      [organizationId, filePath]
    );

    const document = result.rows[0];

    // 2️⃣ add job to queue
    await documentQueue.add("process-document", {
      documentId: document.id,
      filePath: filePath
    });

    // 3️⃣ return response immediately
    res.json({
      message: "Document uploaded. Processing started in background.",
      document
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error uploading document");
  }
};

exports.getDocuments = async (req, res) => {
  try {

    const organizationId = req.user.organization_id;

    const result = await pool.query(
      `SELECT 
        id,
        file_path,
        status,
        uploaded_at,
        processed_at
       FROM documents
       WHERE organization_id = $1
       ORDER BY uploaded_at DESC`,
      [organizationId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching documents");
  }
};

exports.getDocumentById = async (req, res) => {
  try {

    const documentId = req.params.id;
    const organizationId = req.user.organization_id;

    // fetch document
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

    // fetch extracted invoice data
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
exports.getInvoices = async (req, res) => {
  try {

    const organizationId = req.user.organization_id;

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
      `,
      [organizationId]
    );

    res.json(result.rows);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching invoices");
  }
};