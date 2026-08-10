import express from "express";
import os from "os";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Pitchera Working Fine!!",
  });
});

app.get("/health", (req, res) => {
  res.json({
    message: "Pitchera Service is Running!!",
  });
});

const PORT = 3500;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const interfaces = os.networkInterfaces();

  console.log("IP Addresses:");

  for (const [name, addresses] of Object.entries(interfaces)) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) {
        console.log(`  ${name}: http://${address.address}:${PORT}`);
      }
    }
  }
});