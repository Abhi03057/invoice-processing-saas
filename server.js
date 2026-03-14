const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
const organizationRoutes = require("./routes/organizations");
const userRoutes = require("./routes/users");
const documentRoutes = require("./routes/documents");
const statsRoutes = require("./routes/stats");

app.use("/auth", authRoutes);
app.use("/organizations", organizationRoutes);
app.use("/users", userRoutes);
app.use("/documents", documentRoutes);
app.use("/stats", statsRoutes);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});