const pool = require("../db/connection");

exports.getStats = async (req, res) => {
  try {

    const organizationId = req.user.organization_id;

    const result = await pool.query(
      `
      SELECT
        COUNT(*) AS total_documents,
        COUNT(*) FILTER (WHERE status = 'processed') AS processed,
        COUNT(*) FILTER (WHERE status = 'uploaded') AS uploaded,
        COUNT(*) FILTER (WHERE status = 'failed') AS failed
      FROM documents
      WHERE organization_id = $1
      `,
      [organizationId]
    );

    res.json(result.rows[0]);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching stats");
  }
};