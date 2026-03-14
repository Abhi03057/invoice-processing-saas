const fs = require("fs");
const pdfParse = require("pdf-parse");

async function parseInvoice(filePath) {

  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);

  const text = data.text;

  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  // ---------- Vendor ----------
  let vendor = null;

  const fromIndex = lines.findIndex(l => l.toUpperCase() === "INVOICE");

  if (lines[1]) {
    vendor = lines[1]; // usually company name under header
  }

  if (!vendor && lines.length > 0) {
    vendor = lines[0];
  }

  // ---------- Invoice Number ----------
  let invoiceNumber = null;

  const invoiceMatch =
    text.match(/INVOICE\s*NO\.?\s*[\n\s]*([0-9]+)/i) ||
    text.match(/#(\d+)/);

  if (invoiceMatch) {
    invoiceNumber = invoiceMatch[1];
  }

  // ---------- Date ----------
  let invoiceDate = null;

  const dateMatch =
    text.match(/DATE\s*[\n\s]*([0-9\-]+)/i) ||
    text.match(/Date:\s*([0-9\-]+)/i);

  if (dateMatch) {
    invoiceDate = dateMatch[1];
  }

  // ---------- Total ----------
  let total = null;

  const totalMatch =
    text.match(/Invoice total\s*([0-9.,]+)/i) ||
    text.match(/Invoice total\s*([0-9.,]+)/i) ||
    text.match(/TOTAL\s*([0-9.,]+)/i);

  if (totalMatch) {
    total = totalMatch[1]
      .replace(/\./g, "")
      .replace(",", ".");
  }

  return {
    invoice_number: invoiceNumber,
    vendor: vendor,
    invoice_date: invoiceDate,
    total: total
  };
}

module.exports = parseInvoice;