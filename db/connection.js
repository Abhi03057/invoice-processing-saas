const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "invoice_saas",
  password: "postgres123", // replace with your actual postgres password
  port: 5432,
});

module.exports = pool;