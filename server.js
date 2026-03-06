const express = require("express");
const pool = require("./db/connection");

const app = express();

app.use(express.json());

app.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).send("Database error");
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

app.post("/organizations", async (req, res) => {
  try {
    const { name, email } = req.body;

    const result = await pool.query(
      "INSERT INTO organizations (name, email) VALUES ($1, $2) RETURNING *",
      [name, email]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating organization");
  }
});

const bcrypt = require("bcrypt");

app.post("/users", async (req, res) => {
  try {
    const { name, email, password, organization_id } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, organization_id) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, email, hashedPassword, organization_id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error creating user");
  }
});