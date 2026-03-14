const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const pool = require("../db/connection");
const parseInvoice = require("../services/invoiceParser");

const connection = new IORedis({
  maxRetriesPerRequest: null
});

const worker = new Worker(
  "document-processing",
  async (job) => {

    const { documentId, filePath } = job.data;

    try {

      console.log("Processing document:", documentId);

      // 1️⃣ mark document as processing
      await pool.query(
        "UPDATE documents SET status='processing' WHERE id=$1",
        [documentId]
      );

      // 2️⃣ parse invoice
      const extractedData = await parseInvoice(filePath);

      console.log("Extracted data:", extractedData);

      // 3️⃣ validate extraction
      if (
        !extractedData ||
        (!extractedData.invoice_number &&
         !extractedData.vendor &&
         !extractedData.total)
      ) {
        throw new Error("Invoice parsing failed: no useful data extracted");
      }

      // 4️⃣ insert or update invoice data
      await pool.query(
        `INSERT INTO invoice_data
        (document_id, invoice_number, vendor, invoice_date, amount)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (invoice_number)
        DO UPDATE SET
          vendor = EXCLUDED.vendor,
          invoice_date = EXCLUDED.invoice_date,
          amount = EXCLUDED.amount,
          document_id = EXCLUDED.document_id`,
        [
          documentId,
          extractedData.invoice_number,
          extractedData.vendor,
          extractedData.invoice_date,
          extractedData.total
        ]
      );

      // 5️⃣ mark processed
      await pool.query(
        "UPDATE documents SET status='processed', processed_at=NOW() WHERE id=$1",
        [documentId]
      );

      console.log("Finished processing:", documentId);

    } catch (error) {

      console.error("Processing failed for document:", documentId);
      console.error(error.message);

      // 6️⃣ mark document failed
      await pool.query(
        "UPDATE documents SET status='failed' WHERE id=$1",
        [documentId]
      );

      // throw error so BullMQ can retry the job
      throw error;
    }
  },
  { connection }
);

console.log("Worker started");