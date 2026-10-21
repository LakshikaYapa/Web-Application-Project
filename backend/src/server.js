const express = require("express");

const app = express();
const PORT = 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FloodGuard API is running",
  });
});

app.listen(PORT, () => {
  console.log(`FloodGuard backend: http://localhost:${PORT}`);
});